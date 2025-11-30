import { useCallback, useMemo, useRef } from "react";
import { UPLOAD_STATUS } from "@/lib/constants";
import type { UploadControl, UploadStatus } from "@/lib/types";
import { calculateGlobalProgress } from "@/lib/utils";
import { useUploadStore } from "@/stores/upload-store";

interface UseUploadQueueOptions {
  files: Array<{ id: string; file: File }>;
  concurrentLimit: number;
}

export function useUploadQueue({
  files,
  concurrentLimit,
}: UseUploadQueueOptions) {
  const {
    fileStatuses: fileStatusesRecord,
    fileProgress: fileProgressRecord,
    setFileStatus,
    setFileProgress,
  } = useUploadStore();

  const fileStatuses = useMemo(() => {
    return new Map<string, UploadStatus>(
      Object.entries(fileStatusesRecord) as [string, UploadStatus][],
    );
  }, [fileStatusesRecord]);

  const fileProgress = useMemo(() => {
    return new Map<string, number>(
      Object.entries(fileProgressRecord).map(([k, v]) => [k, Number(v)]),
    );
  }, [fileProgressRecord]);
  const controlsRef = useRef<Map<string, UploadControl>>(new Map());

  const queueRef = useRef<string[]>([]);
  const activeSetRef = useRef<Set<string>>(new Set());

  const handleStatusChange = useCallback(
    (fileId: string, status: UploadStatus) => {
      // Avoid redundant writes
      if ((fileStatusesRecord[fileId] as UploadStatus) === status) return;

      setFileStatus(fileId, status);

      // Update semaphore state based on status transitions
      const wasActive = activeSetRef.current.has(fileId);

      if (status === UPLOAD_STATUS.UPLOADING) {
        if (!wasActive) {
          activeSetRef.current.add(fileId);
          // ensure it's not queued
          queueRef.current = queueRef.current.filter((id) => id !== fileId);
        }
      } else if (wasActive) {
        activeSetRef.current.delete(fileId);
        const nextId = queueRef.current.shift();
        if (nextId) {
          const ctrl = controlsRef.current.get(nextId);
          if (ctrl) {
            try {
              ctrl.start();
              activeSetRef.current.add(nextId);
            } catch {
              // ignore; will be retried when control registers or next status update occurs
            }
          }
        }
      }
    },
    [fileStatusesRecord, setFileStatus],
  );

  const handleProgressChange = useCallback(
    (fileId: string, progress: number) => {
      // Avoid redundant writes
      if (Number(fileProgressRecord[fileId]) === progress) return;
      setFileProgress(fileId, progress);
    },
    [fileProgressRecord, setFileProgress],
  );

  const handleControlReady = useCallback(
    (fileId: string, control: UploadControl) => {
      controlsRef.current.set(fileId, control);

      // Try to acquire a slot immediately
      const activeCount = activeSetRef.current.size;
      if (activeCount < concurrentLimit) {
        const status = fileStatuses.get(fileId) || UPLOAD_STATUS.PENDING;
        if (status === UPLOAD_STATUS.PENDING) {
          try {
            control.start();
            activeSetRef.current.add(fileId);
            // ensure it's not queued
            queueRef.current = queueRef.current.filter((id) => id !== fileId);
            return;
          } catch {
            // ignore sync start errors
          }
        }
      }

      // Otherwise enqueue (if not already present)
      if (!queueRef.current.includes(fileId)) queueRef.current.push(fileId);
    },
    [concurrentLimit, fileStatuses],
  );

  // Calculate global statistics
  const baseStats = useMemo(
    () => calculateGlobalProgress(files, fileStatuses, fileProgress),
    [files, fileStatuses, fileProgress],
  );

  // Expose additional debugging info: queue length and active count
  const stats = {
    ...baseStats,
    queueLength: queueRef.current.length,
    activeCount: activeSetRef.current.size,
  };

  // Note: concurrency is handled via the semaphore (queueRef + activeSetRef).

  return {
    fileStatuses,
    fileProgress,
    stats,
    // filesToStart removed; queue controls starts
    handleStatusChange,
    handleProgressChange,
    handleControlReady,
  };
}
