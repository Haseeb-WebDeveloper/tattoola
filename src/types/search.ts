export type ArtistSearchResult = {
  id: string;
  userId: string;
  user: {
    username: string;
    avatar: string | null;
  };
  businessName: string | null;
  yearsExperience: number | null;
  isStudioOwner: boolean;
  location: {
    province: string;
    municipality: string;
    address: string | null;
  } | null;
  styles: { id: string; name: string }[];
  bannerMedia: { mediaUrl: string; mediaType: "IMAGE" | "VIDEO"; order: number }[];
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
  locations: {
    province: string;
    municipality: string;
    address: string | null;
  }[];
  styles: { id: string; name: string }[];
  bannerMedia: { mediaUrl: string; mediaType: "IMAGE" | "VIDEO"; order: number }[];
  subscription: {
    plan: { name: string; type: string };
  } | null;
};

export type SearchFilters = {
  styleIds: string[];
  serviceIds: string[];
  provinceId: string | null;
  municipalityId: string | null;
};

export type SearchTab = "all" | "artists" | "studios";

export type SearchResults = {
  artists: ArtistSearchResult[];
  studios: StudioSearchResult[];
};

