export type ArtistSearchResult = {
  id: string;
  userId: string;
  user: {
    username: string;
    avatar: string | null;
    firstName?: string | null;
    lastName?: string | null; 
  };
  businessName: string | null;
  yearsExperience: number | null;
  isStudioOwner: boolean;
  workArrangement: "STUDIO_OWNER" | "STUDIO_EMPLOYEE" | "FREELANCE" | null;
  bio?: string | null;
  location: {
    province: string;
    municipality: string;
    address: string | null;
  } | null;
  styles: { id: string; name: string; imageUrl?: string | null }[];
  services?: { id: string; name: string }[];
  bannerMedia: {
    mediaUrl: string;
    mediaType: "IMAGE" | "VIDEO";
    order: number;
  }[];
  subscription: {
    plan: { name: string; type: string };
  } | null;
  isVerified: boolean;
};

export type StudioSearchResult = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  ownerName?: string; // studio owner's display name
  locations: {
    province: string;
    municipality: string;
    address: string | null;
  }[];
  styles: { id: string; name: string }[];
  bannerMedia: {
    mediaUrl: string;
    mediaType: "IMAGE" | "VIDEO";
    order: number;
  }[];
  subscription: {
    plan: { name: string; type: string };
  } | null;
};

/**
 * Minimal studio data needed for instant first paint
 * Used when navigating from feed/search to studio profile
 */
export type StudioSummary = {
  id: string;
  name: string;
  logo: string | null;
  city?: string;
  province?: string;
  address?: string | null;
  owner?: {
    id: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
  } | null;
  banner?: Array<{
    mediaType: "IMAGE" | "VIDEO";
    mediaUrl: string;
    order: number;
  }>;
  styles?: Array<{ id: string; name: string }>;
  services?: Array<{ id: string; name: string }> | null;
  instagram?: string | null;
  tiktok?: string | null;
  website?: string | null;
  description?: string | null;
};

export type SearchFilters = {
  styleIds: string[];
  serviceIds: string[];
  provinceId: string | null;
  municipalityId: string | null;
};

export type SearchTab = "artists" | "studios" ;

export type SearchResults = {
  artists: ArtistSearchResult[];
  studios: StudioSearchResult[];
};

/**
 * Minimal artist profile data needed for instant first paint
 * Used when navigating from search to artist profile
 * Contains data already available in ArtistSearchResult
 */
export type ArtistProfileSummary = {
  businessName?: string | null;
  yearsExperience?: number | null;
  workArrangement?: "STUDIO_OWNER" | "STUDIO_EMPLOYEE" | "FREELANCE" | null;
  bio?: string | null;
  location?: {
    province: string;
    municipality: string;
    address: string | null;
  } | null;
  styles: { id: string; name: string }[];
  bannerMedia: { mediaUrl: string; mediaType: "IMAGE" | "VIDEO"; order: number }[];
};

