import { supabase } from '@/utils/supabase';

export interface ProvinceRow { id: string; name: string; imageUrl?: string | null; }
export interface MunicipalityRow { id: string; name: string; provinceId: string; imageUrl?: string | null; }

let provincesCache: ProvinceRow[] | null = null;
const municipalitiesCache = new Map<string, MunicipalityRow[]>();

export function normalizeImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    // If it's a Google imgres URL, extract the real image URL from the imgurl param
    if (url.includes('/imgres') && url.includes('imgurl=')) {
      const u = new URL(url);
      const raw = u.searchParams.get('imgurl');
      if (raw) {
        const decoded = decodeURIComponent(raw);
        if (/^https?:\/\//i.test(decoded)) return decoded;
      }
    }
    // Otherwise return as-is if it looks like http(s)
    if (/^https?:\/\//i.test(url)) return url;
  } catch (_) {}
  return undefined;
}

export async function getProvinces(): Promise<ProvinceRow[]> {
  if (provincesCache) return provincesCache;
  const { data, error } = await supabase
    .from('provinces')
    .select('id,name,imageUrl')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  provincesCache = (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    imageUrl: normalizeImageUrl(p.imageUrl),
  }));
  return provincesCache;
}

export async function getMunicipalities(provinceId: string): Promise<MunicipalityRow[]> {
  if (municipalitiesCache.has(provinceId)) return municipalitiesCache.get(provinceId)!;
  const { data, error } = await supabase
    .from('municipalities')
    .select('id,name,provinceId,imageUrl')
    .eq('provinceId', provinceId)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    provinceId: m.provinceId,
    imageUrl: normalizeImageUrl(m.imageUrl),
  }));
  municipalitiesCache.set(provinceId, rows);
  return rows;
}

export function buildGoogleMapsUrl(
  municipalityName: string,
  provinceName: string,
  address?: string | null
): string {
  // If address is provided, use it; otherwise fallback to municipality, province
  const query = address
    ? encodeURIComponent(`${address}, ${municipalityName}, ${provinceName}`)
    : encodeURIComponent(`${municipalityName}, ${provinceName}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}


