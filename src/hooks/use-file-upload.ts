import { useEffect, useRef } from "react";
import { useTusStore } from "use-tus";
import { usePageContext } from "vike-react/usePageContext";
import { extractError } from "@/lib/utils";
import { useUploadStore } from "@/stores/upload-store";
import { UPLOAD_STATUS, UPLOADER_CONFIG } from "../lib/constants";
import type { UploadControl, UploadStatus } from "../lib/types";

interface UseFileUploadOptions {
  fileId: string;
  file: File;
  endpoint: string;
  onControlReady: (fileId: string, control: UploadControl) => void;
  onStatusChange: (fileId: string, status: UploadStatus) => void;
  onProgressChange: (fileId: string, progress: number) => void;
}

export function useFileUpload({
  fileId,
  file,
  endpoint,
  onControlReady,
  onStatusChange,
  onProgressChange,
}: UseFileUploadOptions) {
  const { upload, setUpload, remove, isUploading, isSuccess, error } =
    useTusStore(fileId, { autoStart: false, uploadOptions: {} });
  const {
    settings: { uploadFileChunkSize },
    session,
  } = usePageContext();

  const {
    fileStatuses,
    fileProgress,
    setFileStatus,
    setFileProgress,
    setFileError,
    clearFileError,
    selectedFolderId,
  } = useUploadStore();

  const status = fileStatuses?.[fileId] || UPLOAD_STATUS.PENDING;
  const progress = Number(fileProgress?.[fileId] ?? 0);
  const hasStartedRef = useRef(false);
  const controlReadyRef = useRef(false);

  useEffect(() => {
    if (upload || !session) return;

    setUpload(file, {
      endpoint,
      retryDelays: UPLOADER_CONFIG.DEFAULT_RETRY_DELAYS,
      chunkSize: uploadFileChunkSize,
      removeFingerprintOnSuccess: true,
      metadata: {
        filename: file.name,
        filetype: file.type,
        userId: session.user.id,
        folderId: selectedFolderId || "",
      },
      onProgress: (bytesUploaded: number, bytesTotal: number) => {
        const percentage = (bytesUploaded / bytesTotal) * 100;
        setFileProgress(fileId, percentage);
        onProgressChange(fileId, percentage);
      },
      onError: (err) => {
        const { message: errorMessage, status_code } = extractError(
          err.message,
        );
        setFileError(fileId, errorMessage, status_code);
        setFileStatus(fileId, UPLOAD_STATUS.ERROR);
        onStatusChange(fileId, UPLOAD_STATUS.ERROR);
      },
      onSuccess: () => {
        setFileStatus(fileId, UPLOAD_STATUS.COMPLETED);
        setFileProgress(fileId, 100);
        onStatusChange(fileId, UPLOAD_STATUS.COMPLETED);
      },
    });
  }, [
    file,
    setUpload,
    endpoint,
    upload,
    fileId,
    setFileProgress,
    setFileStatus,
    session,
    setFileError,
    onStatusChange,
    onProgressChange,
    selectedFolderId,
    uploadFileChunkSize,
  ]);

  // Register control for external usage
  useEffect(() => {
    if (!upload || controlReadyRef.current) return;

    const control: UploadControl = {
      start: () => {
        if (!hasStartedRef.current) {
          upload.start();
          setFileStatus(fileId, UPLOAD_STATUS.UPLOADING);
          hasStartedRef.current = true;
        }
      },
      pause: () => {
        upload.abort();
        setFileStatus(fileId, UPLOAD_STATUS.PAUSED);
      },
      cancel: () => {
        upload.abort();
        remove();
      },
    };

    onControlReady(fileId, control);
    controlReadyRef.current = true;
  }, [upload, fileId, onControlReady, remove, setFileStatus]);

  const prevIsUploadingRef = useRef(isUploading);
  const prevIsSuccessRef = useRef(isSuccess);
  const prevErrorRef = useRef(error);

  useEffect(() => {
    if (isUploading && !prevIsUploadingRef.current) {
      setFileStatus(fileId, UPLOAD_STATUS.UPLOADING);
      onStatusChange(fileId, UPLOAD_STATUS.UPLOADING);
    }
    if (isSuccess && !prevIsSuccessRef.current) {
      setFileStatus(fileId, UPLOAD_STATUS.COMPLETED);
      setFileProgress(fileId, 100);
      onStatusChange(fileId, UPLOAD_STATUS.COMPLETED);
    }
    if (error && !prevErrorRef.current) {
      setFileStatus(fileId, UPLOAD_STATUS.ERROR);
      onStatusChange(fileId, UPLOAD_STATUS.ERROR);
    }

    prevIsUploadingRef.current = isUploading;
    prevIsSuccessRef.current = isSuccess;
    prevErrorRef.current = error;
  }, [
    isUploading,
    isSuccess,
    error,
    fileId,
    setFileStatus,
    setFileProgress,
    onStatusChange,
  ]);

  const actions = {
    pause: () => {
      if (upload) {
        upload.abort();
        setFileStatus(fileId, UPLOAD_STATUS.PAUSED);
      }
    },
    resume: () => {
      if (upload) {
        clearFileError(fileId);
        upload.start();
        setFileStatus(fileId, UPLOAD_STATUS.UPLOADING);
      }
    },
    retry: () => {
      if (upload) {
        hasStartedRef.current = false;
        clearFileError(fileId);
        setFileStatus(fileId, UPLOAD_STATUS.PENDING);
        upload.start();
        setFileStatus(fileId, UPLOAD_STATUS.UPLOADING);
        hasStartedRef.current = true;
      }
    },
    cancel: () => {
      if (upload) {
        upload.abort();
        remove();
      }
    },
  };

  return { status, progress, actions };
}
