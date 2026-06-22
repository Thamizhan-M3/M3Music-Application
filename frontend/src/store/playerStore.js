import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const usePlayerStore = create(
  persist(
    (set, get) => ({
      currentSong: null,
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      volume: 1,
      isMuted: false,
      shuffle: false,
      repeat: 'off', // 'off', 'all', 'one'

      setCurrentSong: (song) => set({ currentSong: song, isPlaying: true }),
      setQueue: (songs, startIndex = 0) => set({ 
        queue: songs, 
        currentIndex: startIndex, 
        currentSong: songs[startIndex],
        isPlaying: true 
      }),
      addToQueue: (song) => set((state) => ({ queue: [...state.queue, song] })),
      
      playPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      playPlaylist: (songs, startIndex = 0) => set({ 
        queue: songs, 
        currentIndex: startIndex, 
        currentSong: songs[startIndex],
        isPlaying: true 
      }),
      
      nextTrack: () => {
        const { queue, currentIndex, shuffle, repeat } = get();
        if (queue.length === 0) return;

        if (repeat === 'one') {
          // Keep current index, just re-trigger play (handled in component)
          set({ isPlaying: true });
          return;
        }

        let nextIndex;
        if (shuffle) {
          nextIndex = Math.floor(Math.random() * queue.length);
        } else {
          nextIndex = currentIndex + 1;
        }

        if (nextIndex >= queue.length) {
          if (repeat === 'all') {
            nextIndex = 0;
          } else {
            set({ isPlaying: false });
            return;
          }
        }

        set({ currentIndex: nextIndex, currentSong: queue[nextIndex], isPlaying: true });
      },

      prevTrack: () => {
        const { queue, currentIndex } = get();
        if (queue.length === 0) return;

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = 0;

        set({ currentIndex: prevIndex, currentSong: queue[prevIndex], isPlaying: true });
      },

      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      toggleRepeat: () => set((state) => {
        const states = ['off', 'all', 'one'];
        const nextState = states[(states.indexOf(state.repeat) + 1) % states.length];
        return { repeat: nextState };
      }),
      reset: () => set({ currentSong: null, queue: [], currentIndex: -1, isPlaying: false })
    }),
    {
      name: 'm3-player-storage',
      // We don't persist playing state so it doesn't auto-play on load unexpectedly
      partialize: (state) => ({ 
        volume: state.volume, 
        shuffle: state.shuffle, 
        repeat: state.repeat,
        currentSong: state.currentSong,
        queue: state.queue,
        currentIndex: state.currentIndex
      }),
    }
  )
);

export default usePlayerStore;
