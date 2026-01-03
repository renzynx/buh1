"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="input-group"
      className={cn(
        "flex items-center h-9 w-full min-w-0 rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]",
        "has-[[data-slot=input]:focus-visible]:border-ring has-[[data-slot=input]:focus-visible]:ring-ring/50 has-[[data-slot=input]:focus-visible]:ring-[3px]",
        "has-[[data-slot=input][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot=input][aria-invalid=true]]:ring-destructive/40 has-[[data-slot=input][aria-invalid=true]]:border-destructive",
        className,
      )}
      {...props}
    />
  );
});
InputGroup.displayName = "InputGroup";

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      data-slot="input"
      className={cn(
        "h-full flex-1 min-w-0 bg-transparent px-3 py-1 text-base placeholder:text-muted-foreground outline-none md:text-sm",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
InputGroupInput.displayName = "InputGroupInput";

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="input"
      className={cn(
        "h-full flex-1 min-w-0 resize-none bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground outline-none md:text-sm",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
InputGroupTextarea.displayName = "InputGroupTextarea";

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "inline-start" | "inline-end" | "block-start" | "block-end";
  }
>(({ className, align = "inline-start", ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="input-group-addon"
      className={cn(
        "flex items-center justify-center whitespace-nowrap text-muted-foreground",
        "px-3 first:pr-0 last:pl-0",
        className,
      )}
      {...props}
    />
  );
});
InputGroupAddon.displayName = "InputGroupAddon";

const InputGroupText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
InputGroupText.displayName = "InputGroupText";

const InputGroupButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, variant = "ghost", size = "icon-sm", ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-transparent",
        className,
      )}
      {...props}
    />
  );
});
InputGroupButton.displayName = "InputGroupButton";

export {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupText,
  InputGroupButton,
};
