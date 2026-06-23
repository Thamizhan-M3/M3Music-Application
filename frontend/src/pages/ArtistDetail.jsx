import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { Play, Heart, Music, MoreVertical, Disc, Shuffle } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import useLikedSongsStore from '../store/likedSongsStore';

const toArray = (value) => (Array.isArray(value) ? value : []);

const ArtistDetail = () => {
  const { name } = useParams();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setQueue, currentSong } = usePlayerStore();
  const { toggleLike, isLiked } = useLikedSongsStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtistSongs = async () => {
      try {
        const res = await axiosInstance.get(`/api/music/by-artist/${encodeURIComponent(name)}`);
        setSongs(toArray(res.data));
      } catch (err) {
        console.error('Failed to fetch artist songs', err);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArtistSongs();
  }, [name]);

  const safeSongs = toArray(songs);

  const handlePlayAll = () => {
    if (safeSongs.length > 0) {
      setQueue(safeSongs, 0);
    }
  };

  const handleToggleLike = (e, songId) => {
    e.stopPropagation();
    toggleLike(songId);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const artistImage = safeSongs.find(s => s.thumbnailUrl)?.thumbnailUrl;

  return (
    <div className="min-h-full pb-32">
      {/* Header Banner */}
      <div className="relative h-[400px] -mx-8 -mt-6 mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-black z-0" />
        {artistImage && (
          <img 
            src={artistImage} 
            alt={name} 
            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        
        <div className="relative z-20 h-full flex flex-col justify-end p-8">
          <div className="flex items-center gap-2 text-primary mb-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-black fill-current" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest">Verified Artist</span>
          </div>
          <h1 className="text-6xl sm:text-8xl font-black mb-6 tracking-tighter">{name}</h1>
          <div className="flex items-center gap-2 text-zinc-300 font-bold mb-8 ml-1">
            <span className="text-white">{safeSongs.length}</span> songs
            <span className="text-zinc-500">•</span>
            <span>{Array.from(new Set(safeSongs.map(s => s.album))).filter(Boolean).length} albums</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={handlePlayAll}
              className="w-16 h-16 bg-primary rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(29,185,84,0.3)]"
            >
              <Play className="w-8 h-8 fill-black text-black ml-1" />
            </button>
            <button 
              onClick={() => {
                const shuffled = [...safeSongs].sort(() => Math.random() - 0.5);
                setQueue(shuffled, 0);
              }}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all group border border-white/5"
            >
              <Shuffle className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
            </button>
            <button className="px-6 py-2 border border-white/20 rounded-full font-bold hover:bg-white/10 transition-colors uppercase text-sm tracking-widest">
              Follow
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <MoreVertical className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-6">Popular</h2>
          <div className="space-y-1">
            {safeSongs.length === 0 ? (
              <p className="text-sm text-zinc-500">No songs available for this artist.</p>
            ) : safeSongs.slice(0, 5).map((song, idx) => {
              const isCurrent = currentSong?._id === song._id;
              return (
                <div 
                  key={song._id}
                  onClick={() => setQueue(safeSongs, idx)}
                  className={`group flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer border border-transparent ${isCurrent ? 'bg-white/5 border-primary/10' : ''}`}
                >
                  <span className="w-4 text-center text-zinc-500 font-mono group-hover:text-white">{idx + 1}</span>
                  <div className="w-10 h-10 rounded overflow-hidden bg-zinc-800 shrink-0">
                    {song.thumbnailUrl ? (
                      <img src={song.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-zinc-700" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isCurrent ? 'text-primary' : 'text-white'}`}>{song.title}</p>
                    <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-300 transition-colors">{song.album || 'Single'}</p>
                  </div>
                  <div className="flex items-center gap-4 pr-4">
                    <button onClick={(e) => handleToggleLike(e, song._id)} className={`${isLiked(song._id) ? 'text-primary' : 'text-zinc-500 opacity-0 group-hover:opacity-100'} hover:scale-110 transition-all`}>
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
        </section>

        {/* Albums Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Discography</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from(new Set(safeSongs.map(s => s.album))).filter(Boolean).map(albumName => {
              const albumSong = safeSongs.find(s => s.album === albumName);
              return (
                <motion.div
                  key={albumName}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/album/${encodeURIComponent(albumName)}`)}
                  className="glass-card p-4 hover:bg-white/10 transition-all group cursor-pointer relative border-white/5 hover:border-primary/20"
                >
                  <div className="aspect-square rounded-xl bg-zinc-900 overflow-hidden shadow-2xl mb-4">
                    {albumSong?.thumbnailUrl ? (
                      <img src={albumSong.thumbnailUrl} alt={albumName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Disc className="w-12 h-12 text-zinc-800" /></div>
                    )}
                  </div>
                  <h3 className="font-bold truncate text-sm mb-1">{albumName}</h3>
                  <p className="text-xs text-zinc-500 truncate">Album</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

const CheckCircle = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default ArtistDetail;
