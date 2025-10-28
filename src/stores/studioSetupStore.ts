import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface StudioSetupStep1 {
  bannerType: 'ONE_IMAGE' | 'FOUR_IMAGES' | null;
  bannerImages: string[]; // Cloudinary URLs
}

export interface StudioSetupStep2 {
  logoUrl?: string; // Cloudinary URL
}

export interface StudioSetupStep3 {
  name: string;
  province: string;          // province name (for display)
  provinceId: string;        // province ID (for DB)
  municipality: string;      // municipality name (for display)
  municipalityId: string;    // municipality ID (for DB)
  address: string;
}

export interface StudioSetupStep4 {
  website?: string;
  instagram?: string;
  tiktok?: string;
}

export interface StudioSetupStep5 {
  description?: string;
}

export interface StudioSetupStep6 {
  styleIds: string[]; // tattoo style IDs
}

export interface StudioSetupStep7 {
  serviceIds: string[]; // service IDs
}

export interface StudioSetupStep8 {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export interface StudioSetupState {
  currentStep: number;
  totalSteps: number;
  studioId?: string; // Set when studio is created or loaded
  step1: StudioSetupStep1;
  step2: StudioSetupStep2;
  step3: StudioSetupStep3;
  step4: StudioSetupStep4;
  step5: StudioSetupStep5;
  step6: StudioSetupStep6;
  step7: StudioSetupStep7;
  step8: StudioSetupStep8;
  
  // Actions
  setCurrentStep: (step: number) => void;
  setStudioId: (id: string) => void;
  updateStep1: (data: Partial<StudioSetupStep1>) => void;
  updateStep2: (data: Partial<StudioSetupStep2>) => void;
  updateStep3: (data: Partial<StudioSetupStep3>) => void;
  updateStep4: (data: Partial<StudioSetupStep4>) => void;
  updateStep5: (data: Partial<StudioSetupStep5>) => void;
  updateStep6: (data: Partial<StudioSetupStep6>) => void;
  updateStep7: (data: Partial<StudioSetupStep7>) => void;
  updateStep8: (data: Partial<StudioSetupStep8>) => void;
  resetStore: () => void;
}

const initialState = {
  currentStep: 0,
  totalSteps: 9, // 0-8
  studioId: undefined,
  step1: {
    bannerType: null,
    bannerImages: [],
  },
  step2: {
    logoUrl: undefined,
  },
  step3: {
    name: '',
    province: '',
    provinceId: '',
    municipality: '',
    municipalityId: '',
    address: '',
  },
  step4: {
    website: undefined,
    instagram: undefined,
    tiktok: undefined,
  },
  step5: {
    description: undefined,
  },
  step6: {
    styleIds: [],
  },
  step7: {
    serviceIds: [],
  },
  step8: {
    faqs: [],
  },
};

export const useStudioSetupStore = create<StudioSetupState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        setCurrentStep: (step) => set({ currentStep: step }),
        
        setStudioId: (id) => set({ studioId: id }),
        
        updateStep1: (data) =>
          set((state) => ({
            step1: { ...state.step1, ...data },
          })),
        
        updateStep2: (data) =>
          set((state) => ({
            step2: { ...state.step2, ...data },
          })),
        
        updateStep3: (data) =>
          set((state) => ({
            step3: { ...state.step3, ...data },
          })),
        
        updateStep4: (data) =>
          set((state) => ({
            step4: { ...state.step4, ...data },
          })),
        
        updateStep5: (data) =>
          set((state) => ({
            step5: { ...state.step5, ...data },
          })),
        
        updateStep6: (data) =>
          set((state) => ({
            step6: { ...state.step6, ...data },
          })),
        
        updateStep7: (data) =>
          set((state) => ({
            step7: { ...state.step7, ...data },
          })),
        
        updateStep8: (data) =>
          set((state) => ({
            step8: { ...state.step8, ...data },
          })),
        
        resetStore: () => set(initialState),
      }),
      {
        name: 'studio-setup-storage',
        storage: {
          getItem: async (name) => {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (name, value) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
          },
        },
      }
    )
  )
);

