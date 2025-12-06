import { Spinner } from "./ui/spinner";

export function LoadingToast() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Spinner className="size-8" />
    </div>
  );
}
