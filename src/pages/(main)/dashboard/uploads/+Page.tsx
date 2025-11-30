import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderSelector } from "@/components/uploader/folder-selector";
import { UploadDropzone } from "@/components/uploader/upload-dropzone";
import { useUploadStore } from "@/stores/upload-store";

export default function Page() {
  const { selectedFolderId, setSelectedFolderId } = useUploadStore();

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <FolderSelector
            value={selectedFolderId}
            onChange={setSelectedFolderId}
          />
        </Suspense>
      </div>
      <UploadDropzone />
    </div>
  );
}
