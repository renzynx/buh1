import { clientOnly } from "vike-react/clientOnly";
import "./tailwind.css";
import { ImpersonatingMenu } from "@/components/impersonating-menu";
import { Toaster } from "@/components/ui/sonner";
import { GlobalUploader } from "@/components/uploader/global-uploader";
import "@bprogress/core/css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const Providers = clientOnly(() =>
  import("@/components/providers").then((mod) => mod.Providers),
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
      <GlobalUploader />
      <ImpersonatingMenu />
      <Toaster position="bottom-center" richColors />
      <ReactQueryDevtools initialIsOpen={false} />
    </Providers>
  );
}
