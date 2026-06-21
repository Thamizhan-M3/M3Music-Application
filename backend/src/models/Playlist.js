import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    default: '', // URL to the cover image
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SongCache',
  }],
  totalDuration: {
    type: Number,
    default: 0,
  },
  totalSongs: {
    type: Number,
    default: 0,
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  liked: {
    type: Boolean,
    default: false,
  },
  isSystemPlaylist: {
    type: String, // 'liked' | 'recent' | 'favorites' | null
    default: null,
  }
}, { timestamps: true });

// Optimize playlist lookup by owner
playlistSchema.index({ userId: 1 });

const Playlist = mongoose.model('Playlist', playlistSchema);
export default Playlist;
