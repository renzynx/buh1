import { skipToken, useQueries, useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronRight,
  FolderIcon,
  FolderOpen,
  Home,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DatabaseFolders } from "@/database/schema";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Spinner } from "../ui/spinner";

interface FolderSelectorProps {
  value: string | null;
  onChange: (folderId: string | null) => void;
  label?: string;
}

export function FolderSelector({
  value,
  onChange,
  label = "Destination folder",
}: FolderSelectorProps) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const [{ data: rootData, isLoading }, { data: selectedFolder }] = useQueries({
    queries: [
      trpc.user.getFolders.queryOptions({ page: 1, pageSize: 1000 }),
      trpc.user.getFolder.queryOptions(value ? { id: value } : skipToken),
    ],
  });

  const treeRoots = rootData?.items ?? [];

  // Auto-expand ancestors when a folder is selected
  useMemo(() => {
    if (selectedFolder?.ancestors && selectedFolder.ancestors.length > 0) {
      const ancestorIds = selectedFolder.ancestors.reduce(
        (acc, ancestor) => {
          acc[ancestor.id] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      setExpandedIds((prev) => ({ ...prev, ...ancestorIds }));
    }
  }, [selectedFolder]);

  // Build breadcrumb path for selected folder
  const breadcrumbPath = useMemo(() => {
    if (!selectedFolder) return null;
    const ancestors = selectedFolder.ancestors ?? [];
    return [...ancestors, { id: selectedFolder.id, name: selectedFolder.name }];
  }, [selectedFolder]);

  return (
    <div className="space-y-1.5">
      {label && (
        // biome-ignore lint/a11y/noLabelWithoutControl: <idc>
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start gap-2 h-auto min-h-10 py-2"
          >
            {value === null ? (
              <>
                <Home className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">Root folder</span>
              </>
            ) : selectedFolder ? (
              <div className="flex items-center gap-2 min-w-0">
                <FolderIcon className="size-4 shrink-0 text-blue-500" />
                <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                  {breadcrumbPath && breadcrumbPath.length > 2 && (
                    <>
                      <span className="text-muted-foreground text-xs">
                        .../
                      </span>
                    </>
                  )}
                  {breadcrumbPath?.slice(-2).map((item, idx, arr) => (
                    <span key={item.id} className="flex items-center gap-1">
                      <span
                        className={cn(
                          "truncate",
                          idx === arr.length - 1
                            ? "font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.name}
                      </span>
                      {idx < arr.length - 1 && (
                        <ChevronRight className="size-3 text-muted-foreground shrink-0" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Select folder...</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[320px] p-0" align="start">
          {/* Search header */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search folders..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Folder tree */}
          <div className="max-h-[300px] overflow-y-auto p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="size-5" />
              </div>
            ) : (
              <>
                {/* Root option */}
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                    "hover:bg-accent",
                    value === null && "bg-accent",
                  )}
                >
                  <span className="size-4" /> {/* Spacer for alignment */}
                  <Home className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left">Root folder</span>
                  {value === null && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>

                {/* Tree nodes */}
                {treeRoots.length === 0 && !isLoading && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No folders found
                  </div>
                )}

                {treeRoots.map((root) => (
                  <TreeNode
                    key={root.id}
                    node={root}
                    depth={0}
                    expandedIds={expandedIds}
                    setExpandedIds={setExpandedIds}
                    onSelect={(id: string) => {
                      onChange(id);
                      setOpen(false);
                    }}
                    value={value}
                    query={query}
                  />
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type TreeNodeProps = {
  node: DatabaseFolders;
  depth: number;
  expandedIds: Record<string, boolean>;
  setExpandedIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onSelect: (id: string) => void;
  value: string | null;
  query: string;
};

function TreeNode({
  node,
  depth,
  expandedIds,
  setExpandedIds,
  onSelect,
  value,
  query,
}: TreeNodeProps) {
  const trpc = useTRPC();
  const isExpanded = Boolean(expandedIds[node.id]);
  const isSelected = value === node.id;

  // Query matching
  const normalizedQuery = query.toLowerCase().trim();
  const matchesQuery =
    normalizedQuery === "" || node.name.toLowerCase().includes(normalizedQuery);

  const { data: childrenData, isLoading: isLoadingChildren } = useQuery(
    trpc.user.getFolders.queryOptions(
      isExpanded
        ? {
            parentId: node.id,
            page: 1,
            pageSize: 1000,
          }
        : skipToken,
      {
        staleTime: Number.POSITIVE_INFINITY,
      },
    ),
  );

  const children = childrenData?.items ?? [];
  const hasChildren = children.length > 0;

  // Check if any descendants match the query
  const hasMatchingDescendants = useMemo(() => {
    if (normalizedQuery === "") return false;

    const checkDescendants = (items: DatabaseFolders[]): boolean => {
      return items.some((item) =>
        item.name.toLowerCase().includes(normalizedQuery),
      );
    };

    return checkDescendants(children);
  }, [children, normalizedQuery]);

  // Auto-expand if query matches descendants
  useMemo(() => {
    if (hasMatchingDescendants && normalizedQuery !== "") {
      setExpandedIds((prev) => ({ ...prev, [node.id]: true }));
    }
  }, [hasMatchingDescendants, normalizedQuery, node.id, setExpandedIds]);

  // Hide node if it doesn't match query and has no matching descendants
  if (normalizedQuery !== "" && !matchesQuery && !hasMatchingDescendants) {
    return null;
  }

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
  };

  const FolderIconComponent = isExpanded ? FolderOpen : FolderIcon;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-md text-sm transition-colors",
          "hover:bg-accent",
          isSelected && "bg-accent",
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {/* Expand/collapse button */}
        <button
          type="button"
          onClick={toggleExpand}
          className={cn(
            "size-6 flex items-center justify-center rounded hover:bg-muted shrink-0",
            "transition-transform duration-200",
          )}
        >
          {isLoadingChildren ? (
            <Spinner className="size-3" />
          ) : (
            <ChevronRight
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-90",
              )}
            />
          )}
        </button>

        {/* Folder item */}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex-1 flex items-center gap-2 py-2 pr-2 min-w-0"
        >
          <FolderIconComponent
            className={cn(
              "size-4 shrink-0",
              isExpanded ? "text-blue-500" : "text-blue-400",
            )}
          />
          <span
            className={cn(
              "truncate flex-1 text-left",
              isSelected && "font-medium",
              matchesQuery &&
                normalizedQuery !== "" &&
                "bg-yellow-200/50 dark:bg-yellow-500/20 rounded px-0.5",
            )}
          >
            {node.name}
          </span>
          {isSelected && <Check className="size-4 shrink-0 text-primary" />}
        </button>
      </div>

      {/* Children */}
      {isExpanded && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            isExpanded ? "opacity-100" : "opacity-0",
          )}
        >
          {hasChildren ? (
            children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                expandedIds={expandedIds}
                setExpandedIds={setExpandedIds}
                onSelect={onSelect}
                value={value}
                query={query}
              />
            ))
          ) : !isLoadingChildren ? (
            <div
              className="text-xs text-muted-foreground py-1.5"
              style={{ paddingLeft: `${(depth + 1) * 12 + 32}px` }}
            >
              No subfolders
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
