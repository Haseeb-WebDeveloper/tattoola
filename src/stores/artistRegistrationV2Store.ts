import { WorkArrangement } from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface ArtistV2Step3 {
  firstName: string;
  lastName: string;
  avatar?: string; // local uri or uploaded url
}

export interface ArtistV2Step4 {
  workArrangement?: WorkArrangement;
  certificateUrl?: string; // Cloudinary URL to certificate (image/pdf)
}

export interface ArtistV2Step5 {
  studioName: string;
  province: string;          // province name (for display)
  provinceId: string;        // province ID (for DB)
  municipality: string;      // municipality name (for display)
  municipalityId: string;    // municipality ID (for DB)
  studioAddress: string;
  website?: string;
  phone: string;
}

export interface ArtistV2Step7 {
  bio?: string;
  instagram?: string;
  tiktok?: string;
}

export interface ArtistV2Step8 {
  // All styles selected via checkboxes (total styles artist works in)
  styles: string[];
  // Subset of styles marked as favorites via star icons
  favoriteStyles: string[];
}

export interface ArtistV2Step9 {
  servicesOffered: string[]; // service IDs
}

export interface ArtistV2Step10 {
  bodyParts: string[]; // body part IDs
}

export interface ArtistV2Step11 {
  minimumPrice?: number;
  hourlyRate?: number;
}

export interface PortfolioProjectInput {
  title?: string;
  description?: string;
  photos: string[]; // urls
  videos: string[]; // urls
}

export interface ArtistV2Step12 {
  projects: PortfolioProjectInput[]; // up to 4
}

export interface ArtistV2Step13 {
  selectedPlanId: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
}

interface ArtistV2RegistrationState {
  step3: Partial<ArtistV2Step3>;
  step4: Partial<ArtistV2Step4>;
  step5: Partial<ArtistV2Step5>;
  step7: Partial<ArtistV2Step7>;
  step8: Partial<ArtistV2Step8>;
  step9: Partial<ArtistV2Step9>;
  step10: Partial<ArtistV2Step10>;
  step11: Partial<ArtistV2Step11>;
  step12: Partial<ArtistV2Step12>;
  step13: Partial<ArtistV2Step13>;

  currentStepDisplay: number;
  totalStepsDisplay: number;
  errors: Record<string, string>;
  isSubmitting: boolean;

  updateStep3: (data: Partial<ArtistV2Step3>) => void;
  setAvatar: (uri?: string) => void;
  updateStep4: (data: Partial<ArtistV2Step4>) => void;
  setWorkArrangement: (w: WorkArrangement) => void;
  updateStep5: (data: Partial<ArtistV2Step5>) => void;
  updateStep7: (data: Partial<ArtistV2Step7>) => void;
  updateStep8: (data: Partial<ArtistV2Step8>) => void;
  toggleFavoriteStyle: (styleId: string, max: number) => void;
  setPrimaryStyle: (styleId: string, maxFavorites: number) => void;
  updateStep9: (data: Partial<ArtistV2Step9>) => void;
  toggleService: (serviceId: string) => void;
  updateStep10: (data: Partial<ArtistV2Step10>) => void;
  toggleBodyPart: (bodyPartId: string) => void;
  updateStep11: (data: Partial<ArtistV2Step11>) => void;
  updateStep12: (data: Partial<ArtistV2Step12>) => void;
  setProjectAtIndex: (idx: number, project: PortfolioProjectInput) => void;
  updateStep13: (data: Partial<ArtistV2Step13>) => void;
  setCurrentStepDisplay: (n: number) => void;
  reset: () => void;
}

const initialState: Pick<ArtistV2RegistrationState, 'step3'|'step4'|'step5'|'step7'|'step8'|'step9'|'step10'|'step11'|'step12'|'step13'|'currentStepDisplay'|'totalStepsDisplay'|'errors'|'isSubmitting'> = {
  step3: {},
  step4: {},
  step5: { studioName: '', province: '', provinceId: '', municipality: '', municipalityId: '', studioAddress: '', phone: '', website: '' },
  step7: {},
  step8: { styles: [], favoriteStyles: [] },
  step9: { servicesOffered: [] },
  step10: { bodyParts: [] },
  step11: {},
  step12: { projects: [] },
  step13: { billingCycle: 'MONTHLY' },
  currentStepDisplay: 3,
  totalStepsDisplay: 13,
  errors: {},
  isSubmitting: false,
};

export const useArtistRegistrationV2Store = create<ArtistV2RegistrationState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        updateStep3: (data) => {
          set((s) => ({ step3: { ...s.step3, ...data } }));
        },
        setAvatar: (uri) => {
          set((s) => ({ step3: { ...s.step3, avatar: uri } }));
        },
        updateStep4: (data) => {
          set((s) => ({ step4: { ...s.step4, ...data } }));
        },
        // Convenience setter for certificate URL
        setCertificateUrl: (url?: string) => {
          set((s) => ({ step4: { ...s.step4, certificateUrl: url } }));
        },
        setWorkArrangement: (w) => {
          set((s) => ({ step4: { ...s.step4, workArrangement: w } }));
        },
        updateStep5: (data) => {
          set((s) => ({ step5: { ...s.step5, ...data } }));
        },
        updateStep7: (data) => {
          set((s) => ({ step7: { ...s.step7, ...data } }));
        },
        updateStep8: (data) => {
          set((s) => ({ step8: { ...s.step8, ...data } }));
        },
        // Toggle a style in the overall selected list (checkbox)
        toggleFavoriteStyle: (styleId, max) => {
          set((s) => {
            const current = s.step8.styles || [];
            const exists = current.includes(styleId);
            let next = current;
            if (exists) {
              // Remove from selected and also from favourites subset
              next = current.filter((id) => id !== styleId);
            } else if (current.length < max) {
              next = [...current, styleId];
            }

            const currentFavs = s.step8.favoriteStyles || [];
            const nextFavs = currentFavs.filter((id) => next.includes(id));

            return {
              step8: {
                ...s.step8,
                styles: next,
                favoriteStyles: nextFavs,
              },
            } as any;
          });
        },
        // Toggle a style as favourite (star) within the selected list,
        // respecting max allowed favourites
        setPrimaryStyle: (styleId, maxFavorites) => {
          set((s) => {
            const selected = s.step8.styles || [];
            if (!selected.includes(styleId)) return s as any;

            const currentFavs = s.step8.favoriteStyles || [];
            const isFav = currentFavs.includes(styleId);

            if (isFav) {
              // Unmark as favourite
              return {
                step8: {
                  ...s.step8,
                  favoriteStyles: currentFavs.filter((id) => id !== styleId),
                },
              } as any;
            }

            if (currentFavs.length >= maxFavorites) {
              // Cannot add more favourites
              return s as any;
            }

            return {
              step8: {
                ...s.step8,
                favoriteStyles: [...currentFavs, styleId],
              },
            } as any;
          });
        },
        updateStep9: (data) => {
          set((s) => ({ step9: { ...s.step9, ...data } }));
        },
        toggleService: (serviceId) => {
          set((s) => {
            const current = s.step9.servicesOffered || [];
            const exists = current.includes(serviceId);
            const next = exists ? current.filter((id) => id !== serviceId) : [...current, serviceId];
            return { step9: { ...s.step9, servicesOffered: next } } as any;
          });
        },
        updateStep10: (data) => {
          set((s) => ({ step10: { ...s.step10, ...data } }));
        },
        toggleBodyPart: (bodyPartId) => {
          set((s) => {
            const current = s.step10.bodyParts || [];
            const exists = current.includes(bodyPartId);
            const next = exists ? current.filter((id) => id !== bodyPartId) : [...current, bodyPartId];
            return { step10: { ...s.step10, bodyParts: next } } as any;
          });
        },
        updateStep11: (data) => {
          set((s) => ({ step11: { ...s.step11, ...data } }));
        },
        updateStep12: (data) => {
          set((s) => ({ step12: { ...s.step12, ...data } }));
        },
        setProjectAtIndex: (idx, project) => {
          set((s) => {
            const arr = [...(s.step12.projects || [])];
            arr[idx] = project;
            return { step12: { ...s.step12, projects: arr } } as any;
          });
        },
        updateStep13: (data) => {
          set((s) => ({ step13: { ...s.step13, ...data } }));
        },
        setCurrentStepDisplay: (n) => set({ currentStepDisplay: n }),
        reset: () => set(initialState),
      }),
      {
        name: 'artist-registration-v2',
        storage: {
          getItem: async (name: string) => {
            const v = await AsyncStorage.getItem(name);
            return v ? JSON.parse(v) : null;
          },
          setItem: async (name: string, value: any) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name: string) => {
            await AsyncStorage.removeItem(name);
          },
        },
        partialize: (state) => ({ step3: state.step3, step4: state.step4, step5: state.step5, step7: state.step7, step8: state.step8, step9: state.step9, step10: state.step10, step11: state.step11, step12: state.step12, step13: state.step13, currentStepDisplay: state.currentStepDisplay }),
      }
    ),
    { name: 'artist-registration-v2-store' }
  )
);
