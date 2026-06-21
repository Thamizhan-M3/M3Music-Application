import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SongCache',
    required: true,
  }
}, { timestamps: true });

// Ensure a user can only like a song once
likeSchema.index({ userId: 1, songId: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);
export default Like;
