import { create } from 'zustand';

export type SignupStatus = 'idle' | 'in_progress' | 'success' | 'error';

interface SignupState {
  status: SignupStatus;
  errorMessage?: string;
  setInProgress: () => void;
  setSuccess: () => void;
  setError: (message: string) => void;
  reset: () => void;
}

export const useSignupStore = create<SignupState>((set) => ({
  status: 'idle',
  errorMessage: undefined,
  setInProgress: () => set({ status: 'in_progress', errorMessage: undefined }),
  setSuccess: () => set({ status: 'success', errorMessage: undefined }),
  setError: (message: string) => set({ status: 'error', errorMessage: message }),
  reset: () => set({ status: 'idle', errorMessage: undefined }),
}));


