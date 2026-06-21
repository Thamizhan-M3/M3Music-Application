import { 
  syncCloudinary, getSongs, searchSongs, uploadMusic, updateSong, deleteSong, 
  getLikedSongs, toggleLikeSong, getArtists, getAlbums, getGenres, 
  filterSongs, getSongsByArtist, getSongsByAlbum, getSongsByGenre,
  uploadArtwork
} from '../controllers/musicController.js';
import { streamSong } from '../controllers/musicController.js';
import { 
  inspectYoutubeVideo, startYoutubeImport, getImportJobs, 
  getImportJobDetails, cancelImportJob, clearJobHistory 
} from '../controllers/youtubeImportController.js';
import { protect, admin } from '../middlewares/auth.js';
import { upload } from '../services/cloudinaryService.js';
import express from 'express';

const router = express.Router();

// YouTube Import routes
router.route('/youtube/inspect').post(protect, admin, inspectYoutubeVideo);
router.route('/youtube/import').post(protect, admin, startYoutubeImport);
router.route('/youtube/jobs').get(protect, admin, getImportJobs);
router.route('/youtube/jobs').delete(protect, admin, clearJobHistory);
router.route('/youtube/jobs/:id').get(protect, admin, getImportJobDetails);
router.route('/youtube/jobs/:id/cancel').post(protect, admin, cancelImportJob);

router.route('/sync').post(protect, admin, syncCloudinary);
router.route('/songs').get(protect, getSongs);
router.route('/songs/:id')
  .put(protect, admin, updateSong)
  .delete(protect, admin, deleteSong);
router.route('/search').get(protect, searchSongs);
router.route('/upload').post(protect, admin, upload.array('files', 50), uploadMusic);
router.route('/upload-artwork').post(protect, admin, upload.single('artwork'), uploadArtwork);
router.route('/stream/:id').get(protect, streamSong);
router.route('/likes').get(protect, getLikedSongs);
router.route('/likes/:id').post(protect, toggleLikeSong);

// Discovery & Filtering
router.get('/artists', protect, getArtists);
router.get('/albums', protect, getAlbums);
router.get('/genres', protect, getGenres);
router.get('/filter', protect, filterSongs);
router.get('/by-artist/:artist', protect, getSongsByArtist);
router.get('/by-album/:album', protect, getSongsByAlbum);
router.get('/by-genre/:genre', protect, getSongsByGenre);

export default router;
