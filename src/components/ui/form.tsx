'use client';
import * as LabelPrimitive from "@radix-ui/react-label";
import { useStore } from "@tanstack/react-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import type { ComponentProps } from "react";
import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import * as ShadcnMultiSelect from "@/components/ui/multi-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import * as ShadcnSelect from "@/components/ui/select";
import { Switch as ShadcnSwitch } from "@/components/ui/switch";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";
import { useFieldContext, useFormContext } from "@/hooks/use-form-context";
import { cn } from "@/lib/utils";
import { Calendar as UiCalendar } from "./calendar";
import { FormattedInput } from "./formatted-input";

export function SubscribeButton({
  label,
  ...props
}: {
  label: string;
} & ButtonProps) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting} {...props}>
          {label}
        </Button>
      )}
    </form.Subscribe>
  );
}

const Field = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "vertical" | "horizontal" | "responsive";
  }
>(({ className, orientation = "vertical", ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        "group/field grid gap-2",
        orientation === "horizontal" &&
          "grid-cols-[1fr_auto] items-center gap-x-4",
        orientation === "responsive" &&
          "sm:grid-cols-[1fr_auto] sm:items-center sm:gap-x-4",
        "data-[invalid=true]:text-destructive",
        className
      )}
      {...props}
    />
  );
});
Field.displayName = "Field";

const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="field-group"
      className={cn(
        "space-y-4 data-[slot=checkbox-group]:space-y-3",
        className
      )}
      {...props}
    />
  );
});
FieldGroup.displayName = "FieldGroup";

const FieldSet = React.forwardRef<
  HTMLFieldSetElement,
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>
>(({ className, ...props }, ref) => {
  return (
    <fieldset
      ref={ref}
      data-slot="fieldset"
      className={cn("space-y-4", className)}
      {...props}
    />
  );
});
FieldSet.displayName = "FieldSet";

const FieldLegend = React.forwardRef<
  HTMLLegendElement,
  React.HTMLAttributes<HTMLLegendElement> & {
    variant?: "default" | "label";
  }
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <legend
      ref={ref}
      data-slot="field-legend"
      className={cn(
        variant === "default" && "text-base font-semibold",
        variant === "label" &&
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
FieldLegend.displayName = "FieldLegend";

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <LabelPrimitive.Root
      ref={ref}
      data-slot="field-label"
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        "group-data-[invalid=true]/field:text-destructive",
        className
      )}
      {...props}
    />
  );
});
FieldLabel.displayName = "FieldLabel";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      data-slot="field-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
FieldDescription.displayName = "FieldDescription";

const FieldContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="field-content"
      className={cn("space-y-1", className)}
      {...props}
    />
  );
});
FieldContent.displayName = "FieldContent";

const FieldTitle = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      data-slot="field-title"
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  );
});
FieldTitle.displayName = "FieldTitle";

function FieldError({
  errors,
  className,
}: {
  errors: Array<string | { message: string }>;
  className?: string;
}) {
  if (!errors || errors.length === 0) return null;

  return (
    <div data-slot="field-error" className={cn("space-y-1", className)}>
      {errors.map((error) => {
        const message = typeof error === "string" ? error : error.message;
        return (
          <p key={message} className="text-sm text-destructive">
            {message}
          </p>
        );
      })}
    </div>
  );
}

export function TextField({
  label,
  description,
  ...props
}: {
  label: string;
  description?: string;
} & ComponentProps<typeof Input>) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const isInvalid = field.state.meta.isTouched && errors.length > 0;

  return (
    <Field data-invalid={isInvalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}

export function FormattedTextInput({
  label,
  placeholder,
  description,
  format: formatFn,
  parse,
}: {
  label: string;
  placeholder?: string;
  description?: string;
  format: (value: number | null) => string;
  parse: (value: string) => number | null;
}) {
  const field = useFieldContext<number>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const isInvalid = field.state.meta.isTouched && errors.length > 0;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <FormattedInput
        id={field.name}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e ?? 0)}
        format={formatFn}
        parse={parse}
        aria-invalid={isInvalid}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}

export function TextArea({
  label,
  rows = 3,
  placeholder,
  description,
}: {
  label: string;
  rows?: number;
  placeholder?: string;
  description?: string;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const isInvalid = field.state.meta.isTouched && errors.length > 0;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <ShadcnTextarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}

export function Select({
  label,
  values,
  placeholder,
}: {
  label: string;
  values: Array<{ label: string; value: string }>;
  placeholder?: string;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const isInvalid = field.state.meta.isTouched && errors.length > 0;

  return (
    <Field data-invalid={isInvalid}>
      <ShadcnSelect.Select
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
      >
        <ShadcnSelect.SelectTrigger
          id={field.name}
          className="w-full"
          aria-invalid={isInvalid}
        >
          <ShadcnSelect.SelectValue placeholder={placeholder} />
        </ShadcnSelect.SelectTrigger>
        <ShadcnSelect.SelectContent>
          <ShadcnSelect.SelectGroup>
            <ShadcnSelect.SelectLabel>{label}</ShadcnSelect.SelectLabel>
            {values.map((value) => (
              <ShadcnSelect.SelectItem key={value.value} value={value.value}>
                {value.label}
              </ShadcnSelect.SelectItem>
            ))}
          </ShadcnSelect.SelectGroup>
        </ShadcnSelect.SelectContent>
      </ShadcnSelect.Select>
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}

export function MultiSelect({
  children,
  items,
  search,
  triggerClassName,
  valuePlaceholder,
  label,
}: {
  children?: React.ReactNode;
  items?: string[];
  search?: boolean | { placeholder?: string; emptyMessage?: string };
  triggerClassName?: string;
  valuePlaceholder?: string;
  label: string;
}) {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const isInvalid = field.state.meta.isTouched && errors.length > 0;

  const currentValues: string[] = field.state.value
    ? String(field.state.value)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const contentSearch = search ?? true;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <ShadcnMultiSelect.MultiSelect
        values={currentValues}
        onValuesChange={(vals: string[]) => field.handleChange(vals.join(","))}
      >
        {children ?? (
          <>
            <ShadcnMultiSelect.MultiSelectTrigger className={triggerClassName}>
              <ShadcnMultiSelect.MultiSelectValue
                placeholder={valuePlaceholder}
              />
            </ShadcnMultiSelect.MultiSelectTrigger>
            <ShadcnMultiSelect.MultiSelectContent search={contentSearch}>
              {items?.map((it) => (
                <ShadcnMultiSelect.MultiSelectItem key={it} value={it}>
                  {it}
                </ShadcnMultiSelect.MultiSelectItem>
              ))}
            </ShadcnMultiSelect.MultiSelectContent>
          </>
        )}
      </ShadcnMultiSelect.MultiSelect>
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}

export function Checkbox({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  const field = useFieldContext<boolean>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const isInvalid = field.state.meta.isTouched && errors.length > 0;

  return (
    <Field orientation="horizontal" data-invalid={isInvalid}>
      <ShadcnCheckbox
        id={field.name}
        checked={field.state.value ?? false}
        onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
      />
      <FieldContent>
        <FieldLabel
          htmlFor={field.name}
          className="font-normal cursor-pointer"
        >
          {label}
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={errors} />}
      </FieldContent>
    </Field>
  );
}

export function Switch({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  const field = useFieldContext<boolean>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const isInvalid = field.state.meta.isTouched && errors.length > 0;

  return (
    <Field
      orientation="horizontal"
      data-invalid={isInvalid}
      className="flex-row items-center justify-between rounded-lg border p-4"
    >
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <ShadcnSwitch
        id={field.name}
        onBlur={field.handleBlur}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked)}
        aria-invalid={isInvalid}
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}

const msPerDay = 24 * 60 * 60 * 1000;

export function Calendar({
  label,
  description,
  minDate,
  maxDate,
  valueType = "days",
}: {
  label: string;
  description?: string;
  minDate?: Date;
  maxDate?: Date;
  valueType?: "days" | "date";
}) {
  const field = useFieldContext<unknown>();
  const errors = useStore(field.store, (state) => state.meta.errors);
  const isInvalid = field.state.meta.isTouched && errors.length > 0;
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => {
    const v = field.state.value;
    if (valueType === "days") {
      if (typeof v === "number") {
        const d = new Date(Date.now() + v * msPerDay);
        d.setHours(0, 0, 0, 0);
        return d;
      }
      return undefined;
    }

    if (v instanceof Date) return v;
    return undefined;
  }, [field.state.value, valueType]);

  const handleSelect = (date: Date | undefined) => {
    if (valueType === "days") {
      if (date) {
        const expiresInDays = Math.max(
          0,
          Math.ceil((date.getTime() - Date.now()) / msPerDay)
        );
        field.handleChange(expiresInDays);
      } else {
        field.handleChange(undefined);
      }
    } else {
      field.handleChange(date);
    }
    setOpen(false);
  };

  const handleClear = () => {
    field.handleChange(undefined);
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Button
              type="button"
              id={field.name}
              variant="outline"
              data-empty={!selectedDate}
              className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal pr-10"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
            {selectedDate && (
              <div
                className="absolute right-0 top-0 h-full px-3 py-2 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
              >
                <X className="h-4 w-4" />
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="max-w-sm overflow-hidden p-0" align="start">
          <UiCalendar
            className="w-full"
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
};
