import { mvs, s } from "@/utils/scale";

// Feed limits for pagination. This is the number of posts on home screen to fetch per page.
export const FEED_POSTS_PER_PAGE = 12;

// Style selection limits
export const TL_MAX_FAVORITE_STYLES = 3; // Tattoola Lover
export const AR_MAX_STYLES = 3; // Artist
export const AR_MAX_FAVORITE_STYLES = 2; // Artist fav styles

// Metadata tags used on Supabase auth user
export const DISPLAY_NAME_TL = "TL";
export const DISPLAY_NAME_AR = "AR";

// Search limits
// For all tab we fetch 21 artist and 21 studios then combine them so total results is 42. On load more we fetch 42 result more.
// For artists tab we fetch 21 artist. On load more we fetch next 21 artist so total results is 42. Same for studios tab.
export const SEARCH_RESULTS_PER_PAGE = 20;

// Search filter compression mode
// "medium": Show filters that have at least 1 result for the current tab type (artists can be 0 on studios tab, studios can be 0 on artists tab)
// "high": Show filters only when both studios AND artists exist for that filter (common filters only)
export type SearchFilterCompression = "medium" | "high";
export const SEARCH_FILTER_COMPRESSION: SearchFilterCompression = "high";

// collection mame while aritst signup and we save his work posts
export const COLLECTION_NAME = {
  ARTIST_FAV_WORK: "Prefetti",
  ALL_POSTS: "Tutti",
};

export const BANNER_SMALL_CARD_HEIGHT = s(294);
export const BANNER_LARGE_CARD_HEIGHT = s(300);

// File upload size limits (in bytes)
export const UPLOAD_MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for JPG/PNG
export const UPLOAD_MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB for MP4/MOV/AVI

export const MOST_POPULAR_PROVINCES_IDS = [
  {
    id: "3a2cd93b-dec9-4a52-9a28-9d0f54468ad0",
    name: "Milano",
  },
];
