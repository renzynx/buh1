import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2 as LucideTrash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UploaderHeaderProps {
  isOpen: boolean;
  isComplete: boolean;
  globalProgress: number;
  completedCount: number;
  totalCount: number;
  onToggle: () => void;
  onClearCompleted?: () => void;
}

export function UploaderHeader({
  isOpen,
  isComplete,
  globalProgress,
  completedCount,
  totalCount,
  onToggle,
  onClearCompleted,
}: UploaderHeaderProps) {
  return (
    <div className="relative flex flex-row items-center justify-between p-4 pb-3">
      {!isOpen && (
        <div
          className="absolute inset-0 z-0 bg-primary/10 transition-all duration-500"
          style={{ width: `${globalProgress}%` }}
        />
      )}

      <div className="relative z-10 flex items-center gap-3">
        {isComplete ? (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
        ) : (
          <h3 className="text-base font-semibold leading-none tracking-tight">
            {isOpen ? (
              "Upload Queue"
            ) : (
              <span className="flex items-center gap-2">
                {globalProgress.toFixed(0)}%
                <span className="text-xs font-normal text-muted-foreground">
                  ({completedCount}/{totalCount})
                </span>
              </span>
            )}
          </h3>
        )}

        {/* Count badge only when Open */}
        {isOpen && (
          <span className="inline-flex items-center rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium">
            {completedCount} / {totalCount}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onClearCompleted ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearCompleted();
                }}
              >
                <LucideTrash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>Clear completed</TooltipContent>
          </Tooltip>
        ) : null}

        <Button
          variant="ghost"
          size="icon"
          className="relative z-10 h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
