import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RegisterCredentials } from '@/types/auth';
import { encryptJSON, decryptJSON } from '@/utils/encryption';

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

export const useSignupStore = create<SignupState>()(
  devtools(
    persist(
      (set) => ({
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
      }),
      {
        name: 'signup-store',
        storage: {
          getItem: async (name: string) => {
            try {
              const encrypted = await AsyncStorage.getItem(name);
              if (!encrypted) return null;
              
              // Decrypt the stored data
              const decrypted = await decryptJSON(encrypted);
              if (decrypted) {
                return decrypted;
              }
              
              // Fallback: if decryption fails, try parsing as plain JSON (migration)
              try {
                return JSON.parse(encrypted);
              } catch {
                return null;
              }
            } catch (error) {
              console.error('Error reading encrypted signup storage:', error);
              return null;
            }
          },
          setItem: async (name: string, value: any) => {
            try {
              // Only persist non-sensitive data or encrypt sensitive data
              const dataToStore = {
                ...value,
                // Remove password fields from persisted data for security
                // They should only exist in memory during the signup flow
                formData: value.formData ? {
                  ...value.formData,
                  password: undefined,
                  confirmPassword: undefined,
                } : undefined,
              };
              
              const encrypted = await encryptJSON(dataToStore);
              await AsyncStorage.setItem(name, encrypted);
            } catch (error) {
              console.error('Error encrypting signup storage:', error);
              // Fallback: store without encryption but without passwords
              const safeData = {
                ...value,
                formData: value.formData ? {
                  ...value.formData,
                  password: undefined,
                  confirmPassword: undefined,
                } : undefined,
              };
              await AsyncStorage.setItem(name, JSON.stringify(safeData));
            }
          },
          removeItem: async (name: string) => {
            await AsyncStorage.removeItem(name);
          },
        },
        partialize: (state) => ({
          // Only persist status and email, NOT passwords
          status: state.status,
          pendingVerificationEmail: state.pendingVerificationEmail,
          errorMessage: state.errorMessage,
          // Store formData without passwords
          formData: state.formData ? {
            username: state.formData.username,
            email: state.formData.email,
            role: state.formData.role,
            // Explicitly exclude passwords
          } : undefined,
        }),
      }
    ),
    { name: 'signup-store' }
  )
);


