import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, Search, Edit2, Trash2, X, Image as ImageIcon, 
  RefreshCw, Disc, User, Tag, Calendar, Save, Globe, 
  BookOpen, Feather, HardDrive, Compass, Film, Trash, Upload
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const SongManager = () => {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    singer: '',
    musicDirector: '',
    lyricist: '',
    genre: '',
    language: 'Unknown',
    album: '',
    year: '',
    artworkUrl: '',
    thumbnailUrl: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await axiosInstance.get(`/api/music/songs`);
      setSongs(res.data);
    } catch (err) {
      console.error('Failed to fetch songs', err);
      setSongs([]);
    }
  };

  const handleSync = async () => {
    try {
      const confirmSync = window.confirm('Sync with R2 Cloudflare library? This process downloads missing song metadata and may take a few moments.');
      if (!confirmSync) return;
      
      setIsSyncing(true);
      const res = await axiosInstance.post(`/api/music/sync`, {});
      alert(`Sync finished successfully! Added ${res.data.added} new songs, removed ${res.data.removed} missing songs.`);
      fetchSongs();
    } catch (err) {
      console.error('Sync failed', err);
      alert('Synchronization pipeline failed. Ensure Cloudflare R2 is reachable.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUploadArtwork = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('artwork', file);

    setIsUploadingArtwork(true);
    try {
      const res = await axiosInstance.post('/api/music/upload-artwork', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({
        ...prev,
        artworkUrl: res.data.url,
        thumbnailUrl: res.data.url
      }));
    } catch (err) {
      console.error('Custom artwork upload failed:', err);
      alert('Failed to upload and optimize custom cover art image.');
    } finally {
      setIsUploadingArtwork(false);
    }
  };

  const handleRemoveArtwork = () => {
    setFormData(prev => ({
      ...prev,
      artworkUrl: '',
      thumbnailUrl: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/api/music/songs/${editingSong._id}`, formData);
      setIsModalOpen(false);
      setEditingSong(null);
      fetchSongs();
    } catch (err) {
      console.error('Failed to update song metadata', err);
      alert('Update failed. Ensure backend server is running and database is accessible.');
    }
  };

  const deleteSong = async (id) => {
    if (window.confirm('Are you absolutely sure you want to permanently delete this song from your Cloudflare R2 bucket and database library? This action is irreversible.')) {
      try {
        await axiosInstance.delete(`/api/music/songs/${id}`);
        fetchSongs();
      } catch (err) {
        console.error('Delete failed', err);
        alert('Failed to delete song.');
      }
    }
  };

  const filteredSongs = songs.filter(s => 
    s.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.singer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.musicDirector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.lyricist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.album?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.genre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.language?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const languages = [
    'Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Japanese', 'Korean', 'Unknown'
  ];

  return (
    <div className="animate-fade-in pb-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black mb-2 neon-text">Music Library Manager</h1>
          <p className="text-zinc-400">Review rich media attributes, customize covers, and run library sync pipelines.</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="btn-neon py-2.5 px-6 flex items-center gap-2 text-sm disabled:opacity-40 disabled:scale-100 disabled:shadow-none font-bold"
        >
          <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Synchronizing...' : 'Sync Library'}
        </button>
      </div>

      {/* Statistics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total Tracks</div>
            <div className="text-xl font-bold text-zinc-100">{songs.length}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Unique Singers</div>
            <div className="text-xl font-bold text-zinc-100">{[...new Set(songs.map(s => s.singer || s.artist))].filter(Boolean).length}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Languages</div>
            <div className="text-xl font-bold text-zinc-100">{[...new Set(songs.map(s => s.language))].filter(Boolean).length}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total Bitrate Avg</div>
            <div className="text-xl font-bold text-zinc-100">
              {songs.length ? Math.round(songs.reduce((acc, curr) => acc + (curr.bitrate || 192), 0) / songs.length) : 0} kbps
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card mb-8">
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <Search className="w-5 h-5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by Title, Singer, Composer, Lyricist, Album, Genre, Language..."
            className="bg-transparent border-none focus:ring-0 text-sm w-full text-zinc-200 outline-none placeholder-zinc-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Track Information</th>
                <th className="px-6 py-4">Singer / Artist</th>
                <th className="px-6 py-4">Creative Team</th>
                <th className="px-6 py-4">Album / Genre / Language</th>
                <th className="px-6 py-4">Quality & Size</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSongs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <Music className="w-12 h-12 text-zinc-800 mx-auto mb-3" />
                    <p className="font-semibold text-zinc-600">No tracks matched your search query</p>
                    <p className="text-xs text-zinc-700 mt-1">Try entering another keyword, genre, or singer.</p>
                  </td>
                </tr>
              ) : (
                filteredSongs.map(s => (
                  <tr key={s._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center border border-white/5 overflow-hidden shadow-lg shrink-0">
                          {s.artworkUrl || s.thumbnailUrl ? (
                            <img src={s.artworkUrl || s.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-6 h-6 text-zinc-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-200 truncate max-w-[200px]" title={s.title}>{s.title}</p>
                          <p className="text-xs text-zinc-500 font-mono mt-0.5">
                            {Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-zinc-300 truncate max-w-[150px]">{s.singer || s.artist || 'N/A'}</p>
                      {s.artist && s.artist !== s.singer && (
                        <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">Artist: {s.artist}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-zinc-400 font-medium">Composer: <span className="text-zinc-300 font-semibold">{s.musicDirector || s.composer || 'N/A'}</span></p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Lyricist: {s.lyricist || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-zinc-300 truncate max-w-[150px]">{s.album || 'N/A'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-500 font-mono uppercase tracking-wider font-bold">
                          {s.genre || 'Pop'}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold">
                          {s.language || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-zinc-500">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Compass className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{s.bitrate || 192} kbps</span>
                      </div>
                      <div className="text-[10px] text-zinc-600 mt-1">
                        {s.fileSize ? `${(s.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingSong(s);
                            setFormData({
                              title: s.title || '',
                              artist: s.artist || '',
                              singer: s.singer || s.artist || '',
                              musicDirector: s.musicDirector || s.composer || '',
                              lyricist: s.lyricist || '',
                              genre: s.genre || '',
                              language: s.language || 'Unknown',
                              album: s.album || '',
                              year: s.year || '',
                              artworkUrl: s.artworkUrl || s.thumbnailUrl || '',
                              thumbnailUrl: s.thumbnailUrl || s.artworkUrl || ''
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-2.5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all hover:scale-105"
                          title="Edit Metadata"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteSong(s._id)}
                          className="p-2.5 hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-500 transition-all hover:scale-105"
                          title="Delete Track"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rich Metadata Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
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
              {/* Close button */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2 transition-all rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Left Column: Image editor controls */}
              <div className="w-full md:w-64 shrink-0">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">Cover Artwork</h3>
                <div className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-4 group relative flex items-center justify-center">
                  {formData.artworkUrl || formData.thumbnailUrl ? (
                    <img src={formData.artworkUrl || formData.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-full h-full p-16 text-zinc-800" />
                  )}
                  {isUploadingArtwork && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-primary text-xs font-bold gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      Optimizing Image...
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    onChange={handleUploadArtwork} 
                    className="hidden" 
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingArtwork}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/5 text-xs flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Custom Cover
                  </button>
                  { (formData.artworkUrl || formData.thumbnailUrl) && (
                    <button 
                      type="button"
                      onClick={handleRemoveArtwork}
                      className="w-full py-2.5 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold rounded-xl transition-all border border-red-500/10 text-xs flex items-center justify-center gap-2"
                    >
                      <Trash className="w-3.5 h-3.5" />
                      Remove Artwork (Reset)
                    </button>
                  )}
                </div>

                {/* Paste Artwork URL */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase px-1">Artwork URL Link</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary transition-all text-zinc-400 font-mono"
                    placeholder="https://example.com/cover.jpg"
                    value={formData.artworkUrl}
                    onChange={(e) => setFormData({...formData, artworkUrl: e.target.value, thumbnailUrl: e.target.value})}
                  />
                </div>
              </div>

              {/* Right Column: Metadata Inputs Grid */}
              <div className="flex-1 min-w-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-black flex items-center gap-2 text-zinc-100">
                    <Edit2 className="w-6 h-6 text-primary" />
                    Review & Edit Song
                  </h2>
                  <p className="text-zinc-500 text-xs mt-1">Review embedded properties. These details will be synchronized throughout player queues, search listings, and collections.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Song Title</label>
                      <div className="relative">
                        <Music className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                        <input 
                          type="text" 
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Lead Artist / Uploader</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                        <input 
                          type="text" 
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                          value={formData.artist}
                          onChange={(e) => setFormData({...formData, artist: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Singer(s)</label>
                      <div className="relative">
                        <Feather className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                        <input 
                          type="text" 
                          placeholder="e.g. Sid Sriram, Shreya Ghoshal"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                          value={formData.singer}
                          onChange={(e) => setFormData({...formData, singer: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Music Director / Composer</label>
                      <div className="relative">
                        <Compass className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                        <input 
                          type="text" 
                          placeholder="e.g. A.R. Rahman, Anirudh Ravichander"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                          value={formData.musicDirector}
                          onChange={(e) => setFormData({...formData, musicDirector: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Lyricist</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                        <input 
                          type="text" 
                          placeholder="e.g. Madhan Karky, Thamarai"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                          value={formData.lyricist}
                          onChange={(e) => setFormData({...formData, lyricist: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Album Name</label>
                      <div className="relative">
                        <Disc className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                        <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                          value={formData.album}
                          onChange={(e) => setFormData({...formData, album: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Genre Category</label>
                      <div className="relative">
                        <Tag className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                        <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                          value={formData.genre}
                          onChange={(e) => setFormData({...formData, genre: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Language</label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                        <select 
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary transition-all text-white font-medium appearance-none"
                          value={formData.language}
                          onChange={(e) => setFormData({...formData, language: e.target.value})}
                        >
                          {languages.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Release Year</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-zinc-600" />
                        <input 
                          type="number" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary transition-all text-white font-medium"
                          value={formData.year}
                          onChange={(e) => setFormData({...formData, year: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-white/5">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/5 text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 btn-neon py-3 text-sm flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4 text-black" />
                      Save Metadata
                    </button>
                  </div>
                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SongManager;
