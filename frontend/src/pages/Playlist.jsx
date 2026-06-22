import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Clock, MoreVertical, Trash2, Edit2, Music, Heart, Plus, Search } from 'lucide-react';
import usePlaylistStore from '../store/playlistStore';
import usePlayerStore from '../store/playerStore';

const PlaylistPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentPlaylist, fetchPlaylistById, removeSongFromPlaylist, updatePlaylist, deletePlaylist, reorderSongs } = usePlaylistStore();
  const { currentSong, isPlaying, playPlaylist, togglePlay } = usePlayerStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPlaylistById(id);
  }, [id, fetchPlaylistById]);

  useEffect(() => {
    if (currentPlaylist) {
      setEditTitle(currentPlaylist.title);
      setEditDesc(currentPlaylist.description || '');
    }
  }, [currentPlaylist]);

  if (!currentPlaylist) return <div className="p-8 text-zinc-400">Loading...</div>;

  const handlePlay = () => {
    if (currentPlaylist.songs.length === 0) return;
    playPlaylist(currentPlaylist.songs, 0);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updatePlaylist(id, { title: editTitle, description: editDesc });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      await deletePlaylist(id);
      navigate('/');
    }
  };

  const filteredSongs = currentPlaylist.songs.filter(song => 
    song.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.singer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="relative p-8 pb-6 flex items-end gap-8 bg-gradient-to-b from-primary/20 to-black/40 min-h-[340px]">
        <div className="w-60 h-60 bg-zinc-800 rounded-lg shadow-2xl flex-shrink-0 flex items-center justify-center overflow-hidden group relative">
          {currentPlaylist.coverImage ? (
            <img src={currentPlaylist.coverImage} alt={currentPlaylist.title} className="w-full h-full object-cover" />
          ) : (
            <Music className="w-24 h-24 text-zinc-600" />
          )}
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
          >
            <Edit2 className="w-10 h-10 text-white" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Playlist</span>
          <h1 
            className="text-7xl font-black tracking-tighter mb-4 cursor-pointer hover:text-primary transition-colors"
            onClick={() => setIsEditing(true)}
          >
            {currentPlaylist.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
            <span className="text-white font-bold">M3 Music User</span>
            <span>•</span>
            <span>{currentPlaylist.totalSongs} songs, about {Math.round(currentPlaylist.totalDuration / 60)} min</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-8 flex items-center gap-6">
        <button 
          onClick={handlePlay}
          disabled={currentPlaylist.songs.length === 0}
          className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-black hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          <Play className="w-6 h-6 fill-black" />
        </button>

        <button 
          onClick={() => updatePlaylist(id, { liked: !currentPlaylist.liked })}
          className={`transition-colors ${currentPlaylist.liked ? 'text-primary' : 'text-zinc-400 hover:text-white'}`}
        >
          <Heart className={`w-8 h-8 ${currentPlaylist.liked ? 'fill-primary' : ''}`} />
        </button>

        <button 
          onClick={handleDelete}
          className="text-zinc-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-6 h-6" />
        </button>

        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text"
            placeholder="Search in playlist"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 w-64 transition-all"
          />
        </div>
      </div>

      {/* Songs Table */}
      <div className="px-8 pb-10">
        <div className="grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 border-b border-white/10 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
          <div>#</div>
          <div>Title</div>
          <div>Album</div>
          <div className="flex justify-end"><Clock className="w-4 h-4" /></div>
        </div>

        <div className="flex flex-col gap-1">
          {filteredSongs.map((song, index) => (
            <motion.div 
              key={song._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('index', index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const startIndex = parseInt(e.dataTransfer.getData('index'));
                if (startIndex !== index) {
                  reorderSongs(id, startIndex, index);
                }
              }}
              className="grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 rounded-md hover:bg-white/5 transition-colors group items-center cursor-grab active:cursor-grabbing"
            >
              <div className="text-sm text-zinc-500 flex items-center justify-center">
                {currentSong?._id === song._id && isPlaying ? (
                  <div className="w-3 h-3 bg-primary animate-pulse rounded-full" />
                ) : (
                  <span className="group-hover:hidden">{index + 1}</span>
                )}
                <button 
                  onClick={() => playPlaylist(currentPlaylist.songs, index)}
                  className="hidden group-hover:block"
                >
                  <Play className="w-3 h-3 fill-white" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded overflow-hidden">
                  {(song.artworkUrl || song.thumbnailUrl) && <img src={song.artworkUrl || song.thumbnailUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex flex-col truncate">
                  <span className={`text-sm font-medium truncate ${currentSong?._id === song._id ? 'text-primary' : 'text-white'}`}>
                    {song.title}
                  </span>
                  <span className="text-xs text-zinc-400 truncate">{song.singer || song.artist}</span>
                </div>
              </div>

              <div className="text-sm text-zinc-400 truncate">{song.album}</div>

              <div className="flex items-center justify-end gap-4 text-zinc-400">
                <button 
                  onClick={() => removeSongFromPlaylist(id, song._id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <span className="text-sm">{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredSongs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
            <Music className="w-16 h-16 opacity-20" />
            <p>{searchQuery ? 'No songs match your search' : 'This playlist is empty'}</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Edit Details</h2>
              <form onSubmit={handleUpdate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Title</label>
                  <input 
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                  <textarea 
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-primary min-h-[100px] resize-none"
                    placeholder="Add an optional description"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-white text-black px-8 py-2 rounded-full font-bold text-sm hover:scale-105 transition-all"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlaylistPage;
