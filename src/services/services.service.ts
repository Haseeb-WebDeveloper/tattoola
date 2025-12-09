import { supabase } from "@/utils/supabase";

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  category: string;
}

export async function fetchServices(): Promise<ServiceItem[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, category, imageUrl')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as ServiceItem[];
}

/**
 * Fetch services that an artist offers
 */
export async function fetchArtistServices(artistId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('artist_services')
    .select('serviceId')
    .eq('artistId', artistId);

  if (error) throw new Error(error.message);
  return (data || []).map(item => item.serviceId);
}

/**
 * Update artist's services
 */
export async function updateArtistServices(
  artistId: string,
  serviceIds: string[]
): Promise<void> {
  // First, delete all existing services for this artist
  const { error: deleteError } = await supabase
    .from('artist_services')
    .delete()
    .eq('artistId', artistId);

  if (deleteError) throw new Error(deleteError.message);

  // If no services selected, we're done
  if (serviceIds.length === 0) return;

  // Insert new services
  const { error: insertError } = await supabase
    .from('artist_services')
    .insert(
      serviceIds.map(serviceId => ({
        artistId,
        serviceId,
      }))
    );

  if (insertError) throw new Error(insertError.message);
}

