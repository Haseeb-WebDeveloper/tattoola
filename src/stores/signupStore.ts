import { create } from 'zustand';
import type { RegisterCredentials } from '@/types/auth';

export type SignupStatus = 'idle' | 'in_progress' | 'success' | 'error';

interface SignupState {
  status: SignupStatus;
  errorMessage?: string;
  pendingVerificationEmail?: string;
  formData?: RegisterCredentials;
  setInProgress: (email?: string, formData?: RegisterCredentials) => void;
  setFormData: (data: RegisterCredentials) => void;
  setSuccess: () => void;
  setError: (message: string) => void;
  reset: () => void;
}

export const useSignupStore = create<SignupState>((set) => ({
  status: 'idle',
  errorMessage: undefined,
  pendingVerificationEmail: undefined,
  formData: undefined,
  setInProgress: (email, formData) => set({ 
    status: 'in_progress', 
    errorMessage: undefined,
    pendingVerificationEmail: email,
    formData: formData
  }),
  setFormData: (data) => set({ formData: data }),
  setSuccess: () => set({ status: 'success', errorMessage: undefined }),
  setError: (message: string) => set({ 
    status: 'error', 
    errorMessage: message,
    pendingVerificationEmail: undefined 
  }),
  reset: () => set({ 
    status: 'idle', 
    errorMessage: undefined,
    pendingVerificationEmail: undefined,
    formData: undefined
  }),
}));


