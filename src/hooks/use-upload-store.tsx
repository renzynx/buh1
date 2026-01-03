"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

export interface UploadRequest {
  id: string;
  file: File;
}

interface UploadState {
  files: UploadRequest[];
  isOpen: boolean;
  fileStatuses: Record<string, string>;
  fileProgress: Record<string, number>;
  fileErrors: Record<string, string>;
  fileStatusCodes: Record<string, number | null>;
  selectedFolderId: string | null;
}

type UploadAction =
  | { type: "ADD_FILES"; payload: UploadRequest[] }
  | { type: "REMOVE_FILE"; payload: string }
  | { type: "SET_OPEN"; payload: boolean }
  | { type: "SET_STATUS"; payload: { fileId: string; status: string } }
  | { type: "SET_PROGRESS"; payload: { fileId: string; progress: number } }
  | {
      type: "SET_ERROR";
      payload: { fileId: string; error: string; statusCode?: number | null };
    }
  | { type: "CLEAR_ERROR"; payload: string }
  | { type: "REMOVE_FILE_STATE"; payload: string }
  | { type: "CLEAR_COMPLETED" }
  | { type: "SET_SELECTED_FOLDER"; payload: string | null };

const initialState: UploadState = {
  files: [],
  isOpen: false,
  fileStatuses: {},
  fileProgress: {},
  fileErrors: {},
  fileStatusCodes: {},
  selectedFolderId: null,
};

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case "ADD_FILES":
      return {
        ...state,
        files: [...state.files, ...action.payload],
        isOpen: true,
      };

    case "REMOVE_FILE": {
      const id = action.payload;
      const { [id]: _s, ...fileStatuses } = state.fileStatuses;
      const { [id]: _p, ...fileProgress } = state.fileProgress;
      const { [id]: _e, ...fileErrors } = state.fileErrors;
      const { [id]: _c, ...fileStatusCodes } = state.fileStatusCodes;
      return {
        ...state,
        files: state.files.filter((f) => f.id !== id),
        fileStatuses,
        fileProgress,
        fileErrors,
        fileStatusCodes,
      };
    }

    case "SET_OPEN":
      return { ...state, isOpen: action.payload };

    case "SET_STATUS": {
      const { fileId, status } = action.payload;
      if (state.fileStatuses[fileId] === status) return state;
      return {
        ...state,
        fileStatuses: { ...state.fileStatuses, [fileId]: status },
      };
    }

    case "SET_PROGRESS": {
      const { fileId, progress } = action.payload;
      if (state.fileProgress[fileId] === progress) return state;
      return {
        ...state,
        fileProgress: { ...state.fileProgress, [fileId]: progress },
      };
    }

    case "SET_ERROR": {
      const { fileId, error, statusCode } = action.payload;
      if (
        state.fileErrors[fileId] === error &&
        state.fileStatusCodes[fileId] === statusCode
      ) {
        return state;
      }
      return {
        ...state,
        fileErrors: { ...state.fileErrors, [fileId]: error },
        fileStatusCodes: {
          ...state.fileStatusCodes,
          [fileId]: statusCode ?? null,
        },
      };
    }

    case "CLEAR_ERROR": {
      const fileId = action.payload;
      if (!state.fileErrors[fileId]) return state;
      return {
        ...state,
        fileErrors: { ...state.fileErrors, [fileId]: "" },
        fileStatusCodes: { ...state.fileStatusCodes, [fileId]: null },
      };
    }

    case "REMOVE_FILE_STATE": {
      const fileId = action.payload;
      const { [fileId]: _s, ...fileStatuses } = state.fileStatuses;
      const { [fileId]: _p, ...fileProgress } = state.fileProgress;
      const { [fileId]: _e, ...fileErrors } = state.fileErrors;
      const { [fileId]: _c, ...fileStatusCodes } = state.fileStatusCodes;
      return {
        ...state,
        fileStatuses,
        fileProgress,
        fileErrors,
        fileStatusCodes,
      };
    }

    case "CLEAR_COMPLETED": {
      const completedIds = new Set(
        Object.entries(state.fileStatuses)
          .filter(([, status]) => status === "completed")
          .map(([id]) => id)
      );

      return {
        ...state,
        files: state.files.filter((f) => !completedIds.has(f.id)),
        fileStatuses: Object.fromEntries(
          Object.entries(state.fileStatuses).filter(
            ([k]) => !completedIds.has(k)
          )
        ),
        fileProgress: Object.fromEntries(
          Object.entries(state.fileProgress).filter(
            ([k]) => !completedIds.has(k)
          )
        ),
        fileErrors: Object.fromEntries(
          Object.entries(state.fileErrors).filter(([k]) => !completedIds.has(k))
        ),
        fileStatusCodes: Object.fromEntries(
          Object.entries(state.fileStatusCodes).filter(
            ([k]) => !completedIds.has(k)
          )
        ),
      };
    }

    case "SET_SELECTED_FOLDER":
      return { ...state, selectedFolderId: action.payload };

    default:
      return state;
  }
}

interface UploadContextValue extends UploadState {
  addFilesToQueue: (newFiles: File[]) => void;
  removeFileFromQueue: (id: string) => void;
  setUploaderOpen: (isOpen: boolean) => void;
  setFileStatus: (fileId: string, status: string) => void;
  setFileProgress: (fileId: string, progress: number) => void;
  setFileError: (
    fileId: string,
    error: string,
    statusCode?: number | null
  ) => void;
  clearFileError: (fileId: string) => void;
  removeFileState: (fileId: string) => void;
  clearCompletedFiles: () => void;
  setSelectedFolderId: (folderId: string | null) => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uploadReducer, initialState);

  const addFilesToQueue = useCallback((newFiles: File[]) => {
    const timestamp = Date.now();
    const newRequests = newFiles.map((file, i) => ({
      id: `upload-${timestamp}-${i}-${Math.random().toString(36).slice(2)}`,
      file,
    }));
    dispatch({ type: "ADD_FILES", payload: newRequests });
  }, []);

  const removeFileFromQueue = useCallback((id: string) => {
    dispatch({ type: "REMOVE_FILE", payload: id });
  }, []);

  const setUploaderOpen = useCallback((isOpen: boolean) => {
    dispatch({ type: "SET_OPEN", payload: isOpen });
  }, []);

  const setFileStatus = useCallback((fileId: string, status: string) => {
    dispatch({ type: "SET_STATUS", payload: { fileId, status } });
  }, []);

  const setFileProgress = useCallback((fileId: string, progress: number) => {
    dispatch({ type: "SET_PROGRESS", payload: { fileId, progress } });
  }, []);

  const setFileError = useCallback(
    (fileId: string, error: string, statusCode?: number | null) => {
      dispatch({ type: "SET_ERROR", payload: { fileId, error, statusCode } });
    },
    []
  );

  const clearFileError = useCallback((fileId: string) => {
    dispatch({ type: "CLEAR_ERROR", payload: fileId });
  }, []);

  const removeFileState = useCallback((fileId: string) => {
    dispatch({ type: "REMOVE_FILE_STATE", payload: fileId });
  }, []);

  const clearCompletedFiles = useCallback(() => {
    dispatch({ type: "CLEAR_COMPLETED" });
  }, []);

  const setSelectedFolderId = useCallback((folderId: string | null) => {
    dispatch({ type: "SET_SELECTED_FOLDER", payload: folderId });
  }, []);

  const value = useMemo<UploadContextValue>(
    () => ({
      ...state,
      addFilesToQueue,
      removeFileFromQueue,
      setUploaderOpen,
      setFileStatus,
      setFileProgress,
      setFileError,
      clearFileError,
      removeFileState,
      clearCompletedFiles,
      setSelectedFolderId,
    }),
    [
      state,
      addFilesToQueue,
      removeFileFromQueue,
      setUploaderOpen,
      setFileStatus,
      setFileProgress,
      setFileError,
      clearFileError,
      removeFileState,
      clearCompletedFiles,
      setSelectedFolderId,
    ]
  );

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
}

export function useUploadStore(): UploadContextValue {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUploadStore must be used within an UploadProvider");
  }
  return context;
}
