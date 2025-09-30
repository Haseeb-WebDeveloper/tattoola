import React, { createContext, ReactNode, useContext, useState } from 'react';
import type {
    CompleteArtistRegistration,
    CompleteUserRegistration
} from '../types/auth';

interface RegistrationContextType {
  // User registration data
  userRegistration: Partial<CompleteUserRegistration>;
  updateUserStep: <T extends keyof CompleteUserRegistration>(step: T, data: CompleteUserRegistration[T]) => void;
  clearUserRegistration: () => void;
  
  // Artist registration data
  artistRegistration: Partial<CompleteArtistRegistration>;
  updateArtistStep: <T extends keyof CompleteArtistRegistration>(step: T, data: CompleteArtistRegistration[T]) => void;
  clearArtistRegistration: () => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

interface RegistrationProviderProps {
  children: ReactNode;
}

export function RegistrationProvider({ children }: RegistrationProviderProps) {
  const [userRegistration, setUserRegistration] = useState<Partial<CompleteUserRegistration>>({});
  const [artistRegistration, setArtistRegistration] = useState<Partial<CompleteArtistRegistration>>({});

  const updateUserStep = <T extends keyof CompleteUserRegistration>(
    step: T, 
    data: CompleteUserRegistration[T]
  ) => {
    setUserRegistration(prev => ({
      ...prev,
      [step]: data,
    }));
  };

  const clearUserRegistration = () => {
    setUserRegistration({});
  };

  const updateArtistStep = <T extends keyof CompleteArtistRegistration>(
    step: T, 
    data: CompleteArtistRegistration[T]
  ) => {
    setArtistRegistration(prev => ({
      ...prev,
      [step]: data,
    }));
  };

  const clearArtistRegistration = () => {
    setArtistRegistration({});
  };

  const value: RegistrationContextType = {
    userRegistration,
    updateUserStep,
    clearUserRegistration,
    artistRegistration,
    updateArtistStep,
    clearArtistRegistration,
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration(): RegistrationContextType {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}

// Helper hooks for specific registration types
export function useUserRegistration() {
  const { userRegistration, updateUserStep, clearUserRegistration } = useRegistration();
  return { userRegistration, updateUserStep, clearUserRegistration };
}

export function useArtistRegistration() {
  const { artistRegistration, updateArtistStep, clearArtistRegistration } = useRegistration();
  return { artistRegistration, updateArtistStep, clearArtistRegistration };
}
