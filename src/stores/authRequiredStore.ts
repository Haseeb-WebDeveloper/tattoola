import { router } from "expo-router";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

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
      message: "",
      isDismissible: true,


      // Instead of showing a blocking modal, immediately redirect
      // anonymous users to the Sign In screen when auth is required.
      show: (message: string, isDismissible = true) => {
        set({ isVisible: false, message, isDismissible });
        // Get current path for redirect
        const currentPath = window.location.pathname + window.location.search;
        // Use push instead of replace so back goes to previous page
        router.push(`/(auth)/login?redirect=${encodeURIComponent(currentPath)}`);
      },

      hide: () => {
        set({ isVisible: false, message: "", isDismissible: true });
      },
    }),
    { name: "AuthRequiredStore" }
  )
);
