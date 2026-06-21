import mongoose from 'mongoose';

const songCacheSchema = new mongoose.Schema({
  cloudinaryId: {
    type: String,
    required: true,
    unique: true,
  },
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
  },
  singer: {
    type: String,
  },
  musicDirector: {
    type: String,
  },
  lyricist: {
    type: String,
  },
  genre: {
    type: String,
  },
  language: {
    type: String,
    default: 'Unknown',
  },
  album: {
    type: String,
  },
  year: {
    type: Number,
  },
  duration: {
    type: Number, // in seconds
    default: 0,
  },
  bitrate: {
    type: Number, // in bps or kbps
  },
  fileSize: {
    type: Number, // in bytes
  },
  mimeType: {
    type: String,
  },
  artworkUrl: {
    type: String, // Public URL (R2/CDN) of cover artwork
  },
  cloudflareKey: {
    type: String, // Storage key inside R2 bucket
  },
  composer: {
    type: String,
  },
  trackNumber: {
    type: Number,
  },
  thumbnailUrl: {
    type: String, // Public URL (R2/CDN) of cover artwork (backward-compat alias)
  },
  folder: {
    type: String, // Storage folder containing this song
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // YouTube Import fields
  sourceType: {
    type: String,
    enum: ['upload', 'youtube'],
    default: 'upload',
  },
  youtubeUrl: {
    type: String,
  },
  youtubeVideoId: {
    type: String,
  },
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  importedAt: {
    type: Date,
  },
  songHash: {
    type: String,
  }
}, { timestamps: true });

// Define regular indexes for exact filtering and sorting
songCacheSchema.index({ artist: 1 });
songCacheSchema.index({ singer: 1 });
songCacheSchema.index({ musicDirector: 1 });
songCacheSchema.index({ album: 1 });
songCacheSchema.index({ genre: 1 });
songCacheSchema.index({ language: 1 });
songCacheSchema.index({ title: 1 });
songCacheSchema.index({ year: -1 });
songCacheSchema.index({ youtubeVideoId: 1 });
songCacheSchema.index({ songHash: 1 });

// Define compound text index for premium Spotify-style searching across all fields
songCacheSchema.index(
  {
    title: 'text',
    artist: 'text',
    singer: 'text',
    musicDirector: 'text',
    lyricist: 'text',
    album: 'text',
    genre: 'text',
    language: 'text'
  },
  {
    name: 'SongTextSearchIndex',
    language_override: 'none' // Crucial: prevents MongoDB from using the "language" field as a validation rule for stemming
  }
);

const SongCache = mongoose.model('SongCache', songCacheSchema);
export default SongCache;
