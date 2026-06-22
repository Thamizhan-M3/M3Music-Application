import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import usePlaylistStore from './playlistStore';
import useLikedSongsStore from './likedSongsStore';
import usePlayerStore from './playerStore';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (userData, token) => {
        set({ user: userData, token });
      },
      logout: () => {
        set({ user: null, token: null });
        usePlaylistStore.getState().reset();
        useLikedSongsStore.getState().reset();
        usePlayerStore.getState().reset?.();
        localStorage.removeItem('m3-auth-storage');
      },
      isAdmin: () => {
        return get().user?.role === 'admin';
      }
    }),
    {
      name: 'm3-auth-storage',
    }
  )
);

export default useAuthStore;
