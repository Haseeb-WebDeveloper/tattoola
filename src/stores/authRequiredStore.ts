import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AuthRequiredStore {
  isVisible: boolean;
  message: string;
  isDismissible: boolean;
  show: (message: string, isDismissible?: boolean) => void;
  hide: () => void;
}

export const useAuthRequiredStore = create<AuthRequiredStore>()(
  devtools(
    (set) => ({
      isVisible: false,
      message: '',
      isDismissible: true,
      
      show: (message: string, isDismissible = true) => {
        set({ isVisible: true, message, isDismissible });
      },
      
      hide: () => {
        set({ isVisible: false, message: '', isDismissible: true });
      },
    }),
    { name: 'AuthRequiredStore' }
  )
);
