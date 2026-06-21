import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import SongCache from '../models/SongCache.js';
import { extractMetadata, generateGradientPlaceholder } from '../services/metadataService.js';
import { uploadFromBuffer } from '../services/cloudinaryService.js';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB.');

    // Drop old indexes to clear conflicting or misconfigured text index constraints
    console.log('Clearing old database indexes...');
    try {
      await SongCache.collection.dropIndexes();
      console.log('Database indexes cleared successfully.');
    } catch (dropErr) {
      console.warn('Warning: Failed to drop indexes (this is normal if no indexes exist):', dropErr.message);
    }

    const songs = await SongCache.find({});
    console.log(`Found ${songs.length} existing songs to audit/migrate.`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      console.log(`\n[${i + 1}/${songs.length}] Auditing song: "${song.title}" (ID: ${song._id})`);

      try {
        let needsUpdate = false;
        
        // 1. Initialize empty fields with default mappings if not already present
        if (!song.singer) {
          song.singer = song.artist || 'Unknown Singer';
          needsUpdate = true;
        }
        if (!song.musicDirector) {
          song.musicDirector = song.composer || 'Unknown Composer';
          needsUpdate = true;
        }
        if (!song.lyricist) {
          song.lyricist = 'Unknown Lyricist';
          needsUpdate = true;
        }
        if (!song.language || song.language === 'Unknown') {
          needsUpdate = true;
        }
        if (!song.bitrate || !song.fileSize || !song.artworkUrl) {
          needsUpdate = true;
        }

        // 2. Perform deep extraction from the remote audio file if needed
        if (needsUpdate && song.url) {
          console.log(`  -> Downloading & extracting tags from: ${song.url}`);
          const extracted = await extractMetadata(song.url, {
            mimeType: song.mimeType || 'audio/mpeg'
          });

          if (extracted) {
            song.title = song.title || extracted.title;
            song.artist = song.artist || extracted.artist;
            song.singer = song.singer && song.singer !== 'Unknown Singer' ? song.singer : extracted.singer;
            song.musicDirector = song.musicDirector && song.musicDirector !== 'Unknown Composer' ? song.musicDirector : extracted.musicDirector;
            song.lyricist = song.lyricist && song.lyricist !== 'Unknown Lyricist' ? song.lyricist : extracted.lyricist;
            song.language = song.language && song.language !== 'Unknown' ? song.language : extracted.language;
            song.album = song.album || extracted.album;
            song.year = song.year || extracted.year;
            song.duration = song.duration || extracted.duration;
            song.bitrate = song.bitrate || extracted.bitrate || 192;
            song.fileSize = song.fileSize || extracted.fileSize || 0;
            song.cloudflareKey = song.cloudflareKey || song.cloudinaryId;
            song.composer = song.musicDirector;

            // Artwork processing
            if (!song.artworkUrl || song.artworkUrl === '') {
              let artworkBuffer;
              if (extracted.artwork?.buffer) {
                console.log('  -> Extracting embedded cover artwork...');
                artworkBuffer = extracted.artwork.buffer;
              } else {
                console.log('  -> No embedded cover found. Generating premium gradient placeholder...');
                artworkBuffer = await generateGradientPlaceholder();
              }

              if (artworkBuffer) {
                const artworkFilename = `${song._id}_artwork.jpg`;
                const artworkUpload = await uploadFromBuffer(artworkBuffer, artworkFilename, 'artwork');
                song.artworkUrl = artworkUpload.url || artworkUpload.secure_url || '';
                song.thumbnailUrl = song.artworkUrl; // compatibility mapping
              }
            }

            console.log(`  -> Successfully extracted. Language: ${song.language}, Singer: ${song.singer}, Composer: ${song.musicDirector}`);
          }
        }

        // Save updated song back to MongoDB
        await song.save();
        console.log(`  -> Migrated and updated in database successfully.`);
        successCount++;
      } catch (songErr) {
        console.error(`  -> Failed migrating song "${song.title}":`, songErr.message);
        failCount++;
      }
    }

    console.log(`\n==============================================`);
    console.log(`MIGRATION COMPLETE!`);
    console.log(`Successfully migrated: ${successCount} songs`);
    console.log(`Failed migrations: ${failCount} songs`);
    console.log(`==============================================`);

  } catch (err) {
    console.error('Migration crashed with critical error:', err);
  } finally {
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
  }
}

runMigration();
