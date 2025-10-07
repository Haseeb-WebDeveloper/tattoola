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
}

export interface ArtistV2Step5 {
  studioName: string;
  province: string;
  municipality: string;
  studioAddress: string;
  website?: string;
  phone: string;
}

interface ArtistV2RegistrationState {
  step3: Partial<ArtistV2Step3>;
  step4: Partial<ArtistV2Step4>;
  step5: Partial<ArtistV2Step5>;

  currentStepDisplay: number;
  totalStepsDisplay: number;
  errors: Record<string, string>;
  isSubmitting: boolean;

  updateStep3: (data: Partial<ArtistV2Step3>) => void;
  setAvatar: (uri?: string) => void;
  updateStep4: (data: Partial<ArtistV2Step4>) => void;
  setWorkArrangement: (w: WorkArrangement) => void;
  updateStep5: (data: Partial<ArtistV2Step5>) => void;
  setCurrentStepDisplay: (n: number) => void;
  reset: () => void;
}

const initialState: Pick<ArtistV2RegistrationState, 'step3'|'step4'|'step5'|'currentStepDisplay'|'totalStepsDisplay'|'errors'|'isSubmitting'> = {
  step3: {},
  step4: {},
  step5: {},
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
        updateStep3: (data) => set((s) => ({ step3: { ...s.step3, ...data } })),
        setAvatar: (uri) => set((s) => ({ step3: { ...s.step3, avatar: uri } })),
        updateStep4: (data) => set((s) => ({ step4: { ...s.step4, ...data } })),
        setWorkArrangement: (w) => set((s) => ({ step4: { ...s.step4, workArrangement: w } })),
        updateStep5: (data) => set((s) => ({ step5: { ...s.step5, ...data } })),
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
        partialize: (state) => ({ step3: state.step3, step4: state.step4, step5: state.step5, currentStepDisplay: state.currentStepDisplay }),
      }
    ),
    { name: 'artist-registration-v2-store' }
  )
);


