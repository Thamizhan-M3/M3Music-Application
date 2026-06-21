import SongCache from '../models/SongCache.js';
import User from '../models/User.js';
import Like from '../models/Like.js';
import mongoose from 'mongoose';

import {
  getCloudinaryFiles,
  uploadFromBuffer,
  deleteCloudinaryFile,
  uploadFileBuffer,
  s3
} from '../services/cloudinaryService.js';

import { extractMetadata } from '../services/metadataService.js';

import {
  GetObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';

const S3_BUCKET = process.env.S3_BUCKET_NAME;

//////////////////////////////////////////////////////
// ✅ UPLOAD MUSIC
//////////////////////////////////////////////////////
export const uploadMusic = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { generateGradientPlaceholder } = await import('../services/metadataService.js');
    const addedSongs = [];

    for (const file of req.files) {
      const { key, url } = await uploadFileBuffer(file.buffer, file.originalname, 'audio');

      const metadata = await extractMetadata(file.buffer, {
        mimeType: file.mimetype,
        originalFileName: file.originalname,
        fileSize: file.size
      });

      const title = req.body.title || metadata?.title || file.originalname.replace(/\.[^/.]+$/, "");
      const artist = req.body.artist || metadata?.artist || 'Unknown Artist';
      const musicDirector = req.body.musicDirector || 'Unknown Composer';

      let artworkUrl = '';

      let artworkBuffer = metadata?.artwork?.buffer;
      if (!artworkBuffer) {
        artworkBuffer = await generateGradientPlaceholder();
      }

      if (artworkBuffer) {
        const result = await uploadFromBuffer(artworkBuffer, `${file.originalname}-artwork.jpg`, 'artwork');
        artworkUrl = result.url;
      }

      const song = await SongCache.create({
        cloudinaryId: key,
        url,
        title,
        artist,
        musicDirector,
        bitrate: metadata?.bitrate || 192,
        fileSize: file.size,
        mimeType: file.mimetype,
        artworkUrl,
        uploadedBy: req.user._id
      });

      addedSongs.push(song);
    }

    res.status(201).json({ message: 'Uploaded', songs: addedSongs });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

//////////////////////////////////////////////////////
// ✅ GET SONGS
//////////////////////////////////////////////////////
export const getSongs = async (req, res) => {
  const songs = await SongCache.find().sort({ createdAt: -1 });
  res.json(songs);
};

//////////////////////////////////////////////////////
// ✅ SEARCH SONGS
//////////////////////////////////////////////////////
export const searchSongs = async (req, res) => {
  const query = req.query.q;

  const songs = await SongCache.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { artist: { $regex: query, $options: 'i' } }
    ]
  });

  res.json(songs);
};

//////////////////////////////////////////////////////
// ✅ UPDATE SONG
//////////////////////////////////////////////////////
export const updateSong = async (req, res) => {
  const song = await SongCache.findById(req.params.id);

  if (!song) return res.status(404).json({ message: "Not found" });

  song.title = req.body.title || song.title;
  song.artist = req.body.artist || song.artist;

  const updated = await song.save();
  res.json(updated);
};

//////////////////////////////////////////////////////
// ✅ DELETE SONG (FIXED ✅)
//////////////////////////////////////////////////////
export const deleteSong = async (req, res) => {
  try {
    const song = await SongCache.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    await deleteCloudinaryFile(song.cloudinaryId);
    await song.deleteOne();

    res.json({ message: 'Song deleted' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//////////////////////////////////////////////////////
// ✅ STREAM SONG FROM S3
//////////////////////////////////////////////////////
export const streamSong = async (req, res) => {
  try {
    const song = await SongCache.findById(req.params.id);
    const key = song.cloudinaryId;

    const head = await s3.send(
      new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key })
    );

    const total = head.ContentLength;
    const range = req.headers.range;

    if (!range) {
      const data = await s3.send(
        new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
      );

      res.writeHead(200, {
        'Content-Type': song.mimeType,
        'Content-Length': total
      });

      data.Body.pipe(res);
      return;
    }

    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0]);
    const end = parts[1] ? parseInt(parts[1]) : total - 1;

    const data = await s3.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Range: `bytes=${start}-${end}`
      })
    );

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': song.mimeType
    });

    data.Body.pipe(res);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//////////////////////////////////////////////////////
// ✅ LIKES
//////////////////////////////////////////////////////
export const getLikedSongs = async (req, res) => {
  const likes = await Like.find({ userId: req.user._id }).populate('songId');
  res.json(likes.map(l => l.songId));
};

export const toggleLikeSong = async (req, res) => {
  const { id } = req.params;

  const existing = await Like.findOne({ userId: req.user._id, songId: id });

  if (existing) {
    await existing.deleteOne();
    return res.json({ liked: false });
  }

  await Like.create({ userId: req.user._id, songId: id });
  res.json({ liked: true });
};

//////////////////////////////////////////////////////
// ✅ SIMPLE FILTER APIS
//////////////////////////////////////////////////////
export const getArtists = async (req, res) => {
  const artists = await SongCache.distinct('artist');
  res.json(artists);
};

export const getAlbums = async (req, res) => {
  const albums = await SongCache.distinct('album');
  res.json(albums);
};

export const getGenres = async (req, res) => {
  const genres = await SongCache.distinct('genre');
  res.json(genres);
};

//////////////////////////////////////////////////////
// ✅ FILTER
//////////////////////////////////////////////////////
export const filterSongs = async (req, res) => {
  const query = {};
  if (req.query.artist) query.artist = req.query.artist;
  if (req.query.genre) query.genre = req.query.genre;

  const songs = await SongCache.find(query);
  res.json(songs);
};

//////////////////////////////////////////////////////
// ✅ BY ARTIST / ALBUM / GENRE
//////////////////////////////////////////////////////
export const getSongsByArtist = async (req, res) => {
  const songs = await SongCache.find({ artist: req.params.artist });
  res.json(songs);
};

export const getSongsByAlbum = async (req, res) => {
  const songs = await SongCache.find({ album: req.params.album });
  res.json(songs);
};

export const getSongsByGenre = async (req, res) => {
  const songs = await SongCache.find({ genre: req.params.genre });
  res.json(songs);
};

//////////////////////////////////////////////////////
// ✅ UPLOAD ARTWORK
//////////////////////////////////////////////////////
export const uploadArtwork = async (req, res) => {
  try {
    const result = await uploadFromBuffer(req.file.buffer, 'art.jpg', 'artwork');
    res.json({ url: result.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//////////////////////////////////////////////////////
// ✅ SYNC (OPTIONAL)
//////////////////////////////////////////////////////
export const syncCloudinary = async (req, res) => {
  const files = await getCloudinaryFiles('audio');
  res.json({ total: files.length });
};
