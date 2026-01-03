import { UPLOADER_CONFIG } from "@/lib/constants";
import type { UploadControl, UploadStatus } from "@/lib/types";
import { FileRow } from "./file-row";

interface FileListProps {
  files: Array<{ id: string; file: File }>;
  endpoint: string;
  onControlReady: (fileId: string, control: UploadControl) => void;
  onStatusChange: (fileId: string, status: UploadStatus) => void;
  onProgressChange: (fileId: string, progress: number) => void;
  visible?: boolean;
}

export function FileList({
  files,
  endpoint,
  onControlReady,
  onStatusChange,
  onProgressChange,
  visible = true,
}: FileListProps) {
  const maxH = UPLOADER_CONFIG.MAX_FILE_LIST_HEIGHT;
  const containerStyle: React.CSSProperties = {
    transition: "max-height 260ms ease, opacity 180ms ease, padding 200ms ease",
    maxHeight: visible ? `${maxH}px` : "0px",
    opacity: visible ? 1 : 0,
    overflow: "hidden",
    pointerEvents: visible ? "auto" : "none",
    paddingLeft: visible ? "1rem" : "0",
    paddingRight: visible ? "1rem" : "0",
    paddingBottom: visible ? "1rem" : "0",
    paddingTop: "0",
  };

  return (
    <div style={containerStyle} aria-hidden={!visible}>
      <div className="pr-2">
        <div
          className="overflow-y-auto"
          style={{ maxHeight: `${UPLOADER_CONFIG.MAX_FILE_LIST_HEIGHT}px` }}
        >
          <div className="space-y-3">
            {files.map((f) => (
              <FileRow
                key={f.id}
                fileId={f.id}
                file={f.file}
                endpoint={endpoint}
                onControlReady={onControlReady}
                onStatusChange={onStatusChange}
                onProgressChange={onProgressChange}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
