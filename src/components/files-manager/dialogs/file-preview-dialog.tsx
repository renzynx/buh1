import { useQuery } from "@tanstack/react-query";
import { AlertCircle, File, Music } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { FileRow } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { useSettings } from "@/stores/settings-store";

export function FilePreviewDialog({
  file,
  setFile,
}: {
  file: FileRow | null;
  setFile: (f: FileRow | null) => void;
}) {
  const [open, setOpen] = React.useState(Boolean(file));
  const { settings } = useSettings();

  React.useEffect(() => {
    setOpen(Boolean(file));
  }, [file]);

  const mt = file?.mimeType ?? "";
  const isTextType =
    mt.startsWith("text/") ||
    mt === "application/json" ||
    mt === "application/xml";

  const {
    data: textContent,
    isLoading: isTextLoading,
    isError: isTextError,
  } = useQuery({
    queryKey: ["file-preview", file?.encodedId],
    queryFn: async () => {
      if (!file) return null;
      const res = await fetch(
        `${settings.cdnUrl || ""}/api/f/${file.encodedId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch preview");
      return res.text();
    },
    enabled: !!file && isTextType,
    retry: false,
  });

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setFile(null);
  };

  if (!file) return null;

  const src = `${settings.cdnUrl || ""}/api/f/${file.encodedId}`;

  const renderPreview = () => {
    if (mt.startsWith("image/")) {
      return (
        <img
          src={src}
          alt={file.filename}
          className="max-h-full w-auto max-w-full object-contain rounded shadow-sm"
        />
      );
    }

    if (mt.startsWith("video/")) {
      return (
        <video
          controls
          className="max-h-full w-full max-w-4xl rounded bg-black shadow-sm"
          aria-label={file.filename}
        >
          <source src={src} type={mt} />
          <track kind="captions" srcLang="en" src={`${src}.vtt`} />
          Your browser does not support the video tag.
        </video>
      );
    }

    if (mt.startsWith("audio/")) {
      return (
        <div className="w-full max-w-md p-6 bg-secondary/20 rounded-lg border flex flex-col items-center justify-center gap-4">
          <Music className="h-10 w-10" />
          <audio controls className="w-full" aria-label={file.filename}>
            <source src={src} type={mt} />
            <track kind="captions" srcLang="en" src={`${src}.vtt`} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    if (mt === "application/pdf") {
      return (
        <iframe
          src={src}
          title={file.filename}
          className="h-full w-full rounded border bg-white"
        />
      );
    }

    if (isTextType) {
      if (isTextLoading) {
        return (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Spinner />
            <span>Loading preview...</span>
          </div>
        );
      }

      if (isTextError) {
        return (
          <div className="flex flex-col items-center justify-center gap-3 text-destructive py-12">
            <AlertCircle className="h-10 w-10" />
            <p>Failed to load text preview</p>
          </div>
        );
      }

      if (textContent != null) {
        return (
          <pre className="h-full w-full overflow-auto rounded-md bg-muted p-4 text-sm font-mono whitespace-pre-wrap break-all">
            {textContent}
          </pre>
        );
      }
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground py-12">
        <File className="h-10 w-10" />
        <div className="text-center">
          <p>No preview available</p>
          <p className="text-xs font-mono mt-1">{mt || "Unknown Type"}</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="break-all pr-8">{file.filename}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {file.size != null && <span>{formatBytes(file.size)}</span>}
            <span>•</span>
            <span className="font-mono text-xs">{mt || "unknown"}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 md:p-6 bg-card flex items-center justify-center min-h-0">
          {renderPreview()}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background shrink-0 gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
