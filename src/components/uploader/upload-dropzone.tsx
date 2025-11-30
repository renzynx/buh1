import { Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { cn, formatBytes } from "@/lib/utils";
import { useUploadStore } from "@/stores/upload-store";

export const UploadDropzone = () => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addFilesToQueue } = useUploadStore();
  const {
    settings: { uploadFileMaxSize },
  } = usePageContext();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files || []);
      if (dropped.length > 0) {
        addFilesToQueue(dropped);
      }
    },
    [addFilesToQueue],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length > 0) {
        addFilesToQueue(selected);
        e.target.value = "";
      }
    },
    [addFilesToQueue],
  );

  return (
    <div
      className={cn(
        "relative flex flex-col w-full min-h-[280px] rounded-xl border-2 transition-all duration-200 items-center justify-center p-8 text-center cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/5",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />
      <div className="p-4 rounded-full bg-muted/50 mb-4">
        <Upload className="h-8 w-8 opacity-70" />
      </div>
      <p className="font-medium text-sm mb-1">Click or drag files to upload</p>
      <p className="text-xs text-muted-foreground">
        Supported formats: all files. Max size per file:{" "}
        {formatBytes(uploadFileMaxSize)}.
      </p>
    </div>
  );
};
