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
  province: string;
  municipality: string;
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
  favoriteStyles: string[]; // up to AR_MAX_FAVORITE_STYLES
  mainStyleId?: string; // one of favoriteStyles
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
  setPrimaryStyle: (styleId: string) => void;
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
  step5: {},
  step7: {},
  step8: { favoriteStyles: [] },
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
          console.log('[ArtistRegistrationV2Store] Step 3 updated:', data);
          set((s) => ({ step3: { ...s.step3, ...data } }));
        },
        setAvatar: (uri) => {
          console.log('[ArtistRegistrationV2Store] Step 3 avatar updated:', uri);
          set((s) => ({ step3: { ...s.step3, avatar: uri } }));
        },
        updateStep4: (data) => {
          console.log('[ArtistRegistrationV2Store] Step 4 updated:', data);
          set((s) => ({ step4: { ...s.step4, ...data } }));
        },
        // Convenience setter for certificate URL
        setCertificateUrl: (url?: string) => {
          console.log('[ArtistRegistrationV2Store] Step 4 certificateUrl updated:', url);
          set((s) => ({ step4: { ...s.step4, certificateUrl: url } }));
        },
        setWorkArrangement: (w) => {
          console.log('[ArtistRegistrationV2Store] Step 4 workArrangement updated:', w);
          set((s) => ({ step4: { ...s.step4, workArrangement: w } }));
        },
        updateStep5: (data) => {
          console.log('[ArtistRegistrationV2Store] Step 5 updated:', data);
          set((s) => ({ step5: { ...s.step5, ...data } }));
        },
        updateStep7: (data) => {
          console.log('[ArtistRegistrationV2Store] Step 7 updated:', data);
          set((s) => ({ step7: { ...s.step7, ...data } }));
        },
        updateStep8: (data) => {
          console.log('[ArtistRegistrationV2Store] Step 8 updated:', data);
          set((s) => ({ step8: { ...s.step8, ...data } }));
        },
        toggleFavoriteStyle: (styleId, max) => {
          set((s) => {
            const current = s.step8.favoriteStyles || [];
            const exists = current.includes(styleId);
            const next = exists ? current.filter((id) => id !== styleId) : (current.length < max ? [...current, styleId] : current);
            const mainValid = s.step8.mainStyleId && next.includes(s.step8.mainStyleId) ? s.step8.mainStyleId : undefined;
            return { step8: { ...s.step8, favoriteStyles: next, mainStyleId: mainValid } } as any;
          });
        },
        setPrimaryStyle: (styleId) => {
          set((s) => {
            if (!(s.step8.favoriteStyles || []).includes(styleId)) return s as any;
            return { step8: { ...s.step8, mainStyleId: styleId } } as any;
          });
        },
        updateStep9: (data) => {
          console.log('[ArtistRegistrationV2Store] Step 9 updated:', data);
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
          console.log('[ArtistRegistrationV2Store] Step 10 updated:', data);
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
          console.log('[ArtistRegistrationV2Store] Step 11 updated:', data);
          set((s) => ({ step11: { ...s.step11, ...data } }));
        },
        updateStep12: (data) => {
          console.log('[ArtistRegistrationV2Store] Step 12 updated:', data);
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
          console.log('[ArtistRegistrationV2Store] Step 13 updated:', data);
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
