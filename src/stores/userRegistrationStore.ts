import type {
  CompleteUserRegistration,
  FormErrors,
  UserRegistrationStep1,
  UserRegistrationStep2,
  UserRegistrationStep3,
  UserRegistrationStep4,
  UserRegistrationStep5,
  UserRegistrationStep6,
} from '@/types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UserRegistrationState {
  // Registration data
  step1: Partial<UserRegistrationStep1>;
  step2: Partial<UserRegistrationStep2>;
  step3: Partial<UserRegistrationStep3>;
  step4: Partial<UserRegistrationStep4>;
  step5: Partial<UserRegistrationStep5>;
  step6: Partial<UserRegistrationStep6>;

  // UI state
  currentStep: number;
  errors: FormErrors;
  isSubmitting: boolean;

  // Actions
  updateStep: <T extends keyof CompleteUserRegistration>(
    step: T,
    data: CompleteUserRegistration[T]
  ) => void;
  setCurrentStep: (step: number) => void;
  setErrors: (errors: FormErrors) => void;
  clearErrors: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
  clearRegistration: () => void;
  resetToStep: (step: number) => void;
  
  // Getters
  getStepData: <T extends keyof CompleteUserRegistration>(
    step: T
  ) => CompleteUserRegistration[T] | undefined;
  isStepComplete: (step: number) => boolean;
  getCompletedSteps: () => number[];
  isRegistrationComplete: () => boolean;
}

const initialState = {
  step1: {},
  step2: {},
  step3: {},
  step4: {},
  step5: {},
  step6: {},
  currentStep: 1,
  errors: {},
  isSubmitting: false,
};

export const useUserRegistrationStore = create<UserRegistrationState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        updateStep: (step, data) => {
          set((state) => ({
            ...state,
            [step]: data,
            errors: {}, // Clear errors when updating step
          }));
        },

        setCurrentStep: (step) => {
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
          set(initialState);
        },

        resetToStep: (step) => {
          const state = get();
          const newState = { ...initialState, currentStep: step };
          
          // Keep data from steps before the reset step
          for (let i = 1; i < step; i++) {
            const stepKey = `step${i}` as keyof CompleteUserRegistration;
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
          const stepKey = `step${step}` as keyof CompleteUserRegistration;
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
          
          for (let i = 1; i <= 6; i++) {
            if (state.isStepComplete(i)) {
              completedSteps.push(i);
            }
          }
          
          return completedSteps;
        },

        isRegistrationComplete: () => {
          const state = get();
          return state.getCompletedSteps().length === 6; // 1-6 steps
        },
      }),
      {
        name: 'user-registration-storage',
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
          step1: state.step1,
          step2: state.step2,
          step3: state.step3,
          step4: state.step4,
          step5: state.step5,
          step6: state.step6,
          currentStep: state.currentStep,
        }),
      }
    ),
    {
      name: 'user-registration-store',
    }
  )
);

// Helper function to get required fields for each step
function getRequiredFieldsForStep(step: number): string[] {
  switch (step) {
    case 1:
      return ['firstName', 'lastName', 'phone'];
    case 2:
      return ['province', 'municipality'];
    case 3:
      return []; // Avatar is optional
    case 4:
      return []; // Social media is optional
    case 5:
      return ['favoriteStyles'];
    case 6:
      return ['isPublic'];
    default:
      return [];
  }
}

// Selector hooks for better performance
export const useUserStep = (step: number) => {
  return useUserRegistrationStore((state) => {
    const stepKey = `step${step}` as keyof CompleteUserRegistration;
    return state[stepKey];
  });
};

export const useUserCurrentStep = () => {
  return useUserRegistrationStore((state) => state.currentStep);
};

export const useUserErrors = () => {
  return useUserRegistrationStore((state) => state.errors);
};

export const useUserIsSubmitting = () => {
  return useUserRegistrationStore((state) => state.isSubmitting);
};
