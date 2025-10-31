// Style selection limits
export const TL_MAX_FAVORITE_STYLES = 4; // Tattoola Lover
export const AR_MAX_FAVORITE_STYLES = 5; // Artist (basic plan default)

// Metadata tags used on Supabase auth user
export const DISPLAY_NAME_TL = 'TL';
export const DISPLAY_NAME_AR = 'AR';


// Search limits
// For all tab we fetch 21 artist and 21 studios then combine them so total results is 42. On load more we fetch 42 result more.
// For artists tab we fetch 21 artist. On load more we fetch next 21 artist so total results is 42. Same for studios tab.
export const SEARCH_RESULTS_PER_PAGE = 20;