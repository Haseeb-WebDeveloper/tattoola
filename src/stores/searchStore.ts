import { getCurrentUserLocation } from "@/services/profile.service";
import { searchAll, searchArtists, searchStudios } from "@/services/search.service";
import type {
  SearchFilters,
  SearchResults,
  SearchTab
} from "@/types/search";
import { create } from "zustand";

type SearchState = {
  activeTab: SearchTab;
  filters: SearchFilters;
  results: SearchResults;
  page: number;
  isInitializing: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
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
  search: () => Promise<void>;
  loadMore: () => Promise<void>;
  resetSearch: () => void;
  initializeWithUserLocation: () => Promise<void>;
  resetFilters: () => void;
};

const initialFilters: SearchFilters = {
  styleIds: [],
  serviceIds: [],
  provinceId: null,
  municipalityId: null,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  activeTab: "all",
  filters: initialFilters,
  results: {
    artists: [],
    studios: [],
  },
  page: 0,
  isInitializing: true,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,
  locationDisplay: null,

  setActiveTab: (tab: SearchTab) => {
    set({ activeTab: tab });
    // Re-search with new tab
    get().search();
  },

  updateFilters: (newFilters: Partial<SearchFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
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
    const { activeTab, filters } = get();
    set({ isLoading: true, error: null, page: 0 });

    try {
      if (activeTab === "all") {
        const result = await searchAll({ filters, page: 0 });
        set({
          results: {
            artists: result.artists,
            studios: result.studios,
          },
          hasMore: result.hasMore,
          error: result.error || null,
          isLoading: false,
        });
      } else if (activeTab === "artists") {
        const result = await searchArtists({ filters, page: 0 });
        set({
          results: {
            artists: result.data,
            studios: [],
          },
          hasMore: result.hasMore,
          error: result.error || null,
          isLoading: false,
        });
      } else if (activeTab === "studios") {
        const result = await searchStudios({ filters, page: 0 });
        set({
          results: {
            artists: [],
            studios: result.data,
          },
          hasMore: result.hasMore,
          error: result.error || null,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || "An error occurred while searching",
        isLoading: false,
      });
    }
  },

  loadMore: async () => {
    const { activeTab, filters, page, hasMore, isLoadingMore, results } = get();

    if (!hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });
    const nextPage = page + 1;

    try {
      if (activeTab === "all") {
        const result = await searchAll({ filters, page: nextPage });
        set({
          results: {
            artists: [...results.artists, ...result.artists],
            studios: [...results.studios, ...result.studios],
          },
          page: nextPage,
          hasMore: result.hasMore,
          isLoadingMore: false,
        });
      } else if (activeTab === "artists") {
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

  resetSearch: () => {
    set({
      activeTab: "all",
      filters: initialFilters,
      results: {
        artists: [],
        studios: [],
      },
      page: 0,
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      error: null,
      locationDisplay: null,
    });
  },

  initializeWithUserLocation: async () => {
    set({ isInitializing: true, isLoading: true, error: null, page: 0, results: { artists: [], studios: [] } });
    try {
      const userLocation = await getCurrentUserLocation();
      if (userLocation) {
        set({
          filters: {
            ...get().filters,
            provinceId: userLocation.provinceId,
            municipalityId: userLocation.municipalityId,
          },
          locationDisplay: {
            province: userLocation.province,
            municipality: userLocation.municipality,
          },
        });
      }
      await get().search();
    } catch (error) {
      console.error("Error initializing with user location:", error);
      await get().search();
    } finally {
      set({ isInitializing: false });
    }
  },

  resetFilters: () => {
    set({ filters: initialFilters, locationDisplay: null });
    get().search();
  },
}));

