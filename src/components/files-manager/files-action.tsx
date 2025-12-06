import { Download, Eye, FolderInput, Share2, Trash2 } from "lucide-react";
import type { FileRow } from "@/lib/types";
import { useSettings } from "@/stores/settings-store";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function FileActions({
  file,
  onDelete,
  onPreview,
  onShare,
  onMove,
}: {
  file: FileRow;
  onDelete: (ids: string[]) => void;
  onPreview?: (file: FileRow) => void;
  onShare?: (file: FileRow) => void;
  onMove?: (ids: string[]) => void;
}) {
  const { settings } = useSettings();

  const download = () => {
    const link = document.createElement("a");
    link.href = `${settings.cdnUrl || ""}/api/f/${file.encodedId}`;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" onClick={download}>
            <Download />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => onPreview?.(file)}
          >
            <Eye />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Preview</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="outline" onClick={() => onShare?.(file)}>
            <Share2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Share</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            onClick={() => file.id && onMove?.([file.id])}
          >
            <FolderInput />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Move</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="destructive"
            onClick={() => file.id && onDelete([file.id])}
          >
            <Trash2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </div>
  );
}
