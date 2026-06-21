import { v4 as uuidv4 } from 'uuid';
import { processYoutubeImport, getYoutubeVideoId } from './youtubeImportService.js';
import SongCache from '../models/SongCache.js';

class ImportQueueManager {
  constructor() {
    this.jobs = []; // Array of job objects
    this.isProcessing = false;
    this.historyLimit = 50; // Keep last 50 jobs in history
  }

  /**
   * Add a new import job to the queue
   * @param {string} youtubeUrl - YouTube URL
   * @param {object} customMetadata - Metadata customized by the admin
   * @param {string} userId - ID of the admin triggering the import
   * @returns {object} - The created job object
   */
  async addJob(youtubeUrl, customMetadata, userId) {
    const videoId = getYoutubeVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Check if video is already imported in DB
    const existing = await SongCache.findOne({ youtubeVideoId: videoId });
    if (existing) {
      throw new Error(`Duplicate import: Song already exists as "${existing.title}"`);
    }

    // Check if video is already active in queue
    const activeJob = this.jobs.find(
      j => j.videoId === videoId && ['pending', 'downloading', 'converting', 'uploading', 'saving'].includes(j.status)
    );
    if (activeJob) {
      throw new Error('This video is already in the import queue');
    }

    const job = {
      id: uuidv4(),
      youtubeUrl,
      videoId,
      customMetadata,
      userId,
      status: 'pending',
      progress: 0,
      error: null,
      song: null,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null
    };

    this.jobs.unshift(job); // Add to the beginning so newest is first in listing
    
    // Trigger processing (async)
    this.processNext();

    return job;
  }

  /**
   * Get a job by ID
   * @param {string} id - Job ID
   * @returns {object|null} - Job object or null
   */
  getJob(id) {
    return this.jobs.find(j => j.id === id) || null;
  }

  /**
   * Get all jobs
   * @returns {Array} - Array of job objects
   */
  getJobs() {
    return this.jobs;
  }

  /**
   * Cancel a pending or active job
   * @param {string} id - Job ID
   */
  cancelJob(id) {
    const job = this.getJob(id);
    if (!job) {
      throw new Error('Job not found');
    }

    const activeStatuses = ['pending', 'downloading', 'converting', 'uploading', 'saving'];
    if (!activeStatuses.includes(job.status)) {
      throw new Error(`Cannot cancel job in "${job.status}" status`);
    }

    console.log(`[Queue Manager] Cancelling job ${id} (${job.videoId})`);
    job.status = 'failed';
    job.error = 'Import cancelled by admin';
    job.completedAt = new Date();
    
    // Note: If processing, the service will clean up temp files and exit gracefully.
    if (this.isProcessing) {
      // Just check if we need to advance the queue
      this.isProcessing = false;
      this.processNext();
    }
  }

  /**
   * Clear completed and failed jobs from queue memory
   */
  clearHistory() {
    this.jobs = this.jobs.filter(j => ['pending', 'downloading', 'converting', 'uploading', 'saving'].includes(j.status));
  }

  /**
   * Process the next job in the queue
   */
  async processNext() {
    if (this.isProcessing) return;

    // Find the oldest pending job
    const pendingJobs = this.jobs.filter(j => j.status === 'pending');
    if (pendingJobs.length === 0) {
      this.isProcessing = false;
      return;
    }

    // Retrieve the next job (process oldest pending first)
    const job = pendingJobs[pendingJobs.length - 1];
    this.isProcessing = true;
    job.startedAt = new Date();

    console.log(`[Queue Manager] Starting job: ${job.id} for video: ${job.videoId}`);

    try {
      await processYoutubeImport(job, (status, progress, song = null, error = null) => {
        // If job was cancelled by admin, abort updating progress
        if (job.status === 'failed' && job.error === 'Import cancelled by admin') {
          throw new Error('Abort: Job was cancelled by admin');
        }

        job.status = status;
        job.progress = progress;
        if (song) job.song = song;
        if (error) job.error = error;
      });

      job.completedAt = new Date();
      console.log(`[Queue Manager] Job ${job.id} completed successfully!`);
    } catch (err) {
      console.error(`[Queue Manager] Job ${job.id} failed:`, err.message);
      
      // If it wasn't already marked as cancelled, mark as failed
      if (job.status !== 'failed' || !job.error) {
        job.status = 'failed';
        job.error = err.message || 'Unknown import error';
        job.completedAt = new Date();
      }
    } finally {
      this.isProcessing = false;
      
      // Enforce history limit
      if (this.jobs.length > this.historyLimit) {
        const finishedJobs = this.jobs.filter(j => ['completed', 'failed'].includes(j.status));
        const keepCount = this.historyLimit - (this.jobs.length - finishedJobs.length);
        
        // Remove excess finished jobs starting from oldest finished
        if (keepCount > 0) {
          let removedCount = 0;
          this.jobs = this.jobs.filter(j => {
            if (['completed', 'failed'].includes(j.status)) {
              removedCount++;
              return removedCount <= keepCount;
            }
            return true;
          });
        }
      }

      // Process next job in queue
      setTimeout(() => this.processNext(), 100);
    }
  }
}

// Export singleton instance
const queueManager = new ImportQueueManager();
export default queueManager;
