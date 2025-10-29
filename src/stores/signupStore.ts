import { create } from 'zustand';

export type SignupStatus = 'idle' | 'in_progress' | 'success' | 'error';

interface SignupState {
  status: SignupStatus;
  errorMessage?: string;
  pendingVerificationEmail?: string;
  setInProgress: (email?: string) => void;
  setSuccess: () => void;
  setError: (message: string) => void;
  reset: () => void;
}

export const useSignupStore = create<SignupState>((set) => ({
  status: 'idle',
  errorMessage: undefined,
  pendingVerificationEmail: undefined,
  setInProgress: (email) => set({ 
    status: 'in_progress', 
    errorMessage: undefined,
    pendingVerificationEmail: email 
  }),
  setSuccess: () => set({ status: 'success', errorMessage: undefined }),
  setError: (message: string) => set({ 
    status: 'error', 
    errorMessage: message,
    pendingVerificationEmail: undefined 
  }),
  reset: () => set({ 
    status: 'idle', 
    errorMessage: undefined,
    pendingVerificationEmail: undefined 
  }),
}));


