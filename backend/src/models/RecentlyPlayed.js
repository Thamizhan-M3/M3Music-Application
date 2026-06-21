import mongoose from 'mongoose';

const recentlyPlayedSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SongCache',
    required: true,
  },
  playedAt: {
    type: Date,
    default: Date.now,
  }
});

// Index to automatically sort by playedAt
recentlyPlayedSchema.index({ user: 1, playedAt: -1 });

const RecentlyPlayed = mongoose.model('RecentlyPlayed', recentlyPlayedSchema);
export default RecentlyPlayed;
