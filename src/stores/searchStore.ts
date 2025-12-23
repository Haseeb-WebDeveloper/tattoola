import { getFacets } from "@/services/facet.service";
import { searchArtists, searchStudios } from "@/services/search.service";
import type { Facets } from "@/types/facets";
import type { SearchFilters, SearchResults, SearchTab } from "@/types/search";
import { create } from "zustand";

type SearchState = {
  activeTab: SearchTab;
  filters: SearchFilters;
  results: SearchResults;
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
  updateFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  setLocation: (province: string, municipality: string) => void;
  clearLocation: () => void;
  search: (tab?: SearchTab, defaultProvinceId?: string | null) => Promise<void>;
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
    // Re-search with new tab (search will reload facets at the end)
    // Pass tab explicitly to ensure correct tab is used
    get().search(tab);
  },

  updateFilters: (newFilters: Partial<SearchFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    // Note: Don't call loadFacets() here automatically
    // Let the caller decide when to reload facets (usually after search completes)
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

  search: async (tab?: SearchTab, defaultProvinceId?: string | null) => {
    const state = get();
    // Use provided tab or fall back to current activeTab
    const activeTab = tab ?? state.activeTab;
    const { filters, isInitializing, results } = state;
    set({ isLoading: true, error: null, page: 0 });

    try {
      if (activeTab === "artists") {
        const result = await searchArtists({ filters, page: 0, defaultProvinceId });
        set({
          results: {
            artists: result.data,
            studios: results.studios, // Preserve existing studios data
          },
          hasMore: result.hasMore,
          error: result.error || null,
          isLoading: false,
          isInitializing: false,
        });
      } else if (activeTab === "studios") {
        const result = await searchStudios({ filters, page: 0, defaultProvinceId });
        set({
          results: {
            artists: results.artists, // Preserve existing artists data
            studios: result.data,
          },
          hasMore: result.hasMore,
          error: result.error || null,
          isLoading: false,
          isInitializing: false,
        });
      }
      // Load facets after search completes
      // activeTab should already be set correctly by setActiveTab
      await get().loadFacets();
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
    set({ filters: initialFilters, locationDisplay: null });
    // search() will reload facets at the end
    get().search();
  },
}));
