import { supabase } from "@/utils/supabase";

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
}

export async function fetchServices(): Promise<ServiceItem[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, category')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []) as ServiceItem[];
}


