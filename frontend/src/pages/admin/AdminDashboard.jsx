import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Music, TrendingUp, Clock, HardDrive, Disc,
  Video, Loader, AlertCircle, X, CheckCircle, Edit2,
  Save
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import useAuthStore from '../../store/authStore';

const toArray = (value) => (Array.isArray(value) ? value : []);

const formatUploadDate = (value) => {
  const uploadDate = String(value || '');

  if (uploadDate.length < 8) return null;

  return `${uploadDate.slice(0, 4)}-${uploadDate.slice(4, 6)}-${uploadDate.slice(6, 8)}`;
};

const ACTIVE_JOB_STATUSES = [
  'pending',
  'checking_duplicates',
  'downloading',
  'converting',
  'uploading',
  'saving'
];

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="glass-card p-6 flex items-center gap-6">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} bg-opacity-20 text-white shadow-lg`}>
      <Icon className="w-8 h-8" />
    </div>
    <div>
      <p className="text-zinc-400 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalUsers: 0,
    totalArtists: 0,
    totalAlbums: 0,
    totalGenres: 0,
    totalPlaylists: 12,
    storageUsed: '2.4 GB',
    recentActivity: []
  });
  const token = useAuthStore(state => state.token);

  // YouTube Importer States
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState('');

  // Inspected Metadata State (Phase 1)
  const [inspectedData, setInspectedData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edited Metadata State (Phase 2)
  const [editedMetadata, setEditedMetadata] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    duration: 0,
    thumbnailUrl: '',
    description: ''
  });

  // Active queue & history jobs
  const [importJobs, setImportJobs] = useState([]);
  const pollIntervalRef = useRef(null);
  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const [songsRes, usersRes, artistsRes, albumsRes, genresRes] = await Promise.all([
        axiosInstance.get(`/api/music/songs`),
        axiosInstance.get(`/api/auth/users`),
        axiosInstance.get(`/api/music/artists`),
        axiosInstance.get(`/api/music/albums`),
        axiosInstance.get(`/api/music/genres`)
      ]);

      setStats(prev => ({
        ...prev,
        totalSongs: toArray(songsRes.data).length,
        totalUsers: toArray(usersRes.data).length,
        totalArtists: toArray(artistsRes.data).length,
        totalAlbums: toArray(albumsRes.data).length,
        totalGenres: toArray(genresRes.data).length,
        recentActivity: [
          { id: 1, type: 'upload', user: 'Admin', target: 'Bohemian Rhapsody', time: '2 mins ago' },
          { id: 2, type: 'user', user: 'System', target: 'New user "John Doe" created', time: '1 hour ago' },
          { id: 3, type: 'update', user: 'Admin', target: 'Updated album metadata', time: '3 hours ago' },
        ]
      }));
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  // Fetch import jobs
  const fetchImportJobs = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/music/youtube/jobs');
      setImportJobs(toArray(res.data));
    } catch (err) {
      console.error('Failed to fetch import jobs', err);
      setImportJobs([]);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
    fetchImportJobs();
  }, [token, fetchStats, fetchImportJobs]);

  // Poll only when active jobs exist
  useEffect(() => {
    const hasActiveJobs = importJobs.some(job =>
      ACTIVE_JOB_STATUSES.includes(job.status)
    );

    if (!hasActiveJobs) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    if (pollIntervalRef.current) {
      return;
    }

    pollIntervalRef.current = setInterval(() => {
      fetchImportJobs();
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [importJobs, fetchImportJobs]);

  // Inspect YouTube URL (Phase 1)
  const handleInspect = async (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setInspecting(true);
    setInspectError('');
    setInspectedData(null);

    try {
      const res = await axiosInstance.post('/api/music/youtube/inspect', { url: youtubeUrl });

      const { metadata, duplicate, duplicateReason, existingSong } = res.data;

      setInspectedData({
        ...metadata,
        duplicate,
        duplicateReason,
        existingSong
      });

      // Initialize the edit form
      setEditedMetadata({
        title: metadata.title || '',
        artist: metadata.artist || '',
        singer: metadata.singer || metadata.artist || '',
        musicDirector: metadata.musicDirector || 'Unknown Composer',
        lyricist: metadata.lyricist || 'Unknown Lyricist',
        genre: metadata.genre || 'Pop',
        language: metadata.language || 'Unknown',
        album: metadata.album || 'YouTube Import',
        year: metadata.year || new Date().getFullYear(),
        duration: metadata.duration || 0,
        thumbnailUrl: metadata.thumbnailUrl || '',
        description: metadata.description || ''
      });

      setIsModalOpen(true);
    } catch (err) {
      console.error('Inspection failed', err);
      setInspectError(err.response?.data?.message || 'Failed to inspect YouTube URL. Make sure it is valid.');
    } finally {
      setInspecting(false);
    }
  };

  // Trigger import job (Phase 3)
  const handleConfirmImport = async () => {
    if (!inspectedData) return;

    if (inspectedData.duplicate) {
      const confirmed = window.confirm(
        'This song appears to be a duplicate. Continue importing anyway?'
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      await axiosInstance.post('/api/music/youtube/import', {
        url: inspectedData.youtubeUrl,
        metadata: editedMetadata
      });

      // Reset inspection and close modal
      setIsModalOpen(false);
      setInspectedData(null);
      setYoutubeUrl('');

      // Immediately refresh jobs
      fetchImportJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to queue import job');
    }
  };

  // Cancel an active job
  const handleCancelJob = async (jobId) => {
    try {
      await axiosInstance.post(`/api/music/youtube/jobs/${jobId}/cancel`);
      fetchImportJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel job');
    }
  };

  // Clear job history
  const handleClearHistory = async () => {
    try {
      await axiosInstance.delete('/api/music/youtube/jobs');
      fetchImportJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clear history');
    }
  };

  // Helper to format status text
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full font-bold uppercase">Queued</span>;
      case 'checking_duplicates':
        return <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2.5 py-0.5 rounded-full font-bold uppercase">Checking</span>;
      case 'downloading':
        return <span className="text-xs bg-blue-500/10 text-blue-500 px-2.5 py-0.5 rounded-full font-bold uppercase animate-pulse">Downloading</span>;
      case 'converting':
        return <span className="text-xs bg-purple-500/10 text-purple-500 px-2.5 py-0.5 rounded-full font-bold uppercase">Converting</span>;
      case 'uploading':
        return <span className="text-xs bg-teal-500/10 text-teal-500 px-2.5 py-0.5 rounded-full font-bold uppercase animate-pulse">Uploading</span>;
      case 'saving':
        return <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full font-bold uppercase">Saving</span>;
      case 'completed':
        return <span className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Done</span>;
      case 'failed':
        return <span className="text-xs bg-red-500/10 text-red-500 px-2.5 py-0.5 rounded-full font-bold uppercase">Failed</span>;
      default:
        return <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-16">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight neon-text mb-2">Command Center</h1>
        <p className="text-zinc-400">Overview of your M3 Music ecosystem & automated importers</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Songs" value={stats.totalSongs} icon={Music} color="bg-primary" />
        <StatCard title="Total Artists" value={stats.totalArtists} icon={Users} color="bg-blue-500" />
        <StatCard title="Total Albums" value={stats.totalAlbums} icon={Disc} color="bg-purple-500" />
        <StatCard title="Total Genres" value={stats.totalGenres} icon={TrendingUp} color="bg-pink-500" />
        <StatCard title="Registered Users" value={stats.totalUsers} icon={Users} color="bg-orange-500" />
        <StatCard title="Storage Used" value={stats.storageUsed} icon={HardDrive} color="bg-teal-500" />
      </div>

      {/* YouTube Import Section */}
      <div className="glass-card p-8 border-primary/20 relative overflow-hidden">
        {/* Subtle decorative video icon background */}
        <Video className="absolute right-[-30px] bottom-[-30px] w-64 h-64 text-red-500/[0.03] rotate-12 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Import from YouTube</h2>
              <p className="text-sm text-zinc-400">Extract high-quality audio streams automatically and save them straight to your library.</p>
            </div>
          </div>

          <form onSubmit={handleInspect} className="flex flex-col md:flex-row gap-4 mt-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-4 pr-12 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={inspecting}
              />
              {youtubeUrl && (
                <button
                  type="button"
                  onClick={() => setYoutubeUrl('')}
                  className="absolute right-4 top-4 text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={inspecting || !youtubeUrl.trim()}
              className="btn-neon py-3.5 px-8 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
            >
              {inspecting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin text-black" />
                  Inspecting Video...
                </>
              ) : (
                'Inspect & Preview'
              )}
            </button>
          </form>

          {inspectError && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{inspectError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Pipeline and System Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Active Pipeline Monitor (Takes 2 columns if large, else 1) */}
        <div className="lg:col-span-2 space-y-8">

          {/* YouTube Import Progress & Queue */}
          <div className="glass-card p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary animate-pulse" />
                YouTube Import Pipeline
              </h3>
              {importJobs.some(j => ['completed', 'failed'].includes(j.status)) && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors font-semibold"
                >
                  Clear Finished History
                </button>
              )}
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
              {importJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                  <Video className="w-12 h-12 text-zinc-800 mb-3" />
                  <p className="font-semibold text-zinc-600">Pipeline is currently empty</p>
                  <p className="text-xs text-zinc-700 mt-1">Enter a YouTube URL above to queue an import job.</p>
                </div>
              ) : (
                importJobs.map(job => (
                  <div
                    key={job.id}
                    className={`p-4 rounded-xl border transition-all ${job.status === 'completed'
                        ? 'bg-primary/[0.01] border-primary/10 hover:border-primary/20'
                        : job.status === 'failed'
                          ? 'bg-red-500/[0.01] border-red-500/10 hover:border-red-500/20'
                          : 'bg-white/[0.02] border-white/5 shadow-md'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Artwork/Thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-white/5 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                          {job.customMetadata?.thumbnailUrl ? (
                            <img src={job.customMetadata.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-5 h-5 text-zinc-700" />
                          )}
                        </div>

                        {/* Title & Stats */}
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm truncate pr-2 text-zinc-200">
                            {job.customMetadata?.title || 'Loading Video Title...'}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                            <span>{job.customMetadata?.artist || 'YouTube'}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="font-mono text-[10px]">
                              {job.customMetadata?.duration
                                ? `${Math.floor(job.customMetadata.duration / 60)}:${String(job.customMetadata.duration % 60).padStart(2, '0')}`
                                : '0:00'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Status & Cancel Control */}
                      <div className="flex items-center gap-3 shrink-0">
                        {getStatusBadge(job.status)}

                        {/* Cancel button for active pipelines */}
                        {['pending', 'downloading', 'converting', 'uploading', 'saving'].includes(job.status) && (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                            title="Cancel Import"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Details */}
                    {['downloading', 'converting', 'uploading', 'saving', 'checking_duplicates'].includes(job.status) && (
                      <div className="mt-4 space-y-2">
                        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-white/[0.02]">
                          <div
                            className="bg-primary h-full transition-all duration-500 shadow-[0_0_10px_var(--primary)]"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                          <span>
                            {job.status === 'downloading' && 'Streaming raw audio streams...'}
                            {job.status === 'converting' && 'Transcoding to 192kbps MP3 & Normalizing...'}
                            {job.status === 'uploading' && 'Syncing MP3 artwork & assets to Cloudflare R2...'}
                            {job.status === 'saving' && 'Updating MongoDB Song Collection...'}
                            {job.status === 'checking_duplicates' && 'Verifying unique audio hashes...'}
                          </span>
                          <span className="font-mono text-primary font-bold">{job.progress}%</span>
                        </div>
                      </div>
                    )}

                    {/* Error display */}
                    {job.status === 'failed' && job.error && (
                      <div className="mt-3 text-xs bg-red-500/5 text-red-400 p-2.5 rounded-lg border border-red-500/10 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                        <span className="font-medium break-all">{job.error}</span>
                      </div>
                    )}

                    {/* Completion link */}
                    {job.status === 'completed' && job.song && (
                      <div className="mt-3 flex items-center justify-between text-xs bg-primary/5 text-primary py-2 px-3 rounded-lg border border-primary/10">
                        <span className="font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          Song successfully cataloged into database
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ID: {job.song._id}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Columns: Activity and Status */}
        <div className="space-y-8">
          {/* Recent Activity */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {stats.recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${activity.type === 'upload' ? 'bg-primary' : activity.type === 'user' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                    <div>
                      <p className="text-sm font-semibold">{activity.target}</p>
                      <p className="text-xs text-zinc-500">by {activity.user}</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              System Status
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">CPU Usage</span>
                  <span className="font-mono">12%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Memory Usage</span>
                  <span className="font-mono">45%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Cloudflare capacity</span>
                  <span className="font-mono">31%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '31%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* YouTube Preview & Edit Metadata Modal (Phase 1 & 2) */}
      <AnimatePresence>
        {isModalOpen && inspectedData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-4xl glass-card p-6 md:p-8 shadow-2xl flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2 transition-all rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Left Column: Artwork and warning details */}
              <div className="w-full md:w-64 shrink-0">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">Artwork Preview</h3>
                <div className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-4 group relative">
                  {editedMetadata.thumbnailUrl ? (
                    <img src={editedMetadata.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-full h-full p-16 text-zinc-700" />
                  )}
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                  <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Video Information</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Duration:</span>
                    <span className="font-mono text-zinc-300">
                      {Math.floor(inspectedData.duration / 60)}:{String(inspectedData.duration % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Platform ID:</span>
                    <span className="font-mono text-zinc-400">{inspectedData.youtubeVideoId}</span>
                  </div>
                  {formatUploadDate(inspectedData.uploadDate) && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Uploaded:</span>
                      <span className="text-zinc-400">
                        {formatUploadDate(inspectedData.uploadDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Duplicate Notification Warning */}
                {inspectedData.duplicate && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 space-y-2 animate-pulse">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase">
                      <AlertCircle className="w-4 h-4" />
                      Duplicate Detected
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-300">
                      This video matches a song already in the catalog: <strong>"{inspectedData.existingSong?.title}"</strong> ({inspectedData.duplicateReason}).
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Edit Form */}
              <div className="flex-1 min-w-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-black flex items-center gap-2 text-zinc-100">
                    <Edit2 className="w-6 h-6 text-primary" />
                    Review & Edit Metadata
                  </h2>
                  <p className="text-zinc-500 text-xs mt-1">Review extracted attributes. Changes will be embedded directly inside the imported song file.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Song Title</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                        value={editedMetadata.title}
                        onChange={(e) => setEditedMetadata({ ...editedMetadata, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Artist / Uploader</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                        value={editedMetadata.artist}
                        onChange={(e) => setEditedMetadata({ ...editedMetadata, artist: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Singer(s)</label>
                      <input
                        type="text"
                        placeholder="e.g. Benny Dayal, Naresh Iyer"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                        value={editedMetadata.singer}
                        onChange={(e) => setEditedMetadata({ ...editedMetadata, singer: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Music Director / Composer</label>
                      <input
                        type="text"
                        placeholder="e.g. A.R. Rahman"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                        value={editedMetadata.musicDirector}
                        onChange={(e) => setEditedMetadata({ ...editedMetadata, musicDirector: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Lyricist</label>
                      <input
                        type="text"
                        placeholder="e.g. Madhan Karky"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                        value={editedMetadata.lyricist}
                        onChange={(e) => setEditedMetadata({ ...editedMetadata, lyricist: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Album Name</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                        value={editedMetadata.album}
                        onChange={(e) => setEditedMetadata({ ...editedMetadata, album: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Genre Category</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                        value={editedMetadata.genre}
                        onChange={(e) => setEditedMetadata({ ...editedMetadata, genre: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Language</label>
                      <select
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary transition-all text-white font-medium appearance-none"
                        value={editedMetadata.language}
                        onChange={(e) => setEditedMetadata({ ...editedMetadata, language: e.target.value })}
                      >
                        {['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Japanese', 'Korean', 'Unknown'].map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Release Year</label>
                      <input
                        type="number"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                        value={editedMetadata.year}
                        onChange={(e) => setEditedMetadata({ ...editedMetadata, year: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Artwork URL Link</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-primary transition-all text-zinc-300 font-mono"
                      value={editedMetadata.thumbnailUrl}
                      onChange={(e) => setEditedMetadata({ ...editedMetadata, thumbnailUrl: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Video Description</label>
                    <textarea
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-primary transition-all text-zinc-400 font-sans resize-none custom-scrollbar"
                      value={editedMetadata.description}
                      onChange={(e) => setEditedMetadata({ ...editedMetadata, description: e.target.value })}
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-4 pt-4 border-t border-white/5">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/5 text-sm"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      className="flex-1 btn-neon py-3 text-sm flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4 text-black" />
                      Queue & Import Song
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
