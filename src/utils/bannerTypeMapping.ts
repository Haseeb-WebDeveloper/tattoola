import type { BannerType } from "@/types/banner";

// Type mapping helpers for DB enum conversion
export const appTypeToDb = (type: BannerType): string | null => {
  if (!type) return null;
  const map: Record<string, string> = { 
    '4_IMAGES': 'FOUR_IMAGES', 
    '1_IMAGE': 'ONE_IMAGE', 
    '1_VIDEO': 'ONE_VIDEO' 
  };
  return map[type];
};

export const dbTypeToApp = (type: string | null): BannerType => {
  if (!type) return null;
  const map: Record<string, BannerType> = { 
    'FOUR_IMAGES': '4_IMAGES', 
    'ONE_IMAGE': '1_IMAGE', 
    'ONE_VIDEO': '1_VIDEO' 
  };
  return map[type] || null;
};

