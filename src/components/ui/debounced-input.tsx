import React from "react";
import { Input } from "./input";

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.ComponentProps<typeof Input>, "onChange">) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onChangeRef = React.useRef(onChange);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const isMounted = React.useRef(false);

  React.useEffect(() => {
    if (isMounted.current) {
      const timeout = setTimeout(() => {
        onChangeRef.current(value);
      }, debounce);

      return () => clearTimeout(timeout);
    }
    isMounted.current = true;
  }, [value, debounce]);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        setValue(e.target.value)
      }
    />
  );
}
