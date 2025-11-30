export const UPLOAD_STATUS = {
  PENDING: "pending",
  UPLOADING: "uploading",
  PAUSED: "paused",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

export const UPLOADER_CONFIG = {
  DEFAULT_ENDPOINT: "/api/upload",
  DEFAULT_CONCURRENT_LIMIT: 5,
  DEFAULT_RETRY_DELAYS: [0, 3000, 5000, 10000] as number[],
  MAX_FILE_LIST_HEIGHT: 300,
  PROGRESS_BAR_HEIGHT: 1.5,
  CHUNK_SIZE: 25 * 1024 * 1024, // 25 MB.
} as const;

export const COMMON_FILE_EXTENSIONS = [
  "exe",
  "bat",
  "sh",
  "cmd",
  "js",
  "ts",
  "jsx",
  "tsx",
  "py",
  "rb",
  "php",
  "dll",
  "msi",
  "apk",
  "dmg",
  "iso",
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
];
