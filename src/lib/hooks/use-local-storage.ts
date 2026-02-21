"use client";

import { useState, useEffect, useCallback } from "react";

function getStorageValue<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") {
    return initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return initialValue;

    // Handle corrupted data: if item looks like a raw JWT token (starts with eyJ), return as-is
    if (typeof item === "string" && item.startsWith("eyJ")) {
      console.warn(
        `[useLocalStorage] Found raw token in "${key}", migrating to JSON format`,
      );
      // JWT tokens are strings - return as string type
      return item as T;
    }

    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    // If parse fails and initialValue is a string, try returning the raw item
    const item = window.localStorage.getItem(key);
    if (typeof initialValue === "string" && typeof item === "string") {
      return item as T;
    }
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value - initialize with initialValue to avoid SSR issues
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to load from localStorage after mount (client-side only)
  useEffect(() => {
    if (!isInitialized) {
      const value = getStorageValue(key, initialValue);
      setStoredValue(value);
      setIsInitialized(true);
    }
  }, [key, initialValue, isInitialized]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to local storage
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  // Listen for changes to this localStorage key in other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    function handleStorageChange(e: StorageEvent) {
      if (e.key === key && e.newValue) {
        try {
          // Handle corrupted data: if newValue looks like a raw JWT token, use as-is
          if (
            e.newValue.startsWith("eyJ") &&
            typeof initialValue === "string"
          ) {
            setStoredValue(e.newValue as T);
          } else {
            setStoredValue(JSON.parse(e.newValue));
          }
        } catch {
          // If parse fails and initialValue is a string, use raw value
          if (typeof initialValue === "string") {
            setStoredValue(e.newValue as T);
          }
        }
      }
    }

    // Listen for changes to localStorage
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  // Return initial value during SSR/hydration, stored value after client init
  const valueToReturn = isInitialized ? storedValue : initialValue;

  return [valueToReturn, setValue, isInitialized] as const;
}
