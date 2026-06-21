import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One settings doc per user
  },
  theme: {
    type: String,
    default: 'dark',
  },
  volume: {
    type: Number,
    default: 1.0,
  },
  lastSyncTime: {
    type: Date,
  }
}, { timestamps: true });

const AppSettings = mongoose.model('AppSettings', appSettingsSchema);
export default AppSettings;
