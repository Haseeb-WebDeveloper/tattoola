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


