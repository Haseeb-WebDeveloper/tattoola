import { create } from "zustand";

interface UploadPermissionState {
  // Artist Registration
  artistProfilePictureUploaded: boolean;
  artistCertificateUploaded: boolean;
  artistHasGalleryPermission: boolean;
  artistHasFilePermission: boolean;

  // User Registration
  userProfilePictureUploaded: boolean;
  userHasGalleryPermission: boolean;

  // Post Upload (after login)
  postMediaUploaded: boolean;
  postHasMediaPermission: boolean;

  // Setters for artist registration
  setArtistProfilePictureUploaded: (uploaded: boolean) => void;
  setArtistCertificateUploaded: (uploaded: boolean) => void;
  setArtistHasGalleryPermission: (granted: boolean) => void;
  setArtistHasFilePermission: (granted: boolean) => void;

  // Setters for user registration
  setUserProfilePictureUploaded: (uploaded: boolean) => void;
  setUserHasGalleryPermission: (granted: boolean) => void;

  // Setters for post upload
  setPostMediaUploaded: (uploaded: boolean) => void;
  setPostHasMediaPermission: (granted: boolean) => void;

  // Reset functions
  resetArtistRegistration: () => void;
  resetUserRegistration: () => void;
  resetPostUpload: () => void;
  resetAll: () => void;

  // Validation functions
  canProceedArtistRegistration: () => boolean;
  canProceedUserRegistration: () => boolean;
  canProceedPostUpload: () => boolean;
}

export const useUploadPermissionStore = create<UploadPermissionState>(
  (set, get) => ({
    // Initial state - Artist Registration
    artistProfilePictureUploaded: false,
    artistCertificateUploaded: false,
    artistHasGalleryPermission: false,
    artistHasFilePermission: false,

    // Initial state - User Registration
    userProfilePictureUploaded: false,
    userHasGalleryPermission: false,

    // Initial state - Post Upload
    postMediaUploaded: false,
    postHasMediaPermission: false,

    // Artist Registration Setters
    setArtistProfilePictureUploaded: (uploaded) => {
      set({ artistProfilePictureUploaded: uploaded });
      if (uploaded) {
        set({ artistHasGalleryPermission: true });
      }
    },

    setArtistCertificateUploaded: (uploaded) => {
      set({ artistCertificateUploaded: uploaded });
      if (uploaded) {
        set({ artistHasFilePermission: true });
      }
    },

    setArtistHasGalleryPermission: (granted) => {
      set({ artistHasGalleryPermission: granted });
    },

    setArtistHasFilePermission: (granted) => {
      set({ artistHasFilePermission: granted });
    },

    // User Registration Setters
    setUserProfilePictureUploaded: (uploaded) => {
      set({ userProfilePictureUploaded: uploaded });
      if (uploaded) {
        set({ userHasGalleryPermission: true });
      }
    },

    setUserHasGalleryPermission: (granted) => {
      set({ userHasGalleryPermission: granted });
    },

    // Post Upload Setters
    setPostMediaUploaded: (uploaded) => {
      set({ postMediaUploaded: uploaded });
      if (uploaded) {
        set({ postHasMediaPermission: true });
      }
    },

    setPostHasMediaPermission: (granted) => {
      set({ postHasMediaPermission: granted });
    },

    // Reset functions
    resetArtistRegistration: () =>
      set({
        artistProfilePictureUploaded: false,
        artistCertificateUploaded: false,
        artistHasGalleryPermission: false,
        artistHasFilePermission: false,
      }),

    resetUserRegistration: () =>
      set({
        userProfilePictureUploaded: false,
        userHasGalleryPermission: false,
      }),

    resetPostUpload: () =>
      set({
        postMediaUploaded: false,
        postHasMediaPermission: false,
      }),

    resetAll: () =>
      set({
        artistProfilePictureUploaded: false,
        artistCertificateUploaded: false,
        artistHasGalleryPermission: false,
        artistHasFilePermission: false,
        userProfilePictureUploaded: false,
        userHasGalleryPermission: false,
        postMediaUploaded: false,
        postHasMediaPermission: false,
      }),

    // Validation functions
    canProceedArtistRegistration: () => {
      const state = get();
      // Artist can proceed if both profile picture and certificate are uploaded
      // and necessary permissions are granted
      return (
        state.artistProfilePictureUploaded &&
        state.artistCertificateUploaded &&
        state.artistHasGalleryPermission &&
        state.artistHasFilePermission
      );
    },

    canProceedUserRegistration: () => {
      const state = get();
      // User can proceed if profile picture is uploaded and permission granted
      return state.userProfilePictureUploaded && state.userHasGalleryPermission;
    },

    canProceedPostUpload: () => {
      const state = get();
      // Can proceed with post if media is uploaded and permission granted
      return state.postMediaUploaded && state.postHasMediaPermission;
    },
  })
);
