import { StudioInfo } from "@/types/studio";
import { supabase } from "@/utils/supabase";

/**
 * Fetch studio information for an artist user
 * Returns studio details and user's role in the studio
 */
export async function fetchArtistStudio(userId: string): Promise<StudioInfo | null> {
  try {
    // 1. Get artist profile for the user
    const { data: artistProfile, error: artistError } = await supabase
      .from('artist_profiles')
      .select('id')
      .eq('userId', userId)
      .single();

    if (artistError || !artistProfile) {
      console.error('Error fetching artist profile:', artistError);
      return null;
    }

    // 2. Query studios table where ownerId = artistProfile.id
    const { data: studio, error: studioError } = await supabase
      .from('studios')
      .select('id, name, isCompleted, ownerId')
      .eq('ownerId', artistProfile.id)
      .single();

    if (studioError || !studio) {
      console.error('Error fetching studio:', studioError);
      return null;
    }

    // 3. Check if user is owner or get role from studio_members
    let userRole: 'OWNER' | 'MANAGER' | 'MEMBER' = 'OWNER'; // Owner by default since we queried by ownerId

    // If not owner, check studio_members table
    if (studio.ownerId !== artistProfile.id) {
      const { data: memberData, error: memberError } = await supabase
        .from('studio_members')
        .select('role')
        .eq('studioId', studio.id)
        .eq('userId', userId)
        .single();

      if (memberError || !memberData) {
        console.error('Error fetching studio member role:', memberError);
        return null;
      }

      userRole = memberData.role as 'OWNER' | 'MANAGER' | 'MEMBER';
    }

    // 4. Return studio info with role
    return {
      id: studio.id,
      name: studio.name,
      isCompleted: studio.isCompleted,
      userRole,
    };
  } catch (error) {
    console.error('Error in fetchArtistStudio:', error);
    return null;
  }
}

