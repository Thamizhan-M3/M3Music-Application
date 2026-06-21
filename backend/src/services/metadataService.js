import * as musicMetadata from 'music-metadata';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * Intelligent language detection based on Unicode ranges and keyword heuristics.
 * Supported: Tamil, English, Hindi, Telugu, Malayalam, Kannada, Japanese, Korean.
 */
export function detectLanguage(metadata, title = '') {
  const checkText = `${title} ${metadata?.common?.title || ''} ${metadata?.common?.artist || ''} ${metadata?.common?.album || ''} ${metadata?.common?.genre?.join(' ') || ''}`.toLowerCase();

  // 1. Unicode Range checks
  if (/[\u0B80-\u0BFF]/.test(checkText)) return 'Tamil';
  if (/[\u0C00-\u0C7F]/.test(checkText)) return 'Telugu';
  if (/[\u0C80-\u0CFF]/.test(checkText)) return 'Kannada';
  if (/[\u0D00-\u0D7F]/.test(checkText)) return 'Malayalam';
  if (/[\u0900-\u097F]/.test(checkText)) return 'Hindi'; // Devanagari range
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(checkText)) return 'Japanese';
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(checkText)) return 'Korean';

  // 2. Keyword Heuristics
  const keywords = {
    Tamil: ['tamil', 'kollywood', 'ar rahman', 'anirudh', 'ilayaraja', 'yuvan', 'santhosh narayanan', 'harris jayaraj', 'spb', 'sivakarthikeyan'],
    Telugu: ['telugu', 'tollywood', 'keeravani', 'dsp', 'devi sri prasad', 'thaman', 'allu arjun'],
    Hindi: ['hindi', 'bollywood', 'arijit', 'kishore', 'lata', 'asha', 'pritam', 'tanishk', 'badshah', 'shreya ghoshal'],
    Malayalam: ['malayalam', 'mollywood', 'gopi sundar', 'vidyasagar', 'sushin shyam'],
    Kannada: ['kannada', 'sandalwood', 'harikrishna', 'charan raj'],
    Japanese: ['japanese', 'jpop', 'anime', 'otaku', 'radwimps', 'lisa', 'yoasobi'],
    Korean: ['korean', 'kpop', 'bts', 'blackpink', 'twice', 'iu', 'ost'],
    English: ['english', 'pop', 'rock', 'rap', 'hip hop', 'rb', 'country', 'billboard', 'taylor swift', 'drake', 'the weeknd', 'coldplay', 'eminem']
  };

  for (const [lang, list] of Object.entries(keywords)) {
    if (list.some(kw => checkText.includes(kw))) {
      return lang;
    }
  }

  // 3. English Fallback for standard ASCII titles
  if (/^[a-zA-Z0-9\s\-_.,!()'"]+$/.test(title || metadata?.common?.title || '')) {
    return 'English';
  }

  return 'Unknown';
}

/**
 * Generates a premium gradient placeholder JPEG artwork using SVG and sharp.
 */
export async function generateGradientPlaceholder() {
  const gradientPresets = [
    ['#12c2e9', '#c471ed', '#f64f59'],
    ['#00c6ff', '#0072ff'],
    ['#f8ff00', '#3ad59f'],
    ['#fbc2eb', '#a6c1ee'],
    ['#84fab0', '#8fd3f4'],
    ['#a1c4fd', '#c2e9fb'],
    ['#ff9a9e', '#fecfef'],
    ['#13547a', '#80d0c7'],
    ['#ff0844', '#ffb199'],
    ['#1db954', '#191414']
  ];
  
  const pair = gradientPresets[Math.floor(Math.random() * gradientPresets.length)];
  const gradientId = 'grad-' + Math.random().toString(36).substr(2, 9);
  
  const svg = `
    <svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          ${pair.map((c, i) => `<stop offset="${(i / (pair.length - 1)) * 100}%" stop-color="${c}" />`).join('')}
        </linearGradient>
      </defs>
      <rect width="1000" height="1000" fill="url(#${gradientId})" />
      <circle cx="500" cy="500" r="220" fill="white" opacity="0.06" />
      <circle cx="500" cy="500" r="160" fill="white" opacity="0.08" />
      <!-- Stylized Disc Icon -->
      <circle cx="500" cy="500" r="120" stroke="white" stroke-width="6" fill="none" opacity="0.4" />
      <circle cx="500" cy="500" r="60" stroke="white" stroke-width="4" fill="none" opacity="0.4" />
      <circle cx="500" cy="500" r="20" fill="white" opacity="0.6" />
    </svg>
  `;
  
  return await sharp(Buffer.from(svg))
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Extracts and cleans cover artwork from embedded tags, optimizing with sharp.
 */
export async function extractArtwork(metadata) {
  const pictures = metadata?.common?.picture;
  if (!pictures || pictures.length === 0) {
    return null;
  }

  const picture = pictures[0];
  try {
    const optimizedBuffer = await sharp(picture.data)
      .resize(1000, 1000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    return {
      buffer: optimizedBuffer,
      mimeType: 'image/jpeg'
    };
  } catch (err) {
    console.error('[Metadata Service] Sharp artwork optimization failed:', err);
    return null;
  }
}

/**
 * High-performance, robust metadata extraction for audio files.
 * Supports Buffers, local file paths, and remote HTTP URLs.
 */
export async function extractMetadata(source, options = {}) {
  let buffer;
  let mimeType = options.mimeType || 'audio/mpeg';
  let originalFileName = options.originalFileName || '';
  let fileSize = options.fileSize || 0;

  if (Buffer.isBuffer(source)) {
    buffer = source;
    fileSize = source.length;
  } else if (typeof source === 'string') {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      try {
        const response = await axios.get(source, { responseType: 'arraybuffer', timeout: 15000 });
        buffer = Buffer.from(response.data);
        if (response.headers['content-type']) {
          mimeType = response.headers['content-type'];
        }
        fileSize = buffer.length;
      } catch (axiosErr) {
        console.error('[Metadata Service] Failed to fetch remote URL, using dummy metadata:', axiosErr);
        buffer = Buffer.from([]);
      }
    } else {
      if (!fs.existsSync(source)) {
        throw new Error('Audio file not found at local path: ' + source);
      }
      const stats = fs.statSync(source);
      fileSize = stats.size;
      buffer = fs.readFileSync(source);
      
      const ext = path.extname(source).toLowerCase();
      if (ext === '.flac') mimeType = 'audio/flac';
      else if (ext === '.wav') mimeType = 'audio/wav';
      else if (ext === '.m4a') mimeType = 'audio/x-m4a';
      else if (ext === '.ogg') mimeType = 'audio/ogg';
      else if (ext === '.aac') mimeType = 'audio/aac';
    }
  } else {
    throw new Error('Unsupported metadata source type passed to extraction service');
  }

  let metadata = { common: {}, format: {} };
  if (buffer && buffer.length > 0) {
    try {
      metadata = await musicMetadata.parseBuffer(buffer, { mimeType });
    } catch (err) {
      console.warn('[Metadata Service] music-metadata parseBuffer failed, using standard fallbacks:', err);
    }
  }

  const duration = Math.round(metadata.format.duration || 0);
  const bitrate = Math.round((metadata.format.bitrate || 0) / 1000); // in kbps
  
  // Format fallback title from filename
  const fallbackTitle = originalFileName 
    ? path.basename(originalFileName, path.extname(originalFileName)).replace(/[-_]/g, ' ')
    : 'Untitled Song';

  const title = metadata.common.title || fallbackTitle;
  const artist = metadata.common.artist || metadata.common.albumartist || 'Unknown Artist';
  const album = metadata.common.album || 'Single';
  const genre = metadata.common.genre?.join(', ') || 'Pop';
  const year = metadata.common.year || (metadata.common.date ? parseInt(metadata.common.date.substring(0, 4)) : new Date().getFullYear());

  const language = detectLanguage(metadata, title);

  // Extract artwork
  let artwork = await extractArtwork(metadata);

  return {
    title,
    artist,
    singer: artist, // Default singer to same as artist
    musicDirector: metadata.common.composer?.join(', ') || 'Unknown Composer',
    lyricist: metadata.common.lyricist?.join(', ') || 'Unknown Lyricist',
    genre,
    language,
    album,
    year,
    duration,
    bitrate: bitrate || 192,
    fileSize,
    mimeType,
    artwork, // returns { buffer, mimeType } or null
    trackNumber: metadata.common.track?.no || null,
    composer: metadata.common.composer?.join(', ') || null
  };
}
