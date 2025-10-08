// Export all stores from a single location for easier imports
export {
  useArtistCurrentStep,
  useArtistErrors,
  useArtistIsSubmitting, useArtistRegistrationStore,
  useArtistStep
} from '../../old/artistRegistrationStore';

export {
  useUserCurrentStep,
  useUserErrors,
  useUserIsSubmitting, useUserRegistrationStore,
  useUserStep
} from '../../old/userRegistrationStore';

// Re-export types for convenience
export type { CompleteArtistRegistration, CompleteUserRegistration } from '@/types/auth';

