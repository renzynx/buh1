import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/router";
import type { auth } from "./auth";
import type { UPLOAD_STATUS } from "./constants";

export type UploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];

export interface UploadControl {
  start: () => void;
  pause: () => void;
  cancel: () => void;
}

export interface FileUploadState {
  status: UploadStatus;
  progress: number;
}

export type FileRow = {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  slug: string;
};

export type FolderRow = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
  userId: string;
};

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

export type SnakeToCamelCase<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Lowercase<Head>}${Capitalize<SnakeToCamelCase<Tail>>}`
    : Lowercase<S>;

export type CamelCaseKeys<T> =
  T extends Array<infer U>
    ? Array<CamelCaseKeys<U>>
    : T extends object
      ? {
          [K in keyof T as SnakeToCamelCase<K & string>]: CamelCaseKeys<T[K]>;
        }
      : T;
