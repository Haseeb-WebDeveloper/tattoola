import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface UserV2Step3 {
  firstName: string;
  lastName: string;
  avatar?: string; // cloudinary url
}

interface UserV2RegistrationState {
  // Steps data (we'll add more later step-by-step)
  step3: Partial<UserV2Step3>;

  // UI/progress
  currentStepDisplay: number; // what we show in progress indicator
  totalStepsDisplay: number;  // total dots to show
  errors: Record<string, string>;
  isSubmitting: boolean;

  // Actions
  updateStep3: (data: Partial<UserV2Step3>) => void;
  setAvatar: (url?: string) => void;
  setCurrentStepDisplay: (n: number) => void;
  setErrors: (e: Record<string, string>) => void;
  clearErrors: () => void;
  setSubmitting: (v: boolean) => void;
  reset: () => void;
}

const initialState: Pick<UserV2RegistrationState, 'step3' | 'currentStepDisplay' | 'totalStepsDisplay' | 'errors' | 'isSubmitting'> = {
  step3: {},
  currentStepDisplay: 3, // show as step 3 in progress bar
  totalStepsDisplay: 13,
  errors: {},
  isSubmitting: false,
};

export const useUserRegistrationV2Store = create<UserV2RegistrationState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        updateStep3: (data) => set((s) => ({ step3: { ...s.step3, ...data } })),
        setAvatar: (url) => set((s) => ({ step3: { ...s.step3, avatar: url } })),
        setCurrentStepDisplay: (n) => set({ currentStepDisplay: n }),
        setErrors: (e) => set({ errors: e }),
        clearErrors: () => set({ errors: {} }),
        setSubmitting: (v) => set({ isSubmitting: v }),
        reset: () => set(initialState),
      }),
      {
        name: 'user-registration-v2',
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
        partialize: (state) => ({ step3: state.step3, currentStepDisplay: state.currentStepDisplay }),
      }
    ),
    { name: 'user-registration-v2-store' }
  )
);


