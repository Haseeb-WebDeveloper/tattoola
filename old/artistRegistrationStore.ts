import type {
  ArtistRegistrationStep0,
  ArtistRegistrationStep1,
  ArtistRegistrationStep10,
  ArtistRegistrationStep11,
  ArtistRegistrationStep2,
  ArtistRegistrationStep3,
  ArtistRegistrationStep4,
  ArtistRegistrationStep5,
  ArtistRegistrationStep6,
  ArtistRegistrationStep7,
  ArtistRegistrationStep8,
  ArtistRegistrationStep9,
  CompleteArtistRegistration,
  FormErrors
} from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ArtistRegistrationState {
  // Registration data
  step0: Partial<ArtistRegistrationStep0>;
  step1: Partial<ArtistRegistrationStep1>;
  step2: Partial<ArtistRegistrationStep2>;
  step3: Partial<ArtistRegistrationStep3>;
  step4: Partial<ArtistRegistrationStep4>;
  step5: Partial<ArtistRegistrationStep5>;
  step6: Partial<ArtistRegistrationStep6>;
  step7: Partial<ArtistRegistrationStep7>;
  step8: Partial<ArtistRegistrationStep8>;
  step9: Partial<ArtistRegistrationStep9>;
  step10: Partial<ArtistRegistrationStep10>;
  step11: Partial<ArtistRegistrationStep11>;

  // UI state
  currentStep: number;
  errors: FormErrors;
  isSubmitting: boolean;

  // Actions
  updateStep: <T extends keyof CompleteArtistRegistration>(
    step: T,
    data: CompleteArtistRegistration[T]
  ) => void;
  setCurrentStep: (step: number) => void;
  setErrors: (errors: FormErrors) => void;
  clearErrors: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
  clearRegistration: () => void;
  resetToStep: (step: number) => void;
  
  // Getters
  getStepData: <T extends keyof CompleteArtistRegistration>(
    step: T
  ) => CompleteArtistRegistration[T] | undefined;
  isStepComplete: (step: number) => boolean;
  getCompletedSteps: () => number[];
  isRegistrationComplete: () => boolean;
}

const initialState = {
  step0: {},
  step1: {},
  step2: {},
  step3: {},
  step4: {},
  step5: {},
  step6: {},
  step7: {},
  step8: {},
  step9: {},
  step10: {},
  step11: {},
  currentStep: 0,
  errors: {},
  isSubmitting: false,
};

export const useArtistRegistrationStore = create<ArtistRegistrationState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        updateStep: (step, data) => {
          // Log when a step updates
          console.log(`[ArtistRegistrationStore] Step updated:`, step, data);
          set((state) => ({
            ...state,
            [step]: data,
            errors: {}, // Clear errors when updating step
          }));
        },

        setCurrentStep: (step) => {
          // Log when current step changes
          console.log(`[ArtistRegistrationStore] Current step set to:`, step);
          set({ currentStep: step });
        },

        setErrors: (errors) => {
          set({ errors });
        },

        clearErrors: () => {
          set({ errors: {} });
        },

        setSubmitting: (isSubmitting) => {
          set({ isSubmitting });
        },

        clearRegistration: () => {
          // Log when registration is cleared
          console.log(`[ArtistRegistrationStore] Registration cleared`);
          set(initialState);
        },

        resetToStep: (step) => {
          // Log when registration is reset to a step
          console.log(`[ArtistRegistrationStore] Reset to step:`, step);
          const state = get();
          const newState = { ...initialState, currentStep: step };
          
          // Keep data from steps before the reset step
          for (let i = 0; i < step; i++) {
            const stepKey = `step${i}` as keyof CompleteArtistRegistration;
            if (state[stepKey]) {
              (newState as any)[stepKey] = state[stepKey];
            }
          }
          
          set(newState);
        },

        getStepData: (step) => {
          const state = get();
          return state[step] as any;
        },

        isStepComplete: (step) => {
          const state = get();
          const stepKey = `step${step}` as keyof CompleteArtistRegistration;
          const stepData = state[stepKey];
          
          if (!stepData) return false;
          
          // Check if all required fields are filled
          const requiredFields = getRequiredFieldsForStep(step);
          return requiredFields.every(field => {
            const value = (stepData as any)[field];
            return value !== undefined && value !== null && value !== '';
          });
        },

        getCompletedSteps: () => {
          const state = get();
          const completedSteps: number[] = [];
          
          for (let i = 0; i <= 11; i++) {
            if (state.isStepComplete(i)) {
              completedSteps.push(i);
            }
          }
          
          return completedSteps;
        },

        isRegistrationComplete: () => {
          const state = get();
          return state.getCompletedSteps().length === 14; // 0-11 steps
        },
      }),
      {
        name: 'artist-registration-storage',
        storage: {
          getItem: async (name: string) => {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (name: string, value: any) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name: string) => {
            await AsyncStorage.removeItem(name);
          },
        },
        partialize: (state) => ({
          step0: state.step0,
          step1: state.step1,
          step2: state.step2,
          step3: state.step3,
          step4: state.step4,
          step5: state.step5,
          step6: state.step6,
          step7: state.step7,
          step8: state.step8,
          step9: state.step9,
          step10: state.step10,
          step11: state.step11,
          currentStep: state.currentStep,
        }),
      }
    ),
    {
      name: 'artist-registration-store',
    }
  )
);

// Helper function to get required fields for each step
function getRequiredFieldsForStep(step: number): string[] {
  switch (step) {
    case 0:
      return ['selectedPlan', 'agreesToTerms'];
    case 1:
      return ['firstName', 'lastName'];
    case 2:
      return []; // Avatar is optional
    case 3:
      return ['workArrangement'];
    case 4:
      return ['businessName', 'province', 'municipality', 'studioAddress', 'phone', 'certificateUrl'];
    case 5:
      return []; // Bio is optional
    case 6:
      return ['favoriteStyles', 'mainStyleId'];
    case 7:
      return ['services'];
    case 8:
      return ['bodyParts'];
    case 9:
      return []; // Pricing is optional
    case 10:
      return ['projects'];
    case 11:
      return ['agreesToTerms'];
    default:
      return [];
  }
}

// Selector hooks for better performance
export const useArtistStep = (step: number) => {
  return useArtistRegistrationStore((state) => {
    const stepKey = `step${step}` as keyof CompleteArtistRegistration;
    return state[stepKey];
  });
};

export const useArtistCurrentStep = () => {
  return useArtistRegistrationStore((state) => state.currentStep);
};

export const useArtistErrors = () => {
  return useArtistRegistrationStore((state) => state.errors);
};

export const useArtistIsSubmitting = () => {
  return useArtistRegistrationStore((state) => state.isSubmitting);
};
