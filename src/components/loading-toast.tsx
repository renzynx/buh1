import { useEffect } from "react";
import { toast } from "sonner";

export function LoadingToast() {
  useEffect(() => {
    const toastId = toast.loading("Loading...");
    return () => {
      toast.dismiss(toastId);
    };
  }, []);

  return null;
}
