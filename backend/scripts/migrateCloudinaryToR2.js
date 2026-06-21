import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import SongCache from '../src/models/SongCache.js';
import { uploadFileBuffer, uploadFromBuffer } from '../src/services/cloudinaryService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const migrate = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const songs = await SongCache.find({});
  for (const song of songs) {
    try {
      // Skip if already points to R2_PUBLIC_URL
      if (song.url && process.env.R2_PUBLIC_URL && song.url.startsWith(process.env.R2_PUBLIC_URL)) {
        console.log('Already migrated:', song._id);
        continue;
      }

      if (!song.url) {
        console.warn('No URL for song', song._id);
        continue;
      }

      // Fetch original media
      const resp = await axios.get(song.url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(resp.data);

      // Upload to R2
      const { key, url } = await uploadFileBuffer(buffer, song.title || 'song', 'audio');

      // Migrate artwork if available
      let newThumb = song.thumbnailUrl;
      if (song.thumbnailUrl) {
        try {
          const artResp = await axios.get(song.thumbnailUrl, { responseType: 'arraybuffer' });
          const artBuf = Buffer.from(artResp.data);
          const artRes = await uploadFromBuffer(artBuf, `${song._id}-thumb.jpg`, 'artwork');
          newThumb = artRes.url || artRes.secure_url || newThumb;
        } catch (e) {
          console.warn('Failed to migrate artwork for', song._id, e.message);
        }
      }

      song.cloudinaryId = key;
      song.url = url;
      song.thumbnailUrl = newThumb;
      await song.save();
      console.log('Migrated:', song._id);
    } catch (err) {
      console.error('Failed to migrate', song._id, err.message);
    }
  }

  console.log('Migration complete');
  process.exit(0);
};

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
