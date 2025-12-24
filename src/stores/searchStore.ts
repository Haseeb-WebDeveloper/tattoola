import { getFacets } from "@/services/facet.service";
import { searchArtists, searchStudios } from "@/services/search.service";
import type { Facets } from "@/types/facets";
import type { SearchFilters, SearchResults, SearchTab, SearchTotals } from "@/types/search";
import { create } from "zustand";

type SearchState = {
  activeTab: SearchTab;
  filters: SearchFilters;
  results: SearchResults;
  totals: SearchTotals;
  facets: Facets | null;
  page: number;
  isInitializing: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isLoadingFacets: boolean;
  hasMore: boolean;
  error: string | null;
  locationDisplay: {
    province: string;
    municipality: string;
  } | null;

  // Actions
  setActiveTab: (tab: SearchTab) => void;
  updateFilters: (filters: Partial<SearchFilters>, options?: { skipLoadFacets?: boolean }) => void;
  clearFilters: () => void;
  setLocation: (province: string, municipality: string) => void;
  clearLocation: () => void;
  search: () => Promise<void>;
  loadMore: () => Promise<void>;
  loadFacets: () => Promise<void>;
  resetSearch: () => void;
  resetFilters: () => void;
};

const initialFilters: SearchFilters = {
  styleIds: [],
  serviceIds: [],
  provinceId: null,
  municipalityId: null,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  activeTab: "artists",
  filters: initialFilters,
  results: {
    artists: [],
    studios: [],
  },
  totals: {
    artists: 0,
    studios: 0,
  },
  facets: null,
  page: 0,
  isInitializing: true,
  isLoading: false,
  isLoadingMore: false,
  isLoadingFacets: false,
  hasMore: true,
  error: null,
  locationDisplay: null,

  setActiveTab: (tab: SearchTab) => {
    set({ activeTab: tab });
    // Re-search with new tab and reload facets
    get().search();
    get().loadFacets();
  },

  updateFilters: (newFilters: Partial<SearchFilters>, options?: { skipLoadFacets?: boolean }) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    if (!options?.skipLoadFacets) {
      // Reload facets when filters change
      get().loadFacets();
    }
  },

  clearFilters: () => {
    set({
      filters: initialFilters,
      locationDisplay: null,
    });
    get().search();
  },

  setLocation: (province: string, municipality: string) => {
    set({
      locationDisplay: { province, municipality },
    });
  },

  clearLocation: () => {
    set((state) => ({
      filters: {
        ...state.filters,
        provinceId: null,
        municipalityId: null,
      },
      locationDisplay: null,
    }));
    get().search();
  },

  search: async () => {
    const { activeTab, filters, isInitializing, results } = get();
    set({ isLoading: true, error: null, page: 0 });

    try {
      if (activeTab === "artists") {
        const result = await searchArtists({ filters, page: 0 });
        set({
          results: {
            artists: result.data,
            studios: results.studios, // Preserve existing studios data
          },
          totals: {
            artists: result.total,
            studios: get().totals.studios,
          },
          hasMore: result.hasMore,
          error: result.error || null,
          isLoading: false,
          isInitializing: false,
        });
      } else if (activeTab === "studios") {
        const result = await searchStudios({ filters, page: 0 });
        set({
          results: {
            artists: results.artists, // Preserve existing artists data
            studios: result.data,
          },
          totals: {
            artists: get().totals.artists,
            studios: result.total,
          },
          hasMore: result.hasMore,
          error: result.error || null,
          isLoading: false,
          isInitializing: false,
        });
      }
      // Load facets after search completes
      get().loadFacets();
    } catch (error: any) {
      set({
        error: error.message || "An error occurred while searching",
        isLoading: false,
        isInitializing: false,
      });
    }
  },

  loadMore: async () => {
    const { activeTab, filters, page, hasMore, isLoadingMore, results } = get();

    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    const nextPage = page + 1;

    try {
      if (activeTab === "artists") {
        const result = await searchArtists({ filters, page: nextPage });
        set({
          results: {
            ...results,
            artists: [...results.artists, ...result.data],
          },
          // totals stay the same; paging doesn't change total
          page: nextPage,
          hasMore: result.hasMore,
          isLoadingMore: false,
        });
      } else if (activeTab === "studios") {
        const result = await searchStudios({ filters, page: nextPage });
        set({
          results: {
            ...results,
            studios: [...results.studios, ...result.data],
          },
          // totals stay the same; paging doesn't change total
          page: nextPage,
          hasMore: result.hasMore,
          isLoadingMore: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || "An error occurred while loading more",
        isLoadingMore: false,
      });
    }
  },

  loadFacets: async () => {
    const { activeTab, filters } = get();
    set({ isLoadingFacets: true });
    try {
      const facets = await getFacets({ filters, activeTab });
      set({ facets, isLoadingFacets: false });
    } catch (error: any) {
      console.error("Error loading facets:", error);
      set({ isLoadingFacets: false });
    }
  },

  resetSearch: () => {
    set({
      activeTab: "artists",
      filters: initialFilters,
      results: {
        artists: [],
        studios: [],
      },
      totals: {
        artists: 0,
        studios: 0,
      },
      facets: null,
      page: 0,
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      error: null,
      locationDisplay: null,
    });
  },

  resetFilters: () => {
    set({ filters: initialFilters, locationDisplay: null, totals: { artists: 0, studios: 0 } });
    get().search();
    get().loadFacets();
  },
}));