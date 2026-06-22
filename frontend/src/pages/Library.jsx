import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePlaylistStore from '../store/playlistStore';
import useLikedSongsStore from '../store/likedSongsStore';
import { Heart, ListMusic, Play, Plus, Disc, MoreHorizontal } from 'lucide-react';

const PlaylistCard = ({ title, songCount, type = 'normal', onClick }) => (
  <div 
    onClick={onClick}
    className="glass-card group p-5 hover:bg-white/10 transition-all cursor-pointer border-white/5 hover:border-primary/20 relative"
  >
    <div className={`aspect-square rounded-xl mb-4 flex items-center justify-center shadow-2xl relative overflow-hidden ${type === 'liked' ? 'bg-gradient-to-br from-indigo-600 to-purple-400' : 'bg-zinc-800'}`}>
      {type === 'liked' ? <Heart className="w-12 h-12 text-white fill-current" /> : <ListMusic className="w-12 h-12 text-zinc-700" />}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          <Play className="w-6 h-6 text-black fill-current ml-1" />
        </div>
      </div>
    </div>
    <h3 className="font-bold truncate text-white">{title}</h3>
    <p className="text-xs text-zinc-500 mt-1 font-medium">{songCount} songs</p>
  </div>
);

const Library = () => {
  const { playlists, fetchPlaylists, loading } = usePlaylistStore();
  const { likedSongs, fetchLikedSongs } = useLikedSongsStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlaylists();
    fetchLikedSongs();
  }, [fetchPlaylists, fetchLikedSongs]);

  return (
    <div className="pt-4 pb-32 animate-fade-in">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Your Library</h1>
          <div className="h-1 w-16 bg-primary rounded-full"></div>
        </div>
        <button className="btn-neon flex items-center gap-2 py-2">
          <Plus className="w-5 h-5" />
          New Playlist
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <PlaylistCard 
          title="Liked Songs" 
          songCount={likedSongs.length} 
          type="liked" 
          onClick={() => navigate('/collection/tracks')}
        />

        {playlists.map(p => (
          <PlaylistCard 
            key={p._id} 
            title={p.title} 
            songCount={p.songs.length} 
            onClick={() => navigate(`/playlist/${p._id}`)}
          />
        ))}

        {loading && [1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card p-5 animate-pulse">
            <div className="aspect-square bg-white/5 rounded-xl mb-4"></div>
            <div className="h-4 bg-white/5 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8">Recently Played</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-white/5">
              <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 shadow-lg">
                <Disc className="w-8 h-8 text-zinc-700" />
              </div>
              <div>
                <p className="font-bold text-white">Song Title {i}</p>
                <p className="text-xs text-zinc-500 font-medium">Artist Name</p>
              </div>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity pr-4">
                <MoreHorizontal className="w-5 h-5 text-zinc-500 hover:text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Library;
