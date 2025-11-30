import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UploadStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function parseBytes(input: string): number | null {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  };
  const match = input.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2] || "b";
  // @ts-expect-error
  if (!units[unit]) return null;
  // @ts-expect-error
  return Math.floor(value * units[unit]);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = 1000;
  const m = s * 60;
  const h = m * 60;
  const d = h * 24;

  if (ms >= d) return `${parseFloat((ms / d).toFixed(2))}d`;
  if (ms >= h) return `${parseFloat((ms / h).toFixed(2))}h`;
  if (ms >= m) return `${parseFloat((ms / m).toFixed(2))}m`;
  return `${parseFloat((ms / s).toFixed(2))}s`;
}

export function parseDuration(input: string): number | null {
  const units = {
    ms: 1,
    s: 1000,
    m: 1000 * 60,
    h: 1000 * 60 * 60,
    d: 1000 * 60 * 60 * 24,
  };
  const match = input.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2] || "ms";
  // @ts-expect-error
  if (!units[unit]) return null;
  // @ts-expect-error
  return Math.floor(value * units[unit]);
}

export function getStatusLabel(status: UploadStatus, progress: number): string {
  switch (status) {
    case "completed":
      return "Done";
    case "error":
      return "Error";
    case "pending":
      return "Queued";
    case "paused":
      return "Paused";
    default:
      return `${progress.toFixed(0)}%`;
  }
}

export function calculateGlobalProgress(
  files: Array<{ id: string; file: File }>,
  fileStatuses: Map<string, UploadStatus>,
  fileProgress: Map<string, number>,
): {
  completedCount: number;
  globalProgress: number;
  isGlobalComplete: boolean;
  isGlobalError: boolean;
} {
  if (files.length === 0) {
    return {
      completedCount: 0,
      globalProgress: 0,
      isGlobalComplete: false,
      isGlobalError: false,
    };
  }

  const completedCount = files.filter(
    (f) => fileStatuses.get(f.id) === "completed",
  ).length;

  const hasError = files.some((f) => fileStatuses.get(f.id) === "error");

  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);
  const loadedSize = files.reduce((acc, f) => {
    const progress = fileProgress.get(f.id) || 0;
    const status = fileStatuses.get(f.id);
    const effectiveProgress = status === "completed" ? 100 : progress;
    return acc + (f.file.size * effectiveProgress) / 100;
  }, 0);

  return {
    completedCount,
    globalProgress: totalSize > 0 ? (loadedSize / totalSize) * 100 : 0,
    isGlobalComplete: completedCount === files.length,
    isGlobalError: hasError,
  };
}

export function normalize(s: string) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractError(err: string): {
  status_code: number | null;
  message: string;
} {
  const status = err.match(/response code:\s*(\d+)/i);
  const message = err.match(/response text:\s*(.*?)\s*,\s*request id/i);

  return {
    status_code: status ? Number(status[1]) : null,
    message: message ? message[1] : err,
  };
}

export const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

export const camelToSnake = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
