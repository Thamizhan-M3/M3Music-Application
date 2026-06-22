import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import useAuthStore from '../store/authStore';
import usePlayerStore from '../store/playerStore';
import { Search as SearchIcon, Play, Music, Mic2, Disc, Radio, Layout, MoreVertical, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SongContextMenu from '../components/SongContextMenu';
import useLikedSongsStore from '../store/likedSongsStore';

const CategoryCard = ({ title, color }) => (
  <div className={`${color} aspect-square rounded-xl p-4 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-lg group`}>
    <h3 className="text-xl font-bold">{title}</h3>
    <Music className="absolute -bottom-2 -right-2 w-20 h-20 text-black/20 group-hover:scale-110 transition-transform" />
  </div>
);

const Search = () => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [artistFilter, setArtistFilter] = useState('');
  const [albumFilter, setAlbumFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, song: null });
  const { setQueue, currentSong, isPlaying } = usePlayerStore();
  const { toggleLike, isLiked } = useLikedSongsStore();
  const navigate = useNavigate();

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

  useEffect(() => {
    const search = async () => {
      const hasActiveFilters = 
        query.trim() || 
        selectedLanguage !== 'All' || 
        selectedGenre !== 'All' || 
        selectedYear !== 'All' || 
        artistFilter.trim() || 
        albumFilter.trim();

      if (!hasActiveFilters) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        let url = `/api/music/filter?search=${encodeURIComponent(query)}`;
        if (selectedLanguage !== 'All') {
          url += `&language=${encodeURIComponent(selectedLanguage)}`;
        }
        if (selectedGenre !== 'All') {
          url += `&genre=${encodeURIComponent(selectedGenre)}`;
        }
        if (selectedYear !== 'All') {
          url += `&year=${selectedYear}`;
        }
        if (artistFilter.trim()) {
          url += `&artist=${encodeURIComponent(artistFilter.trim())}`;
        }
        if (albumFilter.trim()) {
          url += `&album=${encodeURIComponent(albumFilter.trim())}`;
        }
        const res = await axiosInstance.get(url);
        setResults(res.data.songs || []);
      } catch (err) {
        console.error("Search/Filter error", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, selectedLanguage, selectedGenre, selectedYear, artistFilter, albumFilter]);

  const handlePlay = (index) => {
    setQueue(results, index);
  };

  const hasAnyFilter = selectedLanguage !== 'All' || selectedGenre !== 'All' || selectedYear !== 'All' || artistFilter || albumFilter;

  return (
    <div className="pt-4 pb-32 animate-fade-in">
      <div className="flex gap-4 items-center mb-6 max-w-2xl">
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-zinc-400 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            className="w-full bg-zinc-900/50 backdrop-blur-xl border border-white/5 text-white font-bold rounded-full py-3.5 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-xl placeholder:text-zinc-500 text-sm"
            placeholder="Search titles, singer, composer, lyricist, genre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-5 py-3 rounded-full font-bold text-xs transition-all border flex items-center gap-2 ${
            showFilters || hasAnyFilter
              ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(29,185,84,0.3)]' 
              : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
          }`}
        >
          <Radio className={`w-4 h-4 ${showFilters ? 'animate-pulse' : ''}`} />
          Filters {hasAnyFilter && "• Active"}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 border-white/5 rounded-2xl mb-8 max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Language</label>
              <select
                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary transition-all text-white font-medium appearance-none"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {['All', 'Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Japanese', 'Korean'].map(lang => (
                  <option key={lang} value={lang}>{lang === 'All' ? 'All Languages' : lang}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Genre</label>
              <select
                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary transition-all text-white font-medium appearance-none"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                {['All', 'Pop', 'Rock', 'Melody', 'Electronic', 'Jazz', 'Classical', 'Hip-Hop'].map(genreOpt => (
                  <option key={genreOpt} value={genreOpt}>{genreOpt === 'All' ? 'All Genres' : genreOpt}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Year</label>
              <select
                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary transition-all text-white font-medium appearance-none"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {['All', '2026', '2025', '2024', '2023', '2022', '2021', '2020'].map(yr => (
                  <option key={yr} value={yr}>{yr === 'All' ? 'All Years' : yr}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Artist Name</label>
              <input
                type="text"
                placeholder="Filter by artist..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary transition-all text-white"
                value={artistFilter}
                onChange={(e) => setArtistFilter(e.target.value)}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase px-1">Album Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Filter by album..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:border-primary transition-all text-white"
                  value={albumFilter}
                  onChange={(e) => setAlbumFilter(e.target.value)}
                />
                {hasAnyFilter && (
                  <button
                    onClick={() => {
                      setSelectedLanguage('All');
                      setSelectedGenre('All');
                      setSelectedYear('All');
                      setArtistFilter('');
                      setAlbumFilter('');
                    }}
                    className="px-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!query && !hasAnyFilter && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold mb-8">Browse all</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <CategoryCard title="Pop" color="bg-pink-600" />
            <CategoryCard title="Hip-Hop" color="bg-orange-600" />
            <CategoryCard title="Rock" color="bg-red-600" />
            <CategoryCard title="Electronic" color="bg-purple-600" />
            <CategoryCard title="Indie" color="bg-teal-600" />
            <CategoryCard title="Jazz" color="bg-blue-600" />
            <CategoryCard title="Classical" color="bg-zinc-600" />
            <CategoryCard title="Lo-Fi" color="bg-indigo-600" />
          </div>
        </div>
      )}

      {query && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Top Results</h2>
            {loading && <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
          </div>
          
          <div className="space-y-1">
            {results.map((song, index) => {
              const isCurrent = currentSong?._id === song._id;
              
              return (
                <div 
                  key={song._id} 
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-white/5"
                  onClick={() => handlePlay(index)}
                  onContextMenu={(e) => handleContextMenu(e, song)}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 shadow-lg relative shrink-0">
                    {song.artworkUrl || song.thumbnailUrl ? (
                      <img src={song.artworkUrl || song.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-6 h-6 text-zinc-700" />
                      </div>
                    )}
                    <div className={`absolute inset-0 bg-black/40 items-center justify-center ${isCurrent && isPlaying ? 'flex' : 'hidden group-hover:flex'}`}>
                       <Play className="w-5 h-5 fill-primary text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold truncate ${isCurrent ? 'text-primary' : 'text-white'}`}>{song.title}</div>
                    <div className="text-xs text-zinc-500 truncate font-medium flex items-center gap-1">
                      <span 
                        className="hover:underline cursor-pointer" 
                        onClick={(e) => { e.stopPropagation(); navigate(`/artist/${encodeURIComponent(song.singer || song.artist)}`); }}
                      >
                        {song.singer || song.artist}
                      </span>
                      {" • "}
                      <span 
                        className="hover:underline cursor-pointer" 
                        onClick={(e) => { e.stopPropagation(); navigate(`/album/${encodeURIComponent(song.album)}`); }}
                      >
                        {song.album || 'Single'}
                      </span>
                      {song.language && song.language !== 'Unknown' && (
                        <>
                          {" • "}
                          <span className="text-[10px] text-primary/70 font-bold">{song.language}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleLike(song._id); }}
                      className={`opacity-0 group-hover:opacity-100 transition-all hover:scale-110 ${isLiked(song._id) ? 'text-primary opacity-100' : 'text-zinc-500 hover:text-white'}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked(song._id) ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleContextMenu(e, song); }}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <div className="text-xs font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                    </div>
                  </div>
                </div>
              );
            })}
            
             {!loading && results.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <Music className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">
                  {query ? `No results found for "${query}"` : 'No results found matching your active filters'}
                </p>
                <p className="text-xs text-zinc-600 mt-1">Try adjusting your filters or search keywords.</p>
              </div>
            )}
          </div>
        </div>
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

export default Search;
