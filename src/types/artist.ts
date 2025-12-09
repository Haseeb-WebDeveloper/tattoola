export type ArtistSelfProfileInterface = {
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
  artistProfile: {
    id: string;
    businessName?: string;
    bio?: string;
    workArrangement?: "STUDIO_OWNER" | "STUDIO_EMPLOYEE" | "FREELANCE";
    banner: { mediaType: "IMAGE" | "VIDEO"; mediaUrl: string; order: number }[];
  };
  location?: {
    id: string;
    address?: string;
    province: {
      id: string;
      name: string;
      code?: string;
    };
    municipality: {
      id: string;
      name: string;
    };
    isPrimary: boolean;
  };
  favoriteStyles: {
    id: string;
    name: string;
    imageUrl?: string | null;
    isFavorite?: boolean;
  }[];
  services: { id: string; name: string; description?: string | null; imageUrl?: string | null }[];
  collections: Array<{
    id: string;
    name: string;
    isPortfolioCollection: boolean;
    thumbnails: string[]; // up to 4
  }>;
  bodyPartsNotWorkedOn: { id: string; name: string }[];
};
