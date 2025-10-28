import { create } from "zustand";
import type {
  ArtistSearchResult,
  SearchFilters,
  SearchResults,
  SearchTab,
  StudioSearchResult,
} from "@/types/search";
import { searchAll, searchArtists, searchStudios } from "@/services/search.service";

type SearchState = {
  activeTab: SearchTab;
  filters: SearchFilters;
  results: SearchResults;
  page: number;
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
}));

