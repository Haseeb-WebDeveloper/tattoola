import { supabase } from "@/utils/supabase";

export interface TattooStyleItem {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

export async function fetchTattooStyles(): Promise<TattooStyleItem[]> {
  const { data, error } = await supabase
    .from('tattoo_styles')
    .select('id, name, description, imageUrl')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as TattooStyleItem[];
}

/**
 * Fetch all styles for an artist (returns all style IDs and favorite style IDs)
 */
export async function fetchArtistFavoriteStyles(artistId: string): Promise<{
  allStyles: string[];
  favoriteStyles: string[];
}> {
  const { data, error } = await supabase
    .from('artist_styles')
    .select('styleId, isFavorite')
    .eq('artistId', artistId)
    .order('order', { ascending: true });

  if (error) throw new Error(error.message);
  
  const allStyles = (data || []).map(item => item.styleId);
  const favoriteStyles = (data || [])
    .filter(item => item.isFavorite)
    .map(item => item.styleId);
  
  return { allStyles, favoriteStyles };
}

/**
 * Update artist's styles and favorite styles
 */
export async function updateArtistFavoriteStyles(
  artistId: string,
  styleIds: string[],
  favoriteStyleIds: string[] | null
): Promise<void> {
  // First, delete all existing styles for this artist
  const { error: deleteError } = await supabase
    .from('artist_styles')
    .delete()
    .eq('artistId', artistId);

  if (deleteError) throw new Error(deleteError.message);

  // If no styles selected, just return
  if (styleIds.length === 0) {
    return;
  }

  const favoriteSet = new Set(favoriteStyleIds || []);
  
  // Insert new styles with order and isFavorite flag
  const { error: insertError } = await supabase
    .from('artist_styles')
    .insert(
      styleIds.map((styleId, index) => ({
        artistId,
        styleId,
        order: index,
        isFavorite: favoriteSet.has(styleId),
      }))
    );

  if (insertError) throw new Error(insertError.message);
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

