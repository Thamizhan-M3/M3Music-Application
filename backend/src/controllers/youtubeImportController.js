import queueManager from '../services/importQueue.js';
import { fetchYoutubeMetadata, getYoutubeVideoId } from '../services/youtubeImportService.js';
import SongCache from '../models/SongCache.js';

// Escape regex special characters
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * @desc    Validate URL and inspect YouTube video metadata
 * @route   POST /api/music/youtube/inspect
 * @access  Private/Admin
 */
export const inspectYoutubeVideo = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'YouTube URL is required' });
  }

  const videoId = getYoutubeVideoId(url);
  if (!videoId) {
    return res.status(400).json({ message: 'Invalid YouTube URL format' });
  }

  try {
    // 1. Fetch metadata from YouTube
    const metadata = await fetchYoutubeMetadata(url);

    // 2. DUPLICATE DETECTION
    // a. Check by Video ID
    let duplicate = await SongCache.findOne({ youtubeVideoId: videoId });
    let duplicateReason = '';

    if (duplicate) {
      duplicateReason = 'Video ID already imported';
    } else {
      // b. Check by Title + Duration (within 3 seconds tolerance)
      duplicate = await SongCache.findOne({
        title: { $regex: new RegExp(`^${escapeRegExp(metadata.title)}$`, 'i') },
        duration: { $gte: metadata.duration - 3, $lte: metadata.duration + 3 }
      });
      if (duplicate) {
        duplicateReason = 'Identical Title + Duration match';
      }
    }

    res.json({
      metadata,
      duplicate: !!duplicate,
      duplicateReason,
      existingSong: duplicate || null
    });
  } catch (error) {
    console.error('[YouTube Controller] Inspection failed:', error);
    res.status(500).json({ message: 'Failed to inspect YouTube URL', error: error.message });
  }
};

/**
 * @desc    Add a YouTube import job to the async queue
 * @route   POST /api/music/youtube/import
 * @access  Private/Admin
 */
export const startYoutubeImport = async (req, res) => {
  const { url, metadata } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'YouTube URL is required' });
  }
  if (!metadata || !metadata.title) {
    return res.status(400).json({ message: 'Metadata with title is required' });
  }

  try {
    const job = await queueManager.addJob(url, metadata, req.user._id);
    res.status(202).json({
      message: 'Import job successfully queued',
      jobId: job.id,
      job
    });
  } catch (error) {
    console.error('[YouTube Controller] Import queue failed:', error);
    res.status(400).json({ message: error.message || 'Failed to queue import job' });
  }
};

/**
 * @desc    Get all active and history import jobs
 * @route   GET /api/music/youtube/jobs
 * @access  Private/Admin
 */
export const getImportJobs = async (req, res) => {
  try {
    const jobs = queueManager.getJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve import jobs', error: error.message });
  }
};

/**
 * @desc    Get progress details of a specific import job
 * @route   GET /api/music/youtube/jobs/:id
 * @access  Private/Admin
 */
export const getImportJobDetails = async (req, res) => {
  try {
    const job = queueManager.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Import job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve job details', error: error.message });
  }
};

/**
 * @desc    Cancel an active or pending import job
 * @route   POST /api/music/youtube/jobs/:id/cancel
 * @access  Private/Admin
 */
export const cancelImportJob = async (req, res) => {
  try {
    queueManager.cancelJob(req.params.id);
    res.json({ message: 'Import job successfully cancelled' });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to cancel import job' });
  }
};

/**
 * @desc    Clear import history from queue memory
 * @route   DELETE /api/music/youtube/jobs
 * @access  Private/Admin
 */
export const clearJobHistory = async (req, res) => {
  try {
    queueManager.clearHistory();
    res.json({ message: 'Job history successfully cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear job history', error: error.message });
  }
};
