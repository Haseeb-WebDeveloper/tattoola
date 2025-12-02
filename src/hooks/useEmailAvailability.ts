import { useState, useCallback } from "react";
import { supabase } from "@/utils/supabase";

export function useEmailAvailability(initialEmail: string = "") {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalize = (value: string) => value.trim().toLowerCase();

  const manualCheck = useCallback(
    async (rawEmail?: string) => {
      const email = normalize(rawEmail ?? initialEmail);
      if (!email) {
        setAvailable(null);
        setError(null);
        return true;
      }

      setChecking(true);
      setError(null);
      try {
        const { data, error: queryError } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (queryError) {
          // Do not block registration on transient errors, just clear state.
          setAvailable(null);
          setError(null);
          return true;
        }

        const isAvailable = !data;
        setAvailable(isAvailable);

        if (!isAvailable) {
          setError("This email is already registered");
        } else {
          setError(null);
        }

        return isAvailable;
      } finally {
        setChecking(false);
      }
    },
    [initialEmail]
  );

  return {
    checking,
    available,
    error,
    manualCheck,
  };
}



