import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

export type DragItem = {
  type: "file" | "folder";
  ids: string[];
};

const DRAG_DATA_TYPE = "application/x-file-dnd";

type DndContextValue = {
  isDragging: boolean;
  draggedItem: DragItem | null;
  dropTargetId: string | null;
  isMoving: boolean;
  handleDragStart: (e: React.DragEvent, item: DragItem) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, targetFolderId: string | null) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetFolderId: string | null) => void;
};

const DndContext = createContext<DndContextValue | null>(null);

export function useDndContext() {
  const context = useContext(DndContext);
  if (!context) {
    throw new Error("useDndContext must be used within a DndProvider");
  }
  return context;
}

export function DndProvider({ children }: { children: ReactNode }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const moveFilesMutation = useMutation(
    trpc.user.moveFiles.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Moved ${data.movedCount} file(s) successfully`);
        queryClient.invalidateQueries({
          queryKey: trpc.user.getFiles.queryKey(),
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.user.getFolders.queryKey(),
          exact: false,
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to move files");
      },
    }),
  );

  const moveFolderMutation = useMutation(
    trpc.user.moveFolder.mutationOptions({
      onSuccess: () => {
        toast.success("Folder moved successfully");
        queryClient.invalidateQueries({
          queryKey: trpc.user.getFolders.queryKey(),
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.user.getFolder.queryKey(),
          exact: false,
        });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to move folder");
      },
    }),
  );

  const handleDragStart = useCallback((e: React.DragEvent, item: DragItem) => {
    e.dataTransfer.setData(DRAG_DATA_TYPE, JSON.stringify(item));
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
    setDraggedItem(item);

    // Create a custom drag image
    const dragImage = document.createElement("div");
    dragImage.className =
      "flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-primary-foreground text-sm font-medium shadow-lg";
    dragImage.textContent =
      item.ids.length > 1
        ? `${item.ids.length} ${item.type}s`
        : `1 ${item.type}`;
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    // Clean up drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
    setDropTargetId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetFolderId: string | null) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if we have valid drag data
      if (!e.dataTransfer.types.includes(DRAG_DATA_TYPE)) {
        return;
      }

      // Prevent dropping a folder into itself
      if (
        draggedItem?.type === "folder" &&
        draggedItem.ids.includes(targetFolderId || "")
      ) {
        e.dataTransfer.dropEffect = "none";
        return;
      }

      e.dataTransfer.dropEffect = "move";
      setDropTargetId(targetFolderId);
    },
    [draggedItem],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if leaving to outside the drop zone
    const relatedTarget = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDropTargetId(null);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetFolderId: string | null) => {
      e.preventDefault();
      e.stopPropagation();
      setDropTargetId(null);
      setIsDragging(false);
      setDraggedItem(null);

      const data = e.dataTransfer.getData(DRAG_DATA_TYPE);
      if (!data) return;

      try {
        const item: DragItem = JSON.parse(data);

        // Prevent dropping a folder into itself
        if (item.type === "folder" && item.ids.includes(targetFolderId || "")) {
          toast.error("Cannot move a folder into itself");
          return;
        }

        if (item.type === "file") {
          await moveFilesMutation.mutateAsync({
            fileIds: item.ids,
            targetFolderId,
          });
        } else if (item.type === "folder") {
          // Move each folder one by one
          for (const folderId of item.ids) {
            if (folderId === targetFolderId) continue;
            await moveFolderMutation.mutateAsync({
              folderId,
              targetParentId: targetFolderId,
            });
          }
        }
      } catch {
        // Error handled by mutation
      }
    },
    [moveFilesMutation, moveFolderMutation],
  );

  return (
    <DndContext.Provider
      value={{
        isDragging,
        draggedItem,
        dropTargetId,
        isMoving: moveFilesMutation.isPending || moveFolderMutation.isPending,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragLeave,
        handleDrop,
      }}
    >
      {children}
    </DndContext.Provider>
  );
}
