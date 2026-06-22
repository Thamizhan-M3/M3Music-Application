import {
  Home,
  Search,
  Library,
  PlusSquare,
  Heart,
  Users,
  LayoutDashboard,
  Music,
  LogOut,
  ArrowLeftRight,
  Compass,
} from 'lucide-react';

import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

import useAuthStore from '../store/authStore';
import usePlaylistStore from '../store/playlistStore';
import useLikedSongsStore from '../store/likedSongsStore';

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    end={to === '/admin' || to === '/'}
    className={({ isActive }) =>
      `flex items-center gap-4 px-4 py-3 text-sm font-semibold rounded-md transition-all duration-200 ${
        isActive
          ? 'text-white bg-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]'
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
      }`
    }
  >
    <Icon className="w-5 h-5" />
    <span className="truncate">{label}</span>
  </NavLink>
);

const Sidebar = ({ isAdmin = false }) => {
  const { user, logout } = useAuthStore();

  const {
    playlists,
    fetchPlaylists,
    createPlaylist,
  } = usePlaylistStore();

  const { fetchLikedSongs } = useLikedSongsStore();

  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isAdmin) {
      fetchPlaylists();
      fetchLikedSongs();
    }
  }, [user, isAdmin, fetchPlaylists, fetchLikedSongs]);

  const handleCreatePlaylist = async () => {
    const playlist = await createPlaylist({
      title: `My Playlist #${playlists.length + 1}`,
    });

    if (playlist) {
      navigate(`/playlist/${playlist._id}`);
    }
  };

  return (
    <motion.div
      initial={{ x: -260, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-black flex flex-col pt-6 pb-4 border-r border-white/5 h-full overflow-hidden"
    >
      {/* Logo Section */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-[0_0_20px_var(--primary-glow)] bg-white/5 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="M3 Music Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <span className="text-xl font-bold tracking-tight neon-text">
          {/* M3 Music{' '} */}
          {isAdmin && (
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded ml-1 text-zinc-400">
              ADMIN
            </span>
          )}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3 mb-6">
        {!isAdmin ? (
          <>
            <SidebarItem to="/" icon={Home} label="Home" />
            <SidebarItem to="/search" icon={Search} label="Search" />
            <SidebarItem to="/explore" icon={Compass} label="Explore" />
            <SidebarItem to="/library" icon={Library} label="Your Library" />

            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className="flex items-center gap-4 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 rounded-md transition-all mt-4 border border-primary/20"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Admin Dashboard</span>
              </NavLink>
            )}
          </>
        ) : (
          <>
            <SidebarItem
              to="/admin"
              icon={LayoutDashboard}
              label="Dashboard"
            />

            <SidebarItem
              to="/admin/songs"
              icon={Music}
              label="Manage Songs"
            />

            <SidebarItem
              to="/admin/users"
              icon={Users}
              label="Manage Users"
            />

            <SidebarItem
              to="/admin/upload"
              icon={PlusSquare}
              label="Upload Music"
            />

            <NavLink
              to="/"
              className="flex items-center gap-4 px-4 py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-all mt-4 border border-white/5"
            >
              <ArrowLeftRight className="w-5 h-5" />
              <span>Switch to User App</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Playlist Section */}
      {!isAdmin && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-6 mb-4">
            <h3 className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase mb-4">
              Playlists
            </h3>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleCreatePlaylist}
                className="flex items-center gap-3 text-sm font-semibold text-zinc-400 hover:text-white transition-all group"
              >
                <div className="w-8 h-8 bg-zinc-800 group-hover:bg-zinc-700 transition-colors rounded flex items-center justify-center text-zinc-400 group-hover:text-white">
                  <PlusSquare className="w-4 h-4" />
                </div>

                Create Playlist
              </button>

              <SidebarItem
                to="/collection/tracks"
                icon={Heart}
                label="Liked Songs"
              />
            </div>
          </div>

          {/* Playlist List */}
          <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
            <div className="space-y-1">
              {playlists.map((playlist) => (
                <NavLink
                  key={playlist._id}
                  to={`/playlist/${playlist._id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all group ${
                      isActive
                        ? 'text-white bg-white/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <div className="w-8 h-8 rounded bg-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {playlist.coverImage ? (
                      <img
                        src={playlist.coverImage}
                        alt={playlist.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>

                  <div className="flex-1 truncate">
                    <div className="truncate">{playlist.title}</div>

                    <div className="text-[10px] text-zinc-500 truncate">
                      Playlist • {playlist.totalSongs || 0} songs
                    </div>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="mt-auto px-3 pt-4 border-t border-white/5">
        <button
          onClick={logout}
          className="flex items-center gap-4 px-4 py-3 text-sm font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-500/5 w-full rounded-md transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;