import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const useLikedSongsStore = create((set, get) => ({
  likedSongs: [],
  loading: false,
  error: null,

  fetchLikedSongs: async () => {
    set({ loading: true });
    try {
      const response = await axiosInstance.get('/api/music/likes');
      set({ likedSongs: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error fetching liked songs', loading: false });
    }
  },

  toggleLike: async (songId) => {
    const { likedSongs } = get();
    const isLiked = likedSongs.some(s => s._id === songId);
    
    // Optimistic Update
    let newLikedSongs;
    if (isLiked) {
      newLikedSongs = likedSongs.filter(s => s._id !== songId);
    } else {
      // We need the full song object to add it optimistically.
      // If we don't have it, we might just have to wait for the fetch,
      // but usually we toggle from a list that has the song.
      // For now, let's just toggle existence.
      // If adding, we'll need to fetch the updated list to get the full object anyway,
      // but removing is easy to do optimistically.
      newLikedSongs = [...likedSongs, { _id: songId }]; 
    }
    
    set({ likedSongs: newLikedSongs });

    try {
      await axiosInstance.post(`/api/music/likes/${songId}`);
      // Refresh to get full song objects and confirm state
      await get().fetchLikedSongs();
    } catch (error) {
      // Revert on error
      set({ likedSongs, error: error.response?.data?.message || 'Error toggling like' });
      console.error('Like toggle failed:', error);
    }
  },

  isLiked: (songId) => {
    return get().likedSongs.some(song => song._id === songId);
  },

  reset: () => set({ likedSongs: [], loading: false, error: null })
}));

export default useLikedSongsStore;
