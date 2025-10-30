import { supabase } from "@/utils/supabase";

export interface TattooStyleItem {
  id: string;
  name: string;
  imageUrl?: string | null;
}

export async function fetchTattooStyles(): Promise<TattooStyleItem[]> {
  const { data, error } = await supabase
    .from('tattoo_styles')
    .select('id, name, imageUrl')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as TattooStyleItem[];
}

/**
 * Fetch favorite styles for an artist
 */
export async function fetchArtistFavoriteStyles(artistId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('artist_favorite_styles')
    .select('styleId')
    .eq('artistId', artistId)
    .order('order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(item => item.styleId);
}

/**
 * Update artist's favorite styles and main style
 */
export async function updateArtistFavoriteStyles(
  artistId: string,
  styleIds: string[],
  mainStyleId: string | null
): Promise<void> {
  // First, delete all existing favorite styles for this artist
  const { error: deleteError } = await supabase
    .from('artist_favorite_styles')
    .delete()
    .eq('artistId', artistId);

  if (deleteError) throw new Error(deleteError.message);

  // If no styles selected, just update mainStyleId and return
  if (styleIds.length === 0) {
    const { error: updateError } = await supabase
      .from('artist_profiles')
      .update({ mainStyleId: null })
      .eq('id', artistId);

    if (updateError) throw new Error(updateError.message);
    return;
  }

  // Insert new favorite styles with order
  const { error: insertError } = await supabase
    .from('artist_favorite_styles')
    .insert(
      styleIds.map((styleId, index) => ({
        artistId,
        styleId,
        order: index,
      }))
    );

  if (insertError) throw new Error(insertError.message);

  // Update mainStyleId in artist_profiles
  const { error: updateError } = await supabase
    .from('artist_profiles')
    .update({ mainStyleId })
    .eq('id', artistId);

  if (updateError) throw new Error(updateError.message);
}

/**
 * Fetch favorite styles for a tattoo lover (user)
 */
export async function fetchUserFavoriteStyles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_favorite_styles')
    .select('styleId')
    .eq('userId', userId)
    .order('order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(item => item.styleId);
}

/**
 * Update tattoo lover's favorite styles
 */
export async function updateUserFavoriteStyles(
  userId: string,
  styleIds: string[]
): Promise<void> {
  // First, delete all existing favorite styles for this user
  const { error: deleteError } = await supabase
    .from('user_favorite_styles')
    .delete()
    .eq('userId', userId);

  if (deleteError) throw new Error(deleteError.message);

  // If no styles selected, just return
  if (styleIds.length === 0) {
    return;
  }

  // Insert new favorite styles with order
  const { error: insertError } = await supabase
    .from('user_favorite_styles')
    .insert(
      styleIds.map((styleId, index) => ({
        userId,
        styleId,
        order: index,
      }))
    );

  if (insertError) throw new Error(insertError.message);
}

