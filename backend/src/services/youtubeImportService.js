import youtubedl from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import SongCache from '../models/SongCache.js';
import { uploadFileBuffer, uploadFromBuffer } from './cloudinaryService.js';

// Setup Ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Extract YouTube video ID from a URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null
 */
export const getYoutubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Fetch video metadata from YouTube URL
 * @param {string} url - YouTube URL
 * @returns {Promise<object>} - Extracted metadata
 */

export const fetchYoutubeMetadata = async (url) => {
  const videoId = getYoutubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL format');
  }

  console.log(`[YouTube Service] Fetching metadata for video ID: ${videoId}`);

  const commandOptions = {
    dumpSingleJson: true,
    noWarnings: true,
    // noCallHome: true,
    noCheckCertificates: true,
    preferFreeFormats: true,
    // youtubeSkipDashManifest: true,

    // ✅ CRITICAL FIXES
    addHeader: [
      'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept-Language: en-US,en;q=0.9',
      'Referer: https://www.youtube.com/'
    ],

    // ✅ Avoid 429
    sleepInterval: 2,
    maxSleepInterval: 5,

    // ✅ JS runtime (fix signature issues)
    jsRuntimes: 'node'
  };

  let info;

  try {
    console.log('Before yt-dlp');

    info = await youtubedl(url, commandOptions);

    console.log('After yt-dlp');
  } catch (err) {
    console.warn('[YouTube Service] First attempt failed, retrying...');

    try {
      // ✅ retry once (important)
      info = await youtubedl(url, {
        ...commandOptions,
        sleepInterval: 3
      });
    } catch (retryErr) {
      console.error('[YouTube Service] Retry failed:', retryErr);
      throw new Error(`Failed to extract metadata: ${retryErr.message}`);
    }
  }

  if (!info) {
    throw new Error('Failed to retrieve video info');
  }

  // ✅ Thumbnail selection
  let thumbnailUrl = '';
  if (info.thumbnails && info.thumbnails.length > 0) {
    const sortedThumbnails = [...info.thumbnails].sort(
      (a, b) => (b.width || 0) - (a.width || 0)
    );
    thumbnailUrl = sortedThumbnails[0].url;
  } else {
    thumbnailUrl =
      info.thumbnail ||
      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  // ✅ Duration
  const duration = info.duration || 0;

  // ✅ Language detection
  const { detectLanguage } = await import('./metadataService.js');
  const language = detectLanguage(null, info.title || '');

  // ✅ Year parsing
  let year = info.release_year || null;

  if (!year && info.upload_date) {
    year = parseInt(info.upload_date.substring(0, 4));
  }

  if (!year && info.title) {
    const match = info.title.match(/\b(19\d\d|20\d\d)\b/);
    if (match) {
      year = parseInt(match[0]);
    }
  }

  if (!year) {
    year = new Date().getFullYear();
  }

  // ✅ FINAL RETURN
  return {
    youtubeVideoId: videoId,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    title: info.title || 'Unknown Title',
    artist: info.uploader || info.artist || 'Unknown Artist',
    singer: info.uploader || info.artist || 'Unknown Artist',
    musicDirector: info.composer || 'Unknown Composer',
    lyricist: 'Unknown Lyricist',
    language,
    album: info.album || 'YouTube Import',
    genre: info.genre || 'Pop',
    year,
    duration: Math.round(duration),
    uploadDate: info.upload_date || '',
    description: info.description || '',
    thumbnailUrl
  };
};

// export const fetchYoutubeMetadata = async (url) => {
//   const videoId = getYoutubeVideoId(url);
//   if (!videoId) {
//     throw new Error('Invalid YouTube URL format');
//   }

//   try {
//     console.log(`[YouTube Service] Fetching metadata for video ID: ${videoId}`);

//     const info = await youtubedl(url, {
//       dumpSingleJson: true,
//       noWarnings: true,
//       noCallHome: true,
//       noCheckCertificates: true,
//       preferFreeFormats: true,
//       youtubeSkipDashManifest: true,
//       referer: 'https://www.youtube.com/'
//     });

//     // Check for age restriction, privacy, etc.
//     if (info.age_limit && info.age_limit > 0) {
//       console.warn(`[YouTube Service] Warning: Video ID ${videoId} has an age limit of ${info.age_limit}`);
//     }

//     // Get the best thumbnail
//     let thumbnailUrl = '';
//     if (info.thumbnails && info.thumbnails.length > 0) {
//       // Find thumbnail with highest width or default to the last one
//       const sortedThumbnails = [...info.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
//       thumbnailUrl = sortedThumbnails[0].url;
//     } else {
//       thumbnailUrl = info.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
//     }

//     // Parse duration (seconds)
//     const duration = info.duration || 0;

//     // Detect language using title heuristics
//     const { detectLanguage } = await import('./metadataService.js');
//     const language = detectLanguage(null, info.title || '');

//     // Parse year heuristics
//     let year = info.release_year || null;
//     if (!year && info.upload_date) {
//       year = parseInt(info.upload_date.substring(0, 4));
//     }
//     if (!year && info.title) {
//       const yearMatch = info.title.match(/\b(19\d\d|20\d\d)\b/);
//       if (yearMatch) {
//         year = parseInt(yearMatch[0]);
//       }
//     }
//     if (!year) {
//       year = new Date().getFullYear();
//     }

//     // Build metadata response
//     return {
//       youtubeVideoId: videoId,
//       youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
//       title: info.title || 'Unknown Title',
//       artist: info.uploader || info.artist || 'Unknown Artist',
//       singer: info.uploader || info.artist || 'Unknown Artist',
//       musicDirector: info.composer || 'Unknown Composer',
//       lyricist: 'Unknown Lyricist',
//       language: language,
//       album: info.album || 'YouTube Import',
//       genre: info.genre || 'Pop',
//       year: year,
//       duration: Math.round(duration),
//       uploadDate: info.upload_date || '',
//       description: info.description || '',
//       thumbnailUrl: thumbnailUrl
//     };
//   } catch (error) {
//     console.error('[YouTube Service] Error fetching metadata:', error);
//     throw new Error(`Failed to extract metadata: ${error.message}`);
//   }
// };

/**
 * Download, transcode, upload, and save a YouTube video as a song
 * @param {object} job - Queue job object
 * @param {function} updateProgress - Callback to update job progress and status
 */
export const processYoutubeImport = async (job, updateProgress) => {
  const { youtubeUrl, videoId, customMetadata, userId } = job;

  // Ensure temp folder exists
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const rawAudioPath = path.join(tempDir, `raw_${videoId}_${Date.now()}`);
  const outMp3Path = path.join(tempDir, `out_${videoId}_${Date.now()}.mp3`);

  try {
    // 1. DUPLICATE CHECK: videoId check
    updateProgress('checking_duplicates', 5);
    const dupById = await SongCache.findOne({ youtubeVideoId: videoId });
    if (dupById) {
      throw new Error(`Duplicate import: This video has already been imported as "${dupById.title}"`);
    }

    // 2. DOWNLOAD STREAM
    updateProgress('downloading', 15);
    console.log(`[YouTube Service] Downloading audio stream for video: ${videoId}`);

    await youtubedl(youtubeUrl, {
      format: 'bestaudio',
      output: rawAudioPath,
      noCheckCertificates: true,
      noWarnings: true
    });

    if (!fs.existsSync(rawAudioPath)) {
      throw new Error('Downloaded audio stream file not found');
    }

    const rawStats = fs.statSync(rawAudioPath);
    console.log(`[YouTube Service] Download complete. Raw size: ${(rawStats.size / (1024 * 1024)).toFixed(2)} MB`);

    // 3. CONVERT TO MP3 (192kbps, Stereo, Normalized Volume)
    updateProgress('converting', 40);
    console.log(`[YouTube Service] Converting to MP3: ${outMp3Path}`);

    await new Promise((resolve, reject) => {
      ffmpeg(rawAudioPath)
        .toFormat('mp3')
        .audioCodec('libmp3lame')
        .audioBitrate(192)
        .audioChannels(2)
        .audioFilters('loudnorm') // Loudness normalization (EBU R128)
        .on('progress', (progress) => {
          if (progress.percent) {
            // Keep conversion progress within 40-70% range
            const currentProgress = Math.min(Math.round(40 + (progress.percent * 0.3)), 70);
            updateProgress('converting', currentProgress);
          }
        })
        .on('error', (err) => {
          console.error('[YouTube Service] FFmpeg error:', err);
          reject(new Error(`Transcoding failed: ${err.message}`));
        })
        .on('end', () => {
          console.log('[YouTube Service] Conversion finished!');
          resolve();
        })
        .save(outMp3Path);
    });

    if (!fs.existsSync(outMp3Path)) {
      throw new Error('Converted MP3 output file not found');
    }

    // 4. DUPLICATE CHECK: song hash
    updateProgress('uploading', 75);
    const fileBuffer = fs.readFileSync(outMp3Path);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const songHash = hashSum.digest('hex');

    const dupByHash = await SongCache.findOne({ songHash });
    if (dupByHash) {
      throw new Error(`Duplicate import: A song with identical audio hash already exists ("${dupByHash.title}")`);
    }

    // 5. UPLOAD AUDIO TO CLOUDFLARE R2
    console.log('[YouTube Service] Uploading MP3 to Cloudflare R2...');
    const audioFilename = `${customMetadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${videoId}.mp3`;
    const audioUpload = await uploadFileBuffer(fileBuffer, audioFilename, 'audio');

    // 6. UPLOAD THUMBNAIL TO CLOUDFLARE R2 (Extract, clean, and optimize using sharp)
    let thumbnailUrl = customMetadata.thumbnailUrl || '';
    let artworkUrl = '';

    if (thumbnailUrl && thumbnailUrl.startsWith('http')) {
      try {
        console.log(`[YouTube Service] Downloading and optimizing artwork: ${thumbnailUrl}`);
        const artworkResponse = await axios.get(thumbnailUrl, { responseType: 'arraybuffer', timeout: 10000 });
        const artworkRawBuffer = Buffer.from(artworkResponse.data);

        // Optimize using Sharp
        const sharp = (await import('sharp')).default;
        const artworkBuffer = await sharp(artworkRawBuffer)
          .resize(1000, 1000, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        console.log('[YouTube Service] Uploading optimized artwork to R2...');
        const artworkFilename = `${videoId}_artwork.jpg`;
        const artworkUpload = await uploadFromBuffer(artworkBuffer, artworkFilename, 'artwork');
        artworkUrl = artworkUpload.url || artworkUpload.secure_url || thumbnailUrl;
        thumbnailUrl = artworkUrl;
      } catch (artworkErr) {
        console.error('[YouTube Service] Failed to process/upload artwork. Using original URL.', artworkErr);
        artworkUrl = thumbnailUrl;
      }
    } else {
      // Generate fallback gradient placeholder
      try {
        const { generateGradientPlaceholder } = await import('./metadataService.js');
        const artworkBuffer = await generateGradientPlaceholder();
        const artworkFilename = `${videoId}_artwork.jpg`;
        const artworkUpload = await uploadFromBuffer(artworkBuffer, artworkFilename, 'artwork');
        artworkUrl = artworkUpload.url || artworkUpload.secure_url || '';
        thumbnailUrl = artworkUrl;
      } catch (gradErr) {
        console.error('[YouTube Service] Gradient placeholder generation failed:', gradErr);
      }
    }

    // 7. SAVE TO MONGODB
    updateProgress('saving', 95);
    console.log('[YouTube Service] Saving song metadata to MongoDB...');

    const song = await SongCache.create({
      cloudinaryId: audioUpload.key, // keeping backward compatibility
      url: audioUpload.url,
      title: customMetadata.title,
      artist: customMetadata.artist || 'Unknown Artist',
      singer: customMetadata.singer || customMetadata.artist || 'Unknown Artist',
      musicDirector: customMetadata.musicDirector || 'Unknown Composer',
      lyricist: customMetadata.lyricist || 'Unknown Lyricist',
      genre: customMetadata.genre || 'Pop',
      language: customMetadata.language || 'Unknown',
      album: customMetadata.album || 'YouTube Import',
      year: Number(customMetadata.year) || new Date().getFullYear(),
      duration: Number(customMetadata.duration) || 0,
      bitrate: 192,
      fileSize: fileBuffer.length,
      mimeType: 'audio/mpeg',
      artworkUrl: artworkUrl,
      cloudflareKey: audioUpload.key,
      thumbnailUrl: thumbnailUrl,
      composer: customMetadata.musicDirector || 'Unknown Composer',
      folder: 'youtube-imports',
      uploadedBy: userId,

      // YouTube fields
      sourceType: 'youtube',
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      youtubeVideoId: videoId,
      importedBy: userId,
      importedAt: new Date(),
      songHash: songHash
    });

    console.log(`[YouTube Service] Import complete! Song ID: ${song._id}`);
    updateProgress('completed', 100, song);
    return song;

  } catch (error) {
    console.error('[YouTube Service] Import failed:', error);
    updateProgress('failed', 100, null, error.message);
    throw error;
  } finally {
    // CLEANUP TEMP FILES
    console.log('[YouTube Service] Cleaning up temporary files...');
    try {
      if (fs.existsSync(rawAudioPath)) {
        fs.unlinkSync(rawAudioPath);
      }
      if (fs.existsSync(outMp3Path)) {
        fs.unlinkSync(outMp3Path);
      }
    } catch (cleanupErr) {
      console.error('[YouTube Service] Error during temp file cleanup:', cleanupErr);
    }
  }
};
