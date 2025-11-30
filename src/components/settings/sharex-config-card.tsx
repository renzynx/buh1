import { Download, KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { usePageContext } from "vike-react/usePageContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";

export function ShareXConfigCard() {
  const { data: session } = useSession();
  const apiKey = session?.user?.apiKey;
  const { baseUrl, appName } = usePageContext();

  const handleDownload = () => {
    if (!apiKey) {
      toast.error("You need an API key to download the ShareX config.");
      return;
    }

    const config = {
      Version: "18.0.1",
      Name: `${appName} Uploader`,
      DestinationType: "ImageUploader, TextUploader, FileUploader",
      RequestMethod: "POST",
      RequestURL: `${baseUrl}/api/upload-file`,
      Headers: {
        "x-api-key": apiKey,
      },
      Body: "MultipartFormData",
      FileFormName: "file",
      URL: "{json:url}",
      ErrorMessage: "{json:error}",
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appName}-sharex-config.sxcu`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("ShareX configuration downloaded");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="size-5" />
          ShareX Configuration
        </CardTitle>
        <CardDescription>
          Download a pre-configured .sxcu file to start uploading files directly
          from ShareX.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!apiKey ? (
          <div className="flex flex-col gap-4 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <ShieldAlert className="size-5 shrink-0" />
              <p className="text-sm font-medium">API Key Required</p>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You need to generate an API key before you can use ShareX with
              this service. Go to your security settings to create one.
            </p>
            <Button
              asChild
              variant="outline"
              className="w-fit border-amber-200 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800 dark:hover:bg-amber-900/50 dark:hover:text-amber-100"
            >
              <a href="/account/security">Go to Security Settings</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Configuration Details
                </span>
              </div>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-1">
                <li>Destination: {appName}</li>
                <li>Method: POST (MultipartFormData)</li>
                <li>Auth: x-api-key header</li>
              </ul>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleDownload}>
                <Download className="mr-2 size-4" />
                Download Config (.sxcu)
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
