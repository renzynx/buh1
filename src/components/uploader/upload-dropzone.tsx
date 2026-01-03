import { Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { useUploadStore } from "@/hooks/use-upload-store";
import { cn, formatBytes } from "@/lib/utils";

export const UploadDropzone = () => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addFilesToQueue } = useUploadStore();
  const {
    settings: { uploadFileMaxSize },
  } = useSettings();

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        addFilesToQueue(files);
      }
    },
    [addFilesToQueue],
  );

  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.repeat) {
        try {
          const clipboardItems = await navigator.clipboard.read();
          const files: File[] = [];

          for (const item of clipboardItems) {
            for (const type of item.types) {
              if (type.startsWith("image/") || type === "text/plain") {
                const blob = await item.getType(type);
                const extension = type.split("/")[1] || "bin";
                const filename = `clipboard-${Date.now()}.${extension}`;
                const file = new File([blob], filename, { type });
                files.push(file);
                break;
              }
            }
          }

          if (files.length > 0) {
            e.preventDefault();
            addFilesToQueue(files);
          }
        } catch {}
      }
    },
    [addFilesToQueue],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePaste, handleKeyDown]);

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
