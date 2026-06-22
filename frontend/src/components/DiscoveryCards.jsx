import React from 'react';
import { motion } from 'framer-motion';
import { Play, Music, User, Disc, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ArtistCard = ({ name, image }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={() => navigate(`/artist/${encodeURIComponent(name)}`)}
      className="glass-card p-4 hover:bg-white/10 transition-all group cursor-pointer relative border-white/5 hover:border-primary/20"
    >
      <div className="relative mb-4">
        <div className="aspect-square rounded-full bg-zinc-900 overflow-hidden shadow-2xl border border-white/5">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <User className="w-12 h-12 text-zinc-700" />
            </div>
          )}
        </div>
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-black fill-current ml-1" />
          </div>
        </div>
      </div>
      <h3 className="font-bold truncate text-sm text-center">{name}</h3>
      <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest mt-1">Artist</p>
    </motion.div>
  );
};

export const AlbumCard = ({ name, artist, image }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={() => navigate(`/album/${encodeURIComponent(name)}`)}
      className="glass-card p-4 hover:bg-white/10 transition-all group cursor-pointer relative border-white/5 hover:border-primary/20"
    >
      <div className="relative mb-4">
        <div className="aspect-square rounded-xl bg-zinc-900 overflow-hidden shadow-2xl border border-white/5">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <Disc className="w-12 h-12 text-zinc-700" />
            </div>
          )}
        </div>
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-black fill-current ml-1" />
          </div>
        </div>
      </div>
      <h3 className="font-bold truncate text-sm">{name}</h3>
      <p className="text-xs text-zinc-500 truncate mt-1">{artist}</p>
    </motion.div>
  );
};

export const GenreCard = ({ name, colorIndex = 0 }) => {
  const navigate = useNavigate();
  const colors = [
    'from-purple-600 to-blue-500',
    'from-pink-600 to-orange-500',
    'from-emerald-600 to-teal-500',
    'from-blue-600 to-indigo-500',
    'from-red-600 to-yellow-500',
    'from-cyan-600 to-blue-500'
  ];
  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: 1 }}
      onClick={() => navigate(`/genre/${encodeURIComponent(name)}`)}
      className={`h-28 rounded-2xl p-5 cursor-pointer relative overflow-hidden shadow-xl group bg-gradient-to-br ${colors[colorIndex % colors.length]}`}
    >
      <h3 className="text-xl font-black text-white z-10 relative capitalize tracking-tight">{name}</h3>
      <Tag className="absolute -bottom-4 -right-4 w-20 h-20 text-white/20 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
    </motion.div>
  );
};
