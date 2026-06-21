import express from 'express';
import { 
  getPlaylists, 
  createPlaylist, 
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist, 
  removeSongFromPlaylist,
  reorderSongs,
  updatePlaylistCover
} from '../controllers/playlistController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getPlaylists)
  .post(protect, createPlaylist);

router.route('/:id')
  .get(protect, getPlaylistById)
  .put(protect, updatePlaylist)
  .delete(protect, deletePlaylist);

router.route('/:id/songs')
  .post(protect, addSongToPlaylist);

router.route('/:id/songs/:songId')
  .delete(protect, removeSongFromPlaylist);

router.route('/:id/reorder')
  .put(protect, reorderSongs);

router.route('/:id/cover')
  .put(protect, updatePlaylistCover);

export default router;
