import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Music, ListMusic, Heart, Check } from 'lucide-react';
import usePlaylistStore from '../store/playlistStore';
import useLikedSongsStore from '../store/likedSongsStore';

const SongContextMenu = ({ song, x, y, onClose }) => {
  const { playlists, fetchPlaylists, addSongToPlaylist } = usePlaylistStore();
  const { toggleLike, isLiked } = useLikedSongsStore();
  const [showPlaylists, setShowPlaylists] = useState(false);
  const menuRef = useRef(null);

  const liked = isLiked(song._id);

  const handleToggleLike = async () => {
    await toggleLike(song._id);
    onClose();
  };

  useEffect(() => {
    fetchPlaylists();
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fetchPlaylists, onClose]);

  const handleAddToPlaylist = async (playlistId) => {
    await addSongToPlaylist(playlistId, song._id);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        style={{ top: y, left: x }}
        className="fixed z-[9999] w-56 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl p-1.5 overflow-visible"
      >
        <div 
          className="relative"
          onMouseEnter={() => setShowPlaylists(true)}
          onMouseLeave={() => setShowPlaylists(false)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setShowPlaylists(false);
            }
          }}
        >
          <button 
            type="button"
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={showPlaylists}
            onFocus={() => setShowPlaylists(true)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-4 h-4" />
              <span>Add to playlist</span>
            </div>
            <div className="text-[10px] text-zinc-500">▶</div>
          </button>

          {/* Submenu for playlists */}
          <AnimatePresence>
            {showPlaylists && (
              <motion.div
                role="menu"
                aria-label="Playlists"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute left-full top-0 ml-1 w-56 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl p-1.5 max-h-[300px] overflow-y-auto custom-scrollbar"
              >
                {playlists.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500 italic">No playlists created</div>
                ) : (
                  playlists.map(playlist => (
                    <button
                      key={playlist._id}
                      type="button"
                      role="menuitem"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlaylist(playlist._id);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
                    >
                      <ListMusic className="w-4 h-4 text-zinc-500" />
                      <span className="truncate">{playlist.title}</span>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          type="button"
          role="menuitem"
          onClick={handleToggleLike}
          className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Heart className={`w-4 h-4 ${liked ? 'fill-primary text-primary' : ''}`} />
            <span>{liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}</span>
          </div>
          {liked && <Check className="w-3 h-3 text-primary" />}
        </button>

        <div className="my-1 border-t border-white/5" />

        <button 
          type="button"
          role="menuitem"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          <Music className="w-4 h-4" />
          <span>Song details</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default SongContextMenu;
