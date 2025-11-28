import { supabase } from "@/utils/supabase";
import { logger } from "@/utils/logger";

export class UsernameService {
  /**
   * Check if a username is available (not already taken)
   * Uses a lightweight query to minimize data transfer
   * @param username - The username to check
   * @returns Promise<boolean> - true if available, false if taken
   */
  static async checkUsernameAvailability(
    username: string
  ): Promise<boolean> {
    if (!username || username.trim().length === 0) {
      return false;
    }

    try {
      // Use lightweight query - only select id to minimize data transfer
      // maybeSingle() returns null if not found (available) or the record if found (taken)
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("username", username.trim())
        .maybeSingle();

      if (error) {
        logger.error("Error checking username availability:", error);
        // On error, assume unavailable to be safe
        return false;
      }

      // If data is null, username is available
      // If data exists, username is taken
      return data === null;
    } catch (error) {
      logger.error("Exception checking username availability:", error);
      return false;
    }
  }
}

