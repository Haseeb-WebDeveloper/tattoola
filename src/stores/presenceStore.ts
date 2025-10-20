import { create } from 'zustand';

type PresenceState = {
  onlineUserIds: Record<string, boolean>;
  setOnlineUsers: (users: Record<string, boolean>) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUserIds: {},
  setOnlineUsers: (users) => set({ onlineUserIds: users }),
  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUserIds: { ...state.onlineUserIds, [userId]: true },
    })),
  removeOnlineUser: (userId) =>
    set((state) => {
      const newOnlineUserIds = { ...state.onlineUserIds };
      delete newOnlineUserIds[userId];
      return { onlineUserIds: newOnlineUserIds };
    }),
}));

