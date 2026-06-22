import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { Play, Pause, Clock, Heart, Music, Tag, Search, MoreVertical, Shuffle } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import useLikedSongsStore from '../store/likedSongsStore';

const GenreDetail = () => {
  const { genre } = useParams();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setQueue, currentSong, isPlaying } = usePlayerStore();
  const { toggleLike, isLiked } = useLikedSongsStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGenreSongs = async () => {
      try {
        const res = await axiosInstance.get(`/api/music/by-genre/${encodeURIComponent(genre)}`);
        setSongs(res.data);
      } catch (err) {
        console.error('Failed to fetch genre songs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGenreSongs();
  }, [genre]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-full pb-32">
      {/* Header */}
      <div className="relative h-[250px] -mx-8 -mt-6 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black z-0" />
        <div className="absolute inset-0 bg-primary/10 opacity-50 blur-3xl z-10" />
        <div className="relative z-20 h-full flex flex-col justify-end p-8">
          <div className="flex items-center gap-2 text-primary mb-4">
            <Tag className="w-6 h-6" />
            <span className="text-sm font-bold uppercase tracking-widest">Genre</span>
          </div>
          <h1 className="text-6xl sm:text-8xl font-black mb-0 tracking-tighter capitalize">{genre}</h1>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setQueue(songs, 0)}
            className="w-14 h-14 bg-primary rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(29,185,84,0.3)]"
          >
            <Play className="w-6 h-6 fill-black text-black ml-1" />
          </button>
          <button 
            onClick={() => {
              const shuffled = [...songs].sort(() => Math.random() - 0.5);
              setQueue(shuffled, 0);
            }}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all group border border-white/5"
          >
            <Shuffle className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
          </button>
          <div className="text-sm font-medium text-zinc-400 ml-2">
            <span className="text-white font-bold">{songs.length}</span> songs in this collection
          </div>
        </div>
      </div>

      {/* Grid of Songs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {songs.map((song, index) => {
          const isCurrent = currentSong?._id === song._id;
          return (
            <motion.div
              key={song._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setQueue(songs, index)}
              className={`glass-card p-4 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group border border-transparent ${isCurrent ? 'bg-white/5 border-primary/10' : ''}`}
            >
              <div className="w-12 h-12 rounded-lg bg-zinc-800 shrink-0 overflow-hidden shadow-lg relative">
                {song.artworkUrl || song.thumbnailUrl ? (
                  <img src={song.artworkUrl || song.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Music className="w-6 h-6 text-zinc-700" /></div>
                )}
                {isCurrent && isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary fill-current" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate text-sm ${isCurrent ? 'text-primary' : 'text-white'}`}>{song.title}</p>
                <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-300 transition-colors">{song.singer || song.artist}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleLike(song._id); }}
                  className={`${isLiked(song._id) ? 'text-primary' : 'text-zinc-500 opacity-0 group-hover:opacity-100'} hover:scale-110 transition-all`}
                >
                  <Heart className={`w-4 h-4 ${isLiked(song._id) ? 'fill-current' : ''}`} />
                </button>
                <button className="text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GenreDetail;
