import { create } from "vike-react-zustand";

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

  addFilesToQueue: (newFiles: File[]) => void;
  removeFileFromQueue: (id: string) => void;
  setUploaderOpen: (isOpen: boolean) => void;
  setFileStatus: (fileId: string, status: string) => void;
  setFileProgress: (fileId: string, progress: number) => void;
  setFileError: (
    fileId: string,
    error: string,
    statusCode?: number | null,
  ) => void;
  clearFileError: (fileId: string) => void;
  removeFileState: (fileId: string) => void;
  clearCompletedFiles: () => void;
  setSelectedFolderId: (folderId: string | null) => void;
}

export const useUploadStore = create<UploadState>()((set, get) => ({
  files: [],
  isOpen: false,
  fileStatuses: {},
  fileProgress: {},
  fileErrors: {},
  fileStatusCodes: {},
  selectedFolderId: null,

  addFilesToQueue: (newFiles) =>
    set((state) => {
      const timestamp = Date.now();
      const newRequests = newFiles.map((file, i) => ({
        id: `upload-${timestamp}-${i}-${Math.random().toString(36).slice(2)}`,
        file,
      }));
      return {
        files: [...state.files, ...newRequests],
        isOpen: true,
      };
    }),

  removeFileFromQueue: (id) =>
    set((state) => {
      const newStatuses = { ...state.fileStatuses };
      delete newStatuses[id];
      const newProgress = { ...state.fileProgress };
      delete newProgress[id];
      const newErrors = { ...state.fileErrors };
      delete newErrors[id];
      const newStatusCodes = { ...state.fileStatusCodes };
      delete newStatusCodes[id];

      return {
        files: state.files.filter((f) => f.id !== id),
        fileStatuses: newStatuses,
        fileProgress: newProgress,
        fileErrors: newErrors,
        fileStatusCodes: newStatusCodes,
      };
    }),

  setUploaderOpen: (isOpen) => set({ isOpen }),

  setFileStatus: (fileId, status) => {
    // Avoid redundant updates that can trigger re-render loops
    const prev = get().fileStatuses[fileId];
    if (prev === status) return;
    set((state) => ({
      fileStatuses: { ...state.fileStatuses, [fileId]: status },
    }));
  },

  setFileProgress: (fileId, progress) => {
    const prev = Number(get().fileProgress[fileId]);
    if (prev === Number(progress)) return;
    set((state) => ({
      fileProgress: { ...state.fileProgress, [fileId]: progress },
    }));
  },

  setFileError: (fileId, error, statusCode) => {
    const prev = get().fileErrors[fileId];
    const prevCode = get().fileStatusCodes[fileId];
    if (prev === error && prevCode === statusCode) return;
    set((state) => ({
      fileErrors: { ...state.fileErrors, [fileId]: error },
      fileStatusCodes: {
        ...state.fileStatusCodes,
        [fileId]: statusCode ?? null,
      },
    }));
  },
  clearFileError: (fileId) => {
    const prev = get().fileErrors[fileId];
    if (!prev) return;
    set((state) => ({
      fileErrors: { ...state.fileErrors, [fileId]: "" },
      fileStatusCodes: { ...state.fileStatusCodes, [fileId]: null },
    }));
  },

  removeFileState: (fileId) =>
    set((state) => {
      const newStatuses = { ...state.fileStatuses };
      delete newStatuses[fileId];
      const newProgress = { ...state.fileProgress };
      delete newProgress[fileId];
      const newErrors = { ...state.fileErrors };
      delete newErrors[fileId];
      const newStatusCodes = { ...state.fileStatusCodes };
      delete newStatusCodes[fileId];
      return {
        fileStatuses: newStatuses,
        fileProgress: newProgress,
        fileErrors: newErrors,
        fileStatusCodes: newStatusCodes,
      };
    }),

  clearCompletedFiles: () =>
    set((state) => {
      const completedIds = new Set(
        Object.entries(state.fileStatuses)
          .filter(([_, status]) => status === "completed")
          .map(([id]) => id),
      );

      const files = state.files.filter((f) => !completedIds.has(f.id));

      const newStatuses = Object.fromEntries(
        Object.entries(state.fileStatuses).filter(
          ([k]) => !completedIds.has(k),
        ),
      );

      const newProgress = Object.fromEntries(
        Object.entries(state.fileProgress).filter(
          ([k]) => !completedIds.has(k),
        ),
      );

      const newErrors = Object.fromEntries(
        Object.entries(state.fileErrors).filter(([k]) => !completedIds.has(k)),
      );

      const newStatusCodes = Object.fromEntries(
        Object.entries(state.fileStatusCodes).filter(
          ([k]) => !completedIds.has(k),
        ),
      );

      return {
        files,
        fileStatuses: newStatuses,
        fileProgress: newProgress,
        fileErrors: newErrors,
        fileStatusCodes: newStatusCodes,
      };
    }),

  setSelectedFolderId: (folderId) => set({ selectedFolderId: folderId }),
}));
