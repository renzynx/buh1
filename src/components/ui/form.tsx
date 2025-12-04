import { useStore } from "@tanstack/react-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import type { ComponentProps } from "react";
import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function ErrorMessages({
  errors,
}: {
  errors: Array<string | { message: string }>;
}) {
  return (
    <>
      {errors.map((error) => (
        <div
          key={typeof error === "string" ? error : error.message}
          className="text-red-500 text-sm"
        >
          {typeof error === "string" ? error : error.message}
        </div>
      ))}
    </>
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

  return (
    <div className="space-y-2">
      <Label htmlFor={label} className="mb-2">
        {label}
      </Label>
      <Input
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        {...props}
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}

export function FormattedTextInput({
  label,
  placeholder,
  description,
  format,
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

  return (
    <div className="space-y-2">
      <Label htmlFor={label} className="mb-2">
        {label}
      </Label>
      <FormattedInput
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e ?? 0)}
        format={format}
        parse={parse}
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
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

  return (
    <div className="space-y-2">
      <Label htmlFor={label} className="mb-2">
        {label}
      </Label>
      <ShadcnTextarea
        id={label}
        value={field.state.value}
        onBlur={field.handleBlur}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
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

  return (
    <div>
      <ShadcnSelect.Select
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
      >
        <ShadcnSelect.SelectTrigger className="w-full">
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
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
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

  const currentValues: string[] = field.state.value
    ? String(field.state.value)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const contentSearch = search ?? true;

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
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
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
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

  return (
    <div className="flex items-start space-x-3">
      <ShadcnCheckbox
        id={field.name}
        checked={field.state.value ?? false}
        onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
        onBlur={field.handleBlur}
      />
      <div className="grid gap-1.5 leading-none">
        <Label
          htmlFor={field.name}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
      </div>
    </div>
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

  return (
    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label htmlFor={label}>{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <ShadcnSwitch
        id={label}
        onBlur={field.handleBlur}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
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

    // date mode
    if (v instanceof Date) return v;
    return undefined;
  }, [field.state.value, valueType]);

  const handleSelect = (date: Date | undefined) => {
    if (valueType === "days") {
      if (date) {
        const expiresInDays = Math.max(
          0,
          Math.ceil((date.getTime() - Date.now()) / msPerDay),
        );
        field.handleChange(expiresInDays);
      } else {
        field.handleChange(undefined);
      }
    } else {
      // date mode: store Date or undefined
      field.handleChange(date);
    }
    setOpen(false);
  };

  const handleClear = () => {
    field.handleChange(undefined);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Button
              type="button"
              id={label}
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

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
}
