import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Clock, Heart, Music, Search, MoreVertical, Trash2 } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import useLikedSongsStore from '../store/likedSongsStore';
import useAuthStore from '../store/authStore';

const LikedSongs = () => {
  const { likedSongs, fetchLikedSongs, toggleLike, loading } = useLikedSongsStore();
  const { setQueue, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLikedSongs();
  }, [fetchLikedSongs]);

  const filteredSongs = likedSongs.filter(song => 
    song.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.singer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayLiked = (index) => {
    setQueue(filteredSongs, index);
  };

  const handleToggleLike = async (e, songId) => {
    e.stopPropagation();
    await toggleLike(songId);
  };

  return (
    <div className="min-h-full pb-20">
      {/* Header */}
      <div className="relative h-[300px] -mx-8 -mt-6 mb-8 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-indigo-900/80 to-black z-0" />
        <div className="relative z-10 h-full flex items-end p-8 gap-8">
          <div className="w-48 h-48 sm:w-60 sm:h-60 bg-gradient-to-br from-indigo-600 to-purple-400 rounded-xl shadow-2xl flex items-center justify-center shrink-0">
            <Heart className="w-24 h-24 text-white fill-current animate-pulse" />
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm font-bold uppercase tracking-wider text-indigo-300 mb-2">Playlist</p>
            <h1 className="text-5xl sm:text-7xl font-black mb-6 tracking-tight">Liked Songs</h1>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <span className="font-bold text-white uppercase">{useAuthStore.getState().user?.username}</span>
              <span className="text-zinc-500">•</span>
              <span>{likedSongs.length} songs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 mb-8">
        <button 
          onClick={() => handlePlayLiked(0)}
          className="w-14 h-14 bg-primary rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(29,185,84,0.3)]"
        >
          <Play className="w-6 h-6 fill-black text-black ml-1" />
        </button>
        
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          <input 
            type="text"
            placeholder="Search in liked songs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-transparent focus:border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="w-full">
        <div className="grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 border-b border-white/5 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
          <div className="flex justify-center">#</div>
          <div>Title</div>
          <div className="hidden md:block">Album</div>
          <div className="flex justify-end pr-8"><Clock className="w-4 h-4" /></div>
        </div>

        <div className="space-y-1">
          {filteredSongs.map((song, index) => {
            const isCurrent = currentSong?._id === song._id;
            return (
              <motion.div 
                key={song._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handlePlayLiked(index)}
                className={`grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-3 rounded-lg group hover:bg-white/5 transition-all cursor-pointer items-center border border-transparent ${isCurrent ? 'bg-white/5 border-primary/10' : ''}`}
              >
                <div className="flex justify-center text-sm font-medium text-zinc-500 group-hover:hidden">
                  {isCurrent && isPlaying ? (
                    <div className="flex items-end gap-0.5 h-3">
                      <div className="w-0.5 bg-primary animate-bounce h-full" style={{ animationDelay: '0ms' }} />
                      <div className="w-0.5 bg-primary animate-bounce h-2/3" style={{ animationDelay: '100ms' }} />
                      <div className="w-0.5 bg-primary animate-bounce h-full" style={{ animationDelay: '200ms' }} />
                    </div>
                  ) : (
                    <span className={isCurrent ? 'text-primary font-bold' : ''}>{index + 1}</span>
                  )}
                </div>
                <div className="hidden group-hover:flex justify-center">
                  {isCurrent && isPlaying ? <Pause className="w-4 h-4 fill-primary text-primary" /> : <Play className="w-4 h-4 fill-white text-white" />}
                </div>

                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded overflow-hidden bg-zinc-800 shrink-0 shadow-lg">
                    {song.artworkUrl || song.thumbnailUrl ? (
                      <img src={song.artworkUrl || song.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-zinc-700" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold truncate ${isCurrent ? 'text-primary' : 'text-white'}`}>{song.title}</p>
                    <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-300 transition-colors">{song.singer || song.artist}</p>
                  </div>
                </div>

                <div className="hidden md:block truncate text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  {song.album || 'Single'}
                </div>

                <div className="flex items-center justify-end gap-6 pr-4">
                  <button 
                    onClick={(e) => handleToggleLike(e, song._id)}
                    className="text-primary hover:scale-110 transition-transform"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                  <span className="text-xs font-mono text-zinc-500 tabular-nums">
                    {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                  </span>
                  <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {filteredSongs.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
               <Heart className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">No liked songs yet</h3>
            <p className="text-zinc-500 max-w-xs">Tap the heart icon on any track to save it to your library.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LikedSongs;
