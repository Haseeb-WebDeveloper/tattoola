import { supabase } from "@/utils/supabase";
import { v4 as uuidv4 } from "uuid";

/**
 * Find or get "tutti" collection for a user
 * Creates the collection if it doesn't exist
 * @param ownerId - The user ID who owns the collection
 * @returns The collection ID if found or created, null if error
 */
export async function findOrGetTuttiCollection(
  ownerId: string
): Promise<string | null> {
  // First, try to find existing "tutti" collection
  const { data: tuttiCollection, error: findError } = await supabase
    .from("collections")
    .select("id")
    .eq("ownerId", ownerId)
    .ilike("name", "tutti")
    .maybeSingle();

  if (findError) {
    console.error("Error finding tutti collection:", findError);
    return null;
  }

  // If found, return it
  if (tuttiCollection?.id) {
    return tuttiCollection.id;
  }

  // If not found, create it
  try {
    const { data: newCollection, error: createError } = await supabase
      .from("collections")
      .insert({
        id: uuidv4(),
        ownerId,
        name: "tutti",
        isPrivate: false,
        isPortfolioCollection: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating tutti collection:", createError);
      return null;
    }

    console.log("[findOrGetTuttiCollection] Created tutti collection for user");
    return newCollection.id;
  } catch (e) {
    console.error("Error creating tutti collection:", e);
    return null;
  }
}

/**
 * Check if a collection is "preferiti"
 * @param collectionId - The collection ID to check
 * @returns true if the collection is "preferiti", false otherwise
 */
export async function isPreferitiCollection(
  collectionId: string
): Promise<boolean> {
  const { data: collection, error } = await supabase
    .from("collections")
    .select("name")
    .eq("id", collectionId)
    .maybeSingle();

  if (error || !collection) return false;

  return collection.name.toLowerCase() === "preferiti";
}

/**
 * Check if a collection is "tutti"
 * @param collectionId - The collection ID to check
 * @returns true if the collection is "tutti", false otherwise
 */
export async function isTuttiCollection(
  collectionId: string
): Promise<boolean> {
  const { data: collection, error } = await supabase
    .from("collections")
    .select("name")
    .eq("id", collectionId)
    .maybeSingle();

  if (error || !collection) return false;

  return collection.name.toLowerCase() === "tutti";
}

/**
 * Check if a collection is a system collection (Tutti or preferiti/prefretti)
 * System collections cannot be edited or deleted
 * @param collectionName - The collection name to check
 * @returns true if the collection is a system collection, false otherwise
 */
export function isSystemCollection(collectionName: string): boolean {
  console.log("collectionName", collectionName);
  if (!collectionName) return false;
  const normalizedName = collectionName.toLowerCase().trim();
  console.log("normalizedName", normalizedName);
  return (
    normalizedName === "tutti" ||
    normalizedName === "preferiti" ||
    normalizedName === "prefretti"
  );
}
