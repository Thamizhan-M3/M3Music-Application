import Playlist from '../models/Playlist.js';
import SongCache from '../models/SongCache.js';

// @desc    Get all playlists for logged in user
// @route   GET /api/playlists
// @access  Private
export const getPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.user._id }).sort({ pinned: -1, updatedAt: -1 });
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching playlists' });
  }
};

// @desc    Get single playlist
// @route   GET /api/playlists/:id
// @access  Private
export const getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('songs');
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching playlist' });
  }
};

// @desc    Create a playlist
// @route   POST /api/playlists
// @access  Private
export const createPlaylist = async (req, res) => {
  const { title, description } = req.body;

  try {
    const playlist = await Playlist.create({
      title: title || 'My Playlist #' + (await Playlist.countDocuments({ userId: req.user._id }) + 1),
      description: description || '',
      userId: req.user._id,
      songs: [],
      totalSongs: 0,
      totalDuration: 0
    });
    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Error creating playlist' });
  }
};

// @desc    Update a playlist
// @route   PUT /api/playlists/:id
// @access  Private
export const updatePlaylist = async (req, res) => {
  const { title, description, pinned, liked } = req.body;

  try {
    const playlist = await Playlist.findOne({ _id: req.params.id, userId: req.user._id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    if (title !== undefined) playlist.title = title;
    if (description !== undefined) playlist.description = description;
    if (pinned !== undefined) playlist.pinned = pinned;
    if (liked !== undefined) playlist.liked = liked;

    await playlist.save();
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Error updating playlist' });
  }
};

// @desc    Delete a playlist
// @route   DELETE /api/playlists/:id
// @access  Private
export const deletePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
    
    res.json({ message: 'Playlist deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting playlist' });
  }
};

// @desc    Add song to playlist
// @route   POST /api/playlists/:id/songs
// @access  Private
export const addSongToPlaylist = async (req, res) => {
  const { songId } = req.body;
  const playlistId = req.params.id;

  try {
    const playlist = await Playlist.findOne({ _id: playlistId, userId: req.user._id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    if (!playlist.songs.includes(songId)) {
      playlist.songs.push(songId);
      
      // Calculate totals
      const song = await SongCache.findById(songId);
      if (song) {
        playlist.totalDuration += song.duration || 0;
        playlist.totalSongs = playlist.songs.length;
      }
      
      await playlist.save();
    }
    
    const updated = await Playlist.findById(playlistId).populate('songs');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error adding song to playlist' });
  }
};

// @desc    Remove song from playlist
// @route   DELETE /api/playlists/:id/songs/:songId
// @access  Private
export const removeSongFromPlaylist = async (req, res) => {
  const { id: playlistId, songId } = req.params;

  try {
    const playlist = await Playlist.findOne({ _id: playlistId, userId: req.user._id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    const songIndex = playlist.songs.indexOf(songId);
    if (songIndex > -1) {
      const song = await SongCache.findById(songId);
      if (song) {
        playlist.totalDuration = Math.max(0, playlist.totalDuration - (song.duration || 0));
      }
      playlist.songs.splice(songIndex, 1);
      playlist.totalSongs = playlist.songs.length;
      await playlist.save();
    }

    const updated = await Playlist.findById(playlistId).populate('songs');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error removing song from playlist' });
  }
};

// @desc    Reorder songs in playlist
// @route   PUT /api/playlists/:id/reorder
// @access  Private
export const reorderSongs = async (req, res) => {
  const { startIndex, endIndex } = req.body;
  const playlistId = req.params.id;

  try {
    const playlist = await Playlist.findOne({ _id: playlistId, userId: req.user._id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    const [removed] = playlist.songs.splice(startIndex, 1);
    playlist.songs.splice(endIndex, 0, removed);

    await playlist.save();
    const updated = await Playlist.findById(playlistId).populate('songs');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error reordering songs' });
  }
};

// @desc    Update playlist cover
// @route   PUT /api/playlists/:id/cover
// @access  Private
export const updatePlaylistCover = async (req, res) => {
  const { coverImage } = req.body;
  const playlistId = req.params.id;

  try {
    const playlist = await Playlist.findOne({ _id: playlistId, userId: req.user._id });
    if (!playlist) return res.status(404).json({ message: 'Playlist not found' });

    playlist.coverImage = coverImage;
    await playlist.save();
    
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: 'Error updating playlist cover' });
  }
};
