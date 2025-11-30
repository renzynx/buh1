import { useCallback, useEffect, useState } from "react";

type SetValue<T> = T | ((val: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: SetValue<T>) => void, () => void] {
  const readValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        const newValue = value instanceof Function ? value(storedValue) : value;

        window.localStorage.setItem(key, JSON.stringify(newValue));
        setStoredValue(newValue);

        // Dispatch custom event for cross-tab sync
        window.dispatchEvent(
          new CustomEvent("local-storage", {
            detail: { key, newValue },
          }),
        );
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);

      window.dispatchEvent(
        new CustomEvent("local-storage", {
          detail: { key, newValue: undefined },
        }),
      );
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ("key" in e && e.key && e.key !== key) {
        return;
      }

      const detail = "detail" in e ? e.detail : null;
      if (detail && detail.key === key) {
        setStoredValue(detail.newValue ?? initialValue);
      }
    };

    // Listen for changes from other tabs
    window.addEventListener("storage", handleStorageChange as EventListener);
    // Listen for changes from same tab
    window.addEventListener(
      "local-storage",
      handleStorageChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange as EventListener,
      );
      window.removeEventListener(
        "local-storage",
        handleStorageChange as EventListener,
      );
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
