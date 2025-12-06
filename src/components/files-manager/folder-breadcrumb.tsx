import { ChevronRight, Folder, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useDndContext } from "./dnd-context";

export type BreadcrumbItem = {
  id: string | null;
  name: string;
};

export function FolderBreadcrumb({
  items,
  onNavigate,
}: {
  items: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
}) {
  const {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    dropTargetId,
    isDragging,
  } = useDndContext();

  // If there are many items, collapse the middle ones into a dropdown.
  const MAX_VISIBLE = 4; // show up to this many breadcrumb items (excluding Home)

  const visible =
    items.length <= MAX_VISIBLE
      ? items
      : // show first, last two, and collapse the middle
        [items[0], ...items.slice(items.length - 2)];

  // Determine collapsed range when applicable
  const collapsedItems =
    items.length > MAX_VISIBLE ? items.slice(1, items.length - 2) : [];

  const isHomeDropTarget = dropTargetId === null && isDragging;

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        onDragOver={(e) => handleDragOver(e, null)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
        className={cn(
          "gap-2 transition-all",
          isHomeDropTarget && "ring-2 ring-primary bg-primary/10",
        )}
      >
        <Home className="size-4" />
        <span>Home</span>
      </Button>

      {visible.map((item, index) => {
        // If this is the first visible after the first item and there are collapsed items,
        // render the ellipsis dropdown before the item
        const showEllipsis =
          index === 1 &&
          collapsedItems.length > 0 &&
          items.length > MAX_VISIBLE;

        const isDropTarget = dropTargetId === item.id && isDragging;
        const isLastItem = index === visible.length - 1;

        return (
          <div
            key={item.id || `crumb-${index}`}
            className="flex items-center gap-1"
          >
            <ChevronRight className="size-4 text-muted-foreground" />

            {showEllipsis ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="px-2">
                      …
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {collapsedItems.map((ci) => (
                      <DropdownMenuItem
                        key={ci.id || `c-${ci.name}`}
                        onSelect={() => onNavigate(ci.id)}
                      >
                        {ci.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(item.id)}
                  onDragOver={(e) => !isLastItem && handleDragOver(e, item.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => !isLastItem && handleDrop(e, item.id)}
                  className={cn(
                    "gap-2 transition-all",
                    isDropTarget && "ring-2 ring-primary bg-primary/10",
                  )}
                  disabled={isLastItem}
                >
                  <Folder className="size-4" />
                  <span>{item.name}</span>
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(item.id)}
                onDragOver={(e) => !isLastItem && handleDragOver(e, item.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => !isLastItem && handleDrop(e, item.id)}
                className={cn(
                  "gap-2 transition-all",
                  isDropTarget && "ring-2 ring-primary bg-primary/10",
                )}
                disabled={isLastItem}
              >
                <Folder className="size-4" />
                <span>{item.name}</span>
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
