import { fetchArtistProfile, fetchTattooLoverProfile } from "@/services/profile.service";
import { supabase } from "@/utils/supabase";

type UserRole = "ARTIST" | "TATTOO_LOVER";

// Simple in-memory guard to avoid duplicate prefetches for the same user+viewer combo
const prefetchPromises = new Map<string, Promise<void>>();

function getPrefetchKey(userId: string, viewerId?: string | null) {
  return `${userId}::${viewerId ?? "anon"}`;
}

/**
 * Prefetch user profile data so that the profile screen can render faster
 * when the user navigates to `/user/[id]`.
 *
 * This is a best-effort optimization and should never throw.
 */
export function prefetchUserProfile(
  userId: string,
  viewerId?: string | null
): Promise<void> {
  const key = getPrefetchKey(userId, viewerId);
  const existing = prefetchPromises.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const t0 = Date.now();

      // Fetch role once, then delegate to the appropriate profile fetcher
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (error || !data) return;

      const role = data.role as UserRole;
      const viewer = viewerId ?? undefined;

      if (role === "ARTIST") {
        await fetchArtistProfile(userId, viewer);
      } else {
        await fetchTattooLoverProfile(userId, viewer);
      }

      const total = Date.now() - t0;
      console.log(
        `[Prefetch] Completed profile prefetch for user ${userId} (role=${role}) in ${total}ms`
      );
    } catch (err) {
      // Swallow errors – prefetch should never break the normal flow
      console.error("Error during profile prefetch:", err);
    }
  })();

  prefetchPromises.set(key, promise);
  return promise;
}


