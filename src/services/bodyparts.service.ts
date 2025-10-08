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


