import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { Play, Music, MoreVertical, Heart } from 'lucide-react';
import usePlayerStore from '../store/playerStore';
import useLikedSongsStore from '../store/likedSongsStore';
import SongContextMenu from '../components/SongContextMenu';

const toArray = (value) => (Array.isArray(value) ? value : []);

const Home = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, song: null });
  const { setQueue, currentSong, isPlaying } = usePlayerStore();
  const { toggleLike, isLiked } = useLikedSongsStore();

  const handleContextMenu = (e, song) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      song
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, show: false });
  };

  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await axiosInstance.get('/api/music/genres');
        setGenres(['All', ...toArray(res.data)]);
      } catch (err) {
        console.error("Error fetching genres", err);
        setGenres(['All']);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      try {
        const url = selectedGenre === 'All' 
          ? '/api/music/songs' 
          : `/api/music/filter?genre=${selectedGenre}`;
        const res = await axiosInstance.get(url);
        // Handle response from /songs (array) vs /filter (object with songs property)
        setSongs(Array.isArray(res.data) ? res.data : toArray(res.data?.songs));
      } catch (error) {
        console.error("Error fetching songs", error);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, [selectedGenre]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handlePlay = (index) => {
    setQueue(safeSongs, index);
  };

  const safeSongs = toArray(songs);
  const safeGenres = toArray(genres);

  return (
    <div className="pb-32 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 neon-text">
          {getGreeting()}
        </h1>
        <p className="text-zinc-400">Welcome back to your music world.</p>
      </header>

      {/* Filter Chips */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
        {safeGenres.map(genre => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              selectedGenre === genre 
                ? 'bg-primary text-black shadow-[0_0_15px_rgba(29,185,84,0.4)]' 
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {safeSongs.slice(0, 6).map((song, i) => (
          <div
            key={song._id}
            onClick={() => handlePlay(i)}
            onContextMenu={(e) => handleContextMenu(e, song)}
            className="group glass-card h-20 flex items-center overflow-hidden transition-all duration-300 cursor-pointer hover:bg-white/10 border-white/5 hover:border-primary/30"
          >
            <div className="w-20 h-20 shrink-0 bg-zinc-800 shadow-xl overflow-hidden">
              {song.thumbnailUrl ? (
                <img src={song.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900">
                  <Music className="w-8 h-8 text-zinc-600" />
                </div>
              )}
            </div>
            <div className="px-4 font-bold truncate flex-1">{song.title}</div>
            <div className="pr-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
              <button
                onClick={(e) => { e.stopPropagation(); handleContextMenu(e, song); }}
                className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Recommended for you</h2>
          <div className="h-1 w-12 bg-primary rounded-full mt-2"></div>
        </div>
        <span className="text-sm font-bold text-zinc-500 hover:text-primary transition-colors cursor-pointer">Show all</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="w-full aspect-square bg-white/5 rounded-xl mb-4"></div>
              <div className="h-4 bg-white/5 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/5 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        safeSongs.length === 0 ? (
          <div className="glass-card p-8 text-center text-zinc-500">
            No songs available right now.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {safeSongs.map((song, index) => {
            const isCurrent = currentSong?._id === song._id;

            return (
              <motion.div
                key={song._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onContextMenu={(e) => handleContextMenu(e, song)}
                className="glass-card p-4 hover:bg-white/10 transition-all group cursor-pointer relative group border-white/5 hover:border-primary/20"
                onClick={() => handlePlay(index)}
              >
                <div className="relative mb-4">
                  <div className="aspect-square bg-zinc-900 rounded-xl overflow-hidden shadow-2xl">
                    {song.artworkUrl || song.thumbnailUrl ? (
                      <img src={song.artworkUrl || song.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                        <Music className="w-12 h-12 text-zinc-700" />
                      </div>
                    )}
                  </div>

                  {/* Play & Like Button Overlay */}
                  <div className={`absolute bottom-3 right-3 flex items-center gap-2 shadow-2xl ${isCurrent && isPlaying ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90'} group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-300 z-10`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song._id);
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isLiked(song._id) ? 'bg-primary text-black' : 'bg-black/40 text-white hover:bg-black/60'}`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked(song._id) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-110 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(index);
                      }}
                    >
                      <Play className="w-5 h-5 text-black fill-current ml-1" />
                    </button>
                  </div>

                  {/* Context Menu Trigger */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleContextMenu(e, song); }}
                      className="w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className={`font-bold truncate mb-1 text-sm ${isCurrent ? 'text-primary' : 'text-white'}`}>
                  {song.title}
                </h3>
                <p className="text-xs text-zinc-500 truncate font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="truncate max-w-[90px]">{song.singer || song.artist}</span>
                  {song.album && (
                    <>
                      <span className="text-zinc-700 text-[9px] font-bold">•</span>
                      <span className="text-[10px] text-zinc-600 truncate max-w-[80px]" title={song.album}>{song.album}</span>
                    </>
                  )}
                </p>
              </motion.div>
            );
            })}
          </div>
        )
      )}

      {contextMenu.show && (
        <SongContextMenu
          song={contextMenu.song}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default Home;
