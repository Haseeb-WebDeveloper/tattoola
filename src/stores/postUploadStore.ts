import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type UploadMediaItem = {
  uri: string;
  type: 'image' | 'video';
  cloud?: string; // Cloudinary URL once uploaded
};

interface PostUploadState {
  media: UploadMediaItem[];
  caption?: string;
  styleId?: string;
  collectionId?: string;
  redirectToCollectionId?: string; // Collection ID to redirect to after post creation

  // UI helpers
  isSubmitting: boolean;

  // Actions
  addMedia: (items: UploadMediaItem[]) => void;
  setMedia: (items: UploadMediaItem[]) => void;
  removeMediaAt: (index: number) => void;
  setCaption: (text?: string) => void;
  setStyleId: (id?: string) => void;
  setCollectionId: (id?: string) => void;
  setRedirectToCollectionId: (id?: string) => void;
  setSubmitting: (v: boolean) => void;
  reset: () => void;
}

const initialState: Pick<PostUploadState, 'media' | 'caption' | 'styleId' | 'collectionId' | 'redirectToCollectionId' | 'isSubmitting'> = {
  media: [],
  caption: undefined,
  styleId: undefined,
  collectionId: undefined,
  redirectToCollectionId: undefined,
  isSubmitting: false,
};

export const usePostUploadStore = create<PostUploadState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        addMedia: (items) =>
          set((s) => ({
            media: [...s.media, ...items].slice(0, 5),
          })),
        setMedia: (items) => set({ media: items.slice(0, 5) }),
        removeMediaAt: (index) =>
          set((s) => ({ media: s.media.filter((_, i) => i !== index) })),
        setCaption: (text) => set({ caption: text }),
        setStyleId: (id) => set({ styleId: id }),
        setCollectionId: (id) => set({ collectionId: id }),
        setRedirectToCollectionId: (id) => set({ redirectToCollectionId: id }),
        setSubmitting: (v) => set({ isSubmitting: v }),
        reset: () => set(initialState),
      }),
      {
        name: 'post-upload-store',
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
          media: state.media, 
          caption: state.caption, 
          styleId: state.styleId, 
          collectionId: state.collectionId,
          redirectToCollectionId: state.redirectToCollectionId,
        }),
      }
    ),
    { name: 'post-upload-store' }
  )
);

export function canProceedFromMedia(state: PostUploadState): boolean {
  if (!state.media || state.media.length === 0) return false;
  const videoCount = state.media.filter((m) => m.type === 'video').length;
  return state.media.length <= 5 && videoCount <= 2;
}


