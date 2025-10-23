import type {
    UserV2Step3,
    UserV2Step4,
    UserV2Step5,
    UserV2Step6,
    UserV2Step7,
} from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UserV2RegistrationState {
  // Steps data
  step3: Partial<UserV2Step3>;
  step4: Partial<UserV2Step4>;
  step5: Partial<UserV2Step5>;
  step6: Partial<UserV2Step6>;
  step7: Partial<UserV2Step7>;

  // UI/progress
  currentStepDisplay: number; // what we show in progress indicator
  totalStepsDisplay: number;  // total dots to show
  errors: Record<string, string>;
  isSubmitting: boolean;

  // Actions
  updateStep3: (data: Partial<UserV2Step3>) => void;
  updateStep4: (data: Partial<UserV2Step4>) => void;
  updateStep5: (data: Partial<UserV2Step5>) => void;
  updateStep6: (data: Partial<UserV2Step6>) => void;
  updateStep7: (data: Partial<UserV2Step7>) => void;
  updateStep: (step: string, data: any) => void; // Generic update for compatibility
  setAvatar: (url?: string) => void;
  setCurrentStepDisplay: (n: number) => void;
  setCurrentStep: (n: number) => void; // Alias for setCurrentStepDisplay
  setErrors: (e: Record<string, string>) => void;
  clearErrors: () => void;
  setSubmitting: (v: boolean) => void;
  reset: () => void;
  clearRegistration: () => void; // Alias for reset
}

const initialState: Pick<UserV2RegistrationState, 'step3' | 'step4' | 'step5' | 'step6' | 'step7' | 'currentStepDisplay' | 'totalStepsDisplay' | 'errors' | 'isSubmitting'> = {
  step3: {},
  step4: { province: '', provinceId: '', municipality: '', municipalityId: '' },
  step5: {},
  step6: {},
  step7: {},
  currentStepDisplay: 3, // show as step 3 in progress bar
  totalStepsDisplay: 7, // User registration has 7 steps
  errors: {},
  isSubmitting: false,
};

export const useUserRegistrationV2Store = create<UserV2RegistrationState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        updateStep3: (data) => set((s) => ({ step3: { ...s.step3, ...data } })),
        updateStep4: (data) => set((s) => ({ step4: { ...s.step4, ...data } })),
        updateStep5: (data) => set((s) => ({ step5: { ...s.step5, ...data } })),
        updateStep6: (data) => set((s) => ({ step6: { ...s.step6, ...data } })),
        updateStep7: (data) => set((s) => ({ step7: { ...s.step7, ...data } })),
        updateStep: (step, data) => set((s) => {
          const currentStep = s[step as keyof UserV2RegistrationState];
          if (currentStep && typeof currentStep === 'object') {
            return { [step]: { ...currentStep, ...data } } as any;
          }
          return {};
        }),
        setAvatar: (url) => set((s) => ({ step3: { ...s.step3, avatar: url } })),
        setCurrentStepDisplay: (n) => set({ currentStepDisplay: n }),
        setCurrentStep: (n) => set({ currentStepDisplay: n }),
        setErrors: (e) => set({ errors: e }),
        clearErrors: () => set({ errors: {} }),
        setSubmitting: (v) => set({ isSubmitting: v }),
        reset: () => set(initialState),
        clearRegistration: () => set(initialState),
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
        partialize: (state) => ({
          step3: state.step3,
          step4: state.step4,
          step5: state.step5,
          step6: state.step6,
          step7: state.step7,
          currentStepDisplay: state.currentStepDisplay
        }),
      }
    ),
    { name: 'user-registration-v2-store' }
  )
);


