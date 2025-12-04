import { skipToken, useQueries, useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, CircleQuestionMark, Folder } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DatabaseFolders } from "@/database/schema";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface FolderSelectorProps {
  value: string | null;
  onChange: (folderId: string | null) => void;
}

export function FolderSelector({ value, onChange }: FolderSelectorProps) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [{ data: rootData }, { data: selectedFolder }] = useQueries({
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

  return (
    <div className="space-y-2">
      <Label className="mb-2 flex items-center gap-2">
        Select a folder (Optional)
        <Tooltip>
          <TooltipTrigger>
            <CircleQuestionMark className="size-4 opacity-50 hover:opacity-100" />
          </TooltipTrigger>
          <TooltipContent>
            You can select a folder to upload files to.
          </TooltipContent>
        </Tooltip>
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              <Folder className="size-4 shrink-0" />
              <span className="truncate">
                {value === null
                  ? "Root"
                  : selectedFolder?.name || "Select folder..."}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[400px] p-2" align="start">
          <div className="mb-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search folder..."
            />
          </div>

          <div className="max-h-[400px] overflow-auto">
            {/* Root option */}
            <div className="mb-1">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted transition-colors">
                <Checkbox
                  checked={value === null}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange(null);
                      setOpen(false);
                    }
                  }}
                />
                <Folder className="size-4 shrink-0 text-gray-500" />
                <span className={cn(value === null && "font-semibold")}>
                  Root
                </span>
              </div>
            </div>

            {/* Tree nodes */}
            <div>
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
            </div>
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
  const [isToggling, setIsToggling] = useState(false);

  // Query matching
  const normalizedQuery = query.toLowerCase().trim();
  const matchesQuery =
    normalizedQuery === "" || node.name.toLowerCase().includes(normalizedQuery);

  const { data: childrenData } = useQuery(
    trpc.user.getFolders.queryOptions(
      isExpanded
        ? {
            parentId: node.id,
            page: 1,
            pageSize: 1000,
          }
        : skipToken,
      {
        staleTime: Infinity,
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

  const toggleExpand = () => {
    setExpandedIds((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-muted transition-colors group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* (No chevron) keep a same-size spacer for alignment */}
        <span className="p-0.5 rounded flex items-center justify-center shrink-0 size-4" />

        {/* Checkbox for selection */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              onSelect(node.id);
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Folder item - clicking toggles expansion; checkbox is for selecting */}
        <button
          className="flex-1 text-left flex items-center gap-2 min-w-0 cursor-pointer"
          aria-disabled={isToggling}
          onClick={(e) => {
            e.stopPropagation();
            if (isToggling) return;
            setIsToggling(true);
            // Toggle and prevent rapid repeated toggles for a short period
            toggleExpand();
            setTimeout(() => setIsToggling(false), 350);
          }}
        >
          <Folder className="size-4 shrink-0 text-blue-500" />
          <span
            className={cn(
              "truncate",
              isSelected && "font-semibold",
              matchesQuery &&
                normalizedQuery !== "" &&
                "bg-yellow-100 dark:bg-yellow-900/30",
            )}
          >
            {node.name}
          </span>
        </button>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {children.map((child) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
