import { create } from 'zustand';

interface TabBarStore {
  tabBarHeight: number;
  setTabBarHeight: (height: number) => void;
}

export const useTabBarStore = create<TabBarStore>((set) => ({
  tabBarHeight: 0,
  setTabBarHeight: (height: number) => set({ tabBarHeight: height }),
}));


