import {
  AlertCircle,
  FileIcon,
  Pause,
  Play,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFileUpload } from "@/hooks/use-file-upload";
import { UPLOAD_STATUS } from "@/lib/constants";
import type { UploadControl, UploadStatus } from "@/lib/types";
import { cn, formatBytes, getStatusLabel } from "@/lib/utils";
import { useUploadStore } from "@/stores/upload-store";

interface FileRowProps {
  fileId: string;
  file: File;
  endpoint: string;
  onControlReady: (fileId: string, control: UploadControl) => void;
  onStatusChange: (fileId: string, status: UploadStatus) => void;
  onProgressChange: (fileId: string, progress: number) => void;
}

export function FileRow({
  fileId,
  file,
  endpoint,
  onControlReady,
  onStatusChange,
  onProgressChange,
}: FileRowProps) {
  const { status, progress, actions } = useFileUpload({
    fileId,
    file,
    endpoint,
    onControlReady,
    onStatusChange,
    onProgressChange,
  });
  const { removeFileFromQueue, fileErrors, fileStatusCodes } = useUploadStore();

  const handleCancel = () => {
    actions.cancel();
    removeFileFromQueue(fileId);
  };

  const statusLabel = getStatusLabel(status as UploadStatus, progress);
  const errorMessage = fileErrors?.[fileId] || "Upload failed. Click retry.";
  const statusCode = fileStatusCodes?.[fileId];

  // Disable retry for specific error codes: 401 (Unauthorized), 403 (Forbidden), 413 (Payload Too Large)
  const isRetryDisabled =
    statusCode === 401 || statusCode === 403 || statusCode === 413;

  return (
    <div className="relative flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
        <FileIcon className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-1">
          <p
            className="truncate text-sm font-medium leading-none max-w-[240px]"
            title={file.name}
          >
            {file.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatBytes(file.size)}</span>
            <span>•</span>
            <span className="capitalize font-medium">{statusLabel}</span>
          </div>
        </div>
        <Progress
          value={progress}
          className={cn(
            "h-1.5",
            status === UPLOAD_STATUS.COMPLETED
              ? "[&>div]:bg-green-500"
              : status === UPLOAD_STATUS.ERROR
                ? "[&>div]:bg-red-500"
                : "",
          )}
        />
        {status === UPLOAD_STATUS.ERROR && (
          <div className="border border-destructive p-1 rounded-md text-xs text-destructive px-4 py-2 flex items-center gap-4">
            <AlertCircle className="size-4" />
            {errorMessage}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 ml-2">
        {status === UPLOAD_STATUS.UPLOADING && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={actions.pause}
          >
            <Pause className="h-4 w-4" />
          </Button>
        )}
        {status === UPLOAD_STATUS.PAUSED && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={actions.resume}
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        {status === UPLOAD_STATUS.ERROR && !isRetryDisabled && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={actions.retry}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={handleCancel}
        >
          {status === UPLOAD_STATUS.COMPLETED ? (
            <X className="h-4 w-4" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
