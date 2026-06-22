import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const usePlaylistStore = create((set, get) => ({
  playlists: [],
  currentPlaylist: null,
  loading: false,
  error: null,

  fetchPlaylists: async () => {
    set({ loading: true });
    try {
      const response = await axiosInstance.get('/api/playlists');
      set({ playlists: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error fetching playlists', loading: false });
    }
  },

  fetchPlaylistById: async (id) => {
    set({ loading: true });
    try {
      const response = await axiosInstance.get(`/api/playlists/${id}`);
      set({ currentPlaylist: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error fetching playlist', loading: false });
    }
  },

  createPlaylist: async (data) => {
    try {
      const response = await axiosInstance.post('/api/playlists', data);
      set((state) => ({ playlists: [response.data, ...state.playlists] }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error creating playlist' });
    }
  },

  updatePlaylist: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/api/playlists/${id}`, data);
      set((state) => ({
        playlists: state.playlists.map((p) => (p._id === id ? response.data : p)),
        currentPlaylist: state.currentPlaylist?._id === id ? response.data : state.currentPlaylist
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error updating playlist' });
    }
  },

  deletePlaylist: async (id) => {
    try {
      await axiosInstance.delete(`/api/playlists/${id}`);
      set((state) => ({
        playlists: state.playlists.filter((p) => p._id !== id),
        currentPlaylist: state.currentPlaylist?._id === id ? null : state.currentPlaylist
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error deleting playlist' });
    }
  },

  addSongToPlaylist: async (playlistId, songId) => {
    try {
      const response = await axiosInstance.post(`/api/playlists/${playlistId}/songs`, { songId });
      set((state) => ({
        playlists: state.playlists.map((p) => (p._id === playlistId ? response.data : p)),
        currentPlaylist: state.currentPlaylist?._id === playlistId ? response.data : state.currentPlaylist
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error adding song' });
    }
  },

  removeSongFromPlaylist: async (playlistId, songId) => {
    try {
      const response = await axiosInstance.delete(`/api/playlists/${playlistId}/songs/${songId}`);
      set((state) => ({
        playlists: state.playlists.map((p) => (p._id === playlistId ? response.data : p)),
        currentPlaylist: state.currentPlaylist?._id === playlistId ? response.data : state.currentPlaylist
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error removing song' });
    }
  },

  reorderSongs: async (playlistId, startIndex, endIndex) => {
    try {
      const response = await axiosInstance.put(`/api/playlists/${playlistId}/reorder`, { startIndex, endIndex });
      set((state) => ({
        currentPlaylist: response.data
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error reordering songs' });
    }
  },

  updateCover: async (playlistId, coverImage) => {
    try {
      const response = await axiosInstance.put(`/api/playlists/${playlistId}/cover`, { coverImage });
      set((state) => ({
        playlists: state.playlists.map((p) => (p._id === playlistId ? response.data : p)),
        currentPlaylist: state.currentPlaylist?._id === playlistId ? response.data : state.currentPlaylist
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Error updating cover' });
    }
  },

  reset: () => set({ playlists: [], currentPlaylist: null, loading: false, error: null })
}));

export default usePlaylistStore;
