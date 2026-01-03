import { useState } from "react";
import { toast } from "sonner";

type ClipboardHookOptions = {
  openToastOnSuccess?: boolean;
  openToastOnError?: boolean;
  timeoutMs?: number;
};

export function useClipboard({
  openToastOnSuccess = true,
  openToastOnError = true,
  timeoutMs = 2000,
}: ClipboardHookOptions = {}) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard(text: string, successMessage?: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeoutMs);
      if (openToastOnSuccess) {
        toast.success(successMessage ?? "Copied to clipboard");
      }
    } catch {
      if (openToastOnError) {
        toast.error("Failed to copy to clipboard");
      }
    }
  }

  return { copyToClipboard, copied };
}
