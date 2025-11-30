import { useUploadQueue } from "@/hooks/use-upload-queue";
import { UPLOADER_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUploadStore } from "@/stores/upload-store";
import { FileList } from "./file-list";
import { UploaderHeader } from "./uploader-header";

interface GlobalUploaderProps {
  endpoint?: string;
  concurrentLimit?: number;
}

export function GlobalUploader({
  endpoint = UPLOADER_CONFIG.DEFAULT_ENDPOINT,
  concurrentLimit = UPLOADER_CONFIG.DEFAULT_CONCURRENT_LIMIT,
}: GlobalUploaderProps) {
  const { clearCompletedFiles, setUploaderOpen, files, isOpen } =
    useUploadStore();
  const {
    stats,
    handleStatusChange,
    handleProgressChange,
    handleControlReady,
  } = useUploadQueue({ files, concurrentLimit });

  const handleToggle = () => {
    setUploaderOpen(!isOpen);
  };

  const handleClearCompleted = () => {
    clearCompletedFiles();
  };

  if (files.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 w-[calc(100%-3rem)] max-w-md animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-2xl transition-all duration-500 ease-in-out",
          !isOpen && "cursor-pointer hover:bg-accent/50",
        )}
        onClick={!isOpen ? handleToggle : undefined}
      >
        <UploaderHeader
          isOpen={isOpen}
          isComplete={stats.isGlobalComplete}
          globalProgress={stats.globalProgress}
          completedCount={stats.completedCount}
          totalCount={files.length}
          onToggle={handleToggle}
          onClearCompleted={
            stats.completedCount > 0 ? handleClearCompleted : undefined
          }
        />
        <FileList
          files={files}
          endpoint={endpoint}
          onControlReady={handleControlReady}
          onStatusChange={handleStatusChange}
          onProgressChange={handleProgressChange}
          visible={isOpen}
        />
      </div>
    </div>
  );
}
