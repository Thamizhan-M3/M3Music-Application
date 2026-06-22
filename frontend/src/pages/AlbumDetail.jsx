import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { Play, Pause, Clock, Heart, Music, MoreVertical, Calendar, Shuffle } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import useLikedSongsStore from '../store/likedSongsStore';

const AlbumDetail = () => {
  const { name } = useParams();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setQueue, currentSong, isPlaying, togglePlay } = usePlayerStore();
  const { toggleLike, isLiked } = useLikedSongsStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlbumSongs = async () => {
      try {
        const res = await axiosInstance.get(`/api/music/by-album/${encodeURIComponent(name)}`);
        setSongs(res.data);
      } catch (err) {
        console.error('Failed to fetch album songs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbumSongs();
  }, [name]);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      setQueue(songs, 0);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const albumImage = songs[0]?.artworkUrl || songs[0]?.thumbnailUrl;
  const artist = songs[0]?.singer || songs[0]?.artist;
  const year = songs[0]?.year;
  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

  return (
    <div className="min-h-full pb-32">
      {/* Header */}
      <div className="relative h-[300px] -mx-8 -mt-6 mb-8 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-zinc-900 to-black z-0" />
        <div className="relative z-10 h-full flex items-end p-8 gap-8">
          <div className="w-48 h-48 sm:w-60 sm:h-60 bg-zinc-800 rounded-xl shadow-2xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-700">
            {albumImage ? (
              <img src={albumImage} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Music className="w-24 h-24 text-zinc-700" /></div>
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-2">Album</p>
            <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight text-white">{name}</h1>
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800">
                {albumImage && <img src={albumImage} alt="" className="w-full h-full object-cover" />}
              </div>
              <span className="font-bold text-white hover:underline cursor-pointer" onClick={() => navigate(`/artist/${encodeURIComponent(artist)}`)}>{artist}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300">{year || 'Unknown Year'}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300">{songs.length} songs, {Math.floor(totalDuration / 60)} min {totalDuration % 60} sec</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8 mb-8">
        <button 
          onClick={handlePlayAll}
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
        <button className="text-zinc-400 hover:text-white transition-colors">
          <Heart className="w-8 h-8" />
        </button>
        <button className="text-zinc-400 hover:text-white transition-colors">
          <MoreVertical className="w-6 h-6" />
        </button>
      </div>

      {/* Track List */}
      <div className="w-full">
        <div className="grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-2 border-b border-white/5 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
          <div className="flex justify-center">#</div>
          <div>Title</div>
          <div className="hidden md:block">Artist</div>
          <div className="flex justify-end pr-8"><Clock className="w-4 h-4" /></div>
        </div>

        <div className="space-y-1">
          {songs.map((song, index) => {
            const isCurrent = currentSong?._id === song._id;
            return (
              <div 
                key={song._id}
                onClick={() => setQueue(songs, index)}
                className={`grid grid-cols-[16px_4fr_3fr_minmax(120px,1fr)] gap-4 px-4 py-3 rounded-lg group hover:bg-white/5 transition-all cursor-pointer items-center border border-transparent ${isCurrent ? 'bg-white/5 border-primary/10' : ''}`}
              >
                <div className="flex justify-center text-sm font-medium text-zinc-500">
                  {isCurrent && isPlaying ? (
                    <div className="flex items-end gap-0.5 h-3">
                      <div className="w-0.5 bg-primary animate-bounce h-full" style={{ animationDelay: '0ms' }} />
                      <div className="w-0.5 bg-primary animate-bounce h-2/3" style={{ animationDelay: '100ms' }} />
                      <div className="w-0.5 bg-primary animate-bounce h-full" style={{ animationDelay: '200ms' }} />
                    </div>
                  ) : (
                    <span className={isCurrent ? 'text-primary' : ''}>{index + 1}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className={`font-bold truncate ${isCurrent ? 'text-primary' : 'text-white'}`}>{song.title}</p>
                </div>

                <div className="hidden md:block truncate text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  {song.singer || song.artist}
                </div>

                <div className="flex items-center justify-end gap-6 pr-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(song._id); }}
                    className={`${isLiked(song._id) ? 'text-primary' : 'text-zinc-500 opacity-0 group-hover:opacity-100'} hover:scale-110 transition-all`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked(song._id) ? 'fill-current' : ''}`} />
                  </button>
                  <span className="text-xs font-mono text-zinc-500 tabular-nums">
                    {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AlbumDetail;
