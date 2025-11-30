import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormattedInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  // value may be null to represent an empty/unset state
  value: number | null;
  onChange: (value: number | null) => void;
  // format/parse should accept/return nullable values where appropriate
  format: (value: number | null) => string;
  parse: (value: string) => number | null;
}

export function FormattedInput({
  value,
  onChange,
  format,
  parse,
  className,
  ...props
}: FormattedInputProps) {
  const [inputValue, setInputValue] = useState(format(value));
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external value changes when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(format(value));
    }
  }, [value, format, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const parsed = parse(newValue);
    // propagate null to signal empty/unset state
    if (parsed === null || !Number.isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <Input
      {...props}
      value={inputValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        setInputValue(format(value)); // Re-format on blur to ensure consistency
      }}
      className={cn(className)}
    />
  );
}
