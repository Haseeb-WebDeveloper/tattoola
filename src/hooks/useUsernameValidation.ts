import { useCallback, useEffect, useRef, useState } from "react";
import { UsernameService } from "@/services/username.service";
import { ValidationRules, ValidationUtils } from "@/utils/validation";

export type UsernameValidationState = {
  checking: boolean;
  available: boolean | null; // null = not checked yet, true = available, false = taken
  formatError: string | null;
  isFormatValid: boolean;
};

export function useUsernameValidation(username: string) {
  const [state, setState] = useState<UsernameValidationState>({
    checking: false,
    available: null,
    formatError: null,
    isFormatValid: false,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, boolean>>(new Map());

  // Validate format
  const validateFormat = useCallback((value: string): string | null => {
    if (!value || value.trim().length === 0) {
      return null; // Empty is handled by required validation
    }
    return ValidationUtils.validateField(value, ValidationRules.username);
  }, []);

  // Check availability
  const checkAvailability = useCallback(async (value: string) => {
    const trimmed = value.trim();
    
    // Don't check if too short
    if (trimmed.length < 3) {
      setState((prev) => ({
        ...prev,
        checking: false,
        available: null,
      }));
      return;
    }

    // Check cache first
    if (cacheRef.current.has(trimmed)) {
      const cached = cacheRef.current.get(trimmed)!;
      setState((prev) => ({
        ...prev,
        checking: false,
        available: cached,
      }));
      return;
    }

    // Check format first - only check availability if format is valid
    const formatError = validateFormat(trimmed);
    if (formatError) {
      setState((prev) => ({
        ...prev,
        checking: false,
        available: null,
        formatError,
        isFormatValid: false,
      }));
      return;
    }

    // Format is valid, check availability
    setState((prev) => ({
      ...prev,
      checking: true,
      formatError: null,
      isFormatValid: true,
    }));

    try {
      const isAvailable = await UsernameService.checkUsernameAvailability(
        trimmed
      );

      // Cache the result
      cacheRef.current.set(trimmed, isAvailable);

      setState((prev) => ({
        ...prev,
        checking: false,
        available: isAvailable,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        checking: false,
        available: null,
      }));
    }
  }, [validateFormat]);

  // Debounced check
  useEffect(() => {
    const trimmed = username.trim();

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Validate format immediately (no debounce)
    const formatError = validateFormat(trimmed);
    const isFormatValid = !formatError && trimmed.length >= 3;

    setState((prev) => ({
      ...prev,
      formatError,
      isFormatValid,
      // Reset availability if format is invalid
      available: isFormatValid ? prev.available : null,
    }));

    // Only check availability if format is valid and length >= 3
    if (isFormatValid && trimmed.length >= 3) {
      // Debounce availability check
      debounceTimerRef.current = setTimeout(() => {
        checkAvailability(trimmed);
      }, 500);
    } else {
      // Clear availability state if format is invalid
      setState((prev) => ({
        ...prev,
        checking: false,
        available: null,
      }));
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [username, validateFormat, checkAvailability]);

  // Manual check function (for form submission)
  const manualCheck = useCallback(async (): Promise<boolean> => {
    const trimmed = username.trim();
    const formatError = validateFormat(trimmed);

    if (formatError) {
      setState((prev) => ({
        ...prev,
        formatError,
        isFormatValid: false,
      }));
      return false;
    }

    if (trimmed.length < 3) {
      setState((prev) => ({
        ...prev,
        formatError: "Username must be at least 3 characters",
        isFormatValid: false,
      }));
      return false;
    }

    // Check cache first
    if (cacheRef.current.has(trimmed)) {
      const cached = cacheRef.current.get(trimmed)!;
      setState((prev) => ({
        ...prev,
        formatError: null,
        isFormatValid: true,
        available: cached,
      }));
      return cached;
    }

    // Perform immediate check
    setState((prev) => ({
      ...prev,
      checking: true,
      formatError: null,
      isFormatValid: true,
    }));

    try {
      const isAvailable = await UsernameService.checkUsernameAvailability(
        trimmed
      );
      cacheRef.current.set(trimmed, isAvailable);

      setState((prev) => ({
        ...prev,
        checking: false,
        available: isAvailable,
      }));

      return isAvailable;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        checking: false,
        available: null,
      }));
      return false;
    }
  }, [username, validateFormat]);

  return {
    ...state,
    manualCheck,
    isValid: state.isFormatValid && state.available === true,
  };
}

