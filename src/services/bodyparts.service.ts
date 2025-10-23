import { supabase } from "@/utils/supabase";

export interface BodyPartItem {
  id: string;
  name: string;
  description?: string | null;
}

export async function fetchBodyParts(): Promise<BodyPartItem[]> {
  const { data, error } = await supabase
    .from('body_parts')
    .select('id, name, description')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as BodyPartItem[];
}

/**
 * Fetch body parts that an artist works on
 */
export async function fetchArtistBodyParts(artistId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('artist_body_parts')
    .select('bodyPartId')
    .eq('artistId', artistId);
  
  if (error) throw new Error(error.message);
  return (data || []).map(item => item.bodyPartId);
}

/**
 * Update artist's body parts
 */
export async function updateArtistBodyParts(
  artistId: string,
  bodyPartIds: string[]
): Promise<void> {
  // First, delete all existing body parts for this artist
  const { error: deleteError } = await supabase
    .from('artist_body_parts')
    .delete()
    .eq('artistId', artistId);
  
  if (deleteError) throw new Error(deleteError.message);
  
  // If no body parts selected, we're done
  if (bodyPartIds.length === 0) return;
  
  // Insert new body parts
  const { error: insertError } = await supabase
    .from('artist_body_parts')
    .insert(
      bodyPartIds.map(bodyPartId => ({
        artistId,
        bodyPartId,
      }))
    );
  
  if (insertError) throw new Error(insertError.message);
}

