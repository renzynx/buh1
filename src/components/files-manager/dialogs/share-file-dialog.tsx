import { Copy, CopyCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { usePageContext } from "vike-react/usePageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClipboard } from "@/hooks/use-clipboard";
import type { FileRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSettings } from "@/stores/settings-store";

export function ShareFileDialog({
  file,
  setFile,
}: {
  file: FileRow | null;
  setFile: (file: FileRow | null) => void;
}) {
  const { settings } = useSettings();
  const { copied, copyToClipboard } = useClipboard();
  const { baseUrl } = usePageContext();
  const shareUrl = `${settings.cdnUrl || baseUrl}/api/f/${file?.encodedId}`;

  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => !open && setFile(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
          <DialogDescription>
            Share "{file?.filename}" with others using the link or QR code
            below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          {/* QR Code */}
          <div className="flex justify-center p-4 rounded-lg">
            <QRCodeSVG
              value={shareUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Share Link */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="share-link">Share Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={shareUrl}
                readOnly
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                size="icon"
                variant={copied ? "default" : "outline"}
                className={cn({
                  "text-green-500 hover:text-green-600": copied,
                })}
                onClick={() =>
                  copyToClipboard(
                    shareUrl,
                    `Copied ${file?.filename} link to clipboard!`,
                  )
                }
              >
                {copied ? <CopyCheck /> : <Copy />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can download the file.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
