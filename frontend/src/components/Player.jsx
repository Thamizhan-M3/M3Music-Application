import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Repeat1, Heart, Music } from 'lucide-react';
import usePlayerStore from '../store/playerStore';

import useLikedSongsStore from '../store/likedSongsStore';

const formatTime = (time) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const HeartButton = ({ songId, className }) => {
  const { toggleLike, isLiked } = useLikedSongsStore();
  const liked = isLiked(songId);

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        toggleLike(songId);
      }} 
      className={`${className} ${liked ? 'text-primary' : 'text-zinc-500 hover:text-white'} transition-colors hover:scale-110 active:scale-90`}
    >
      <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
    </button>
  );
};

const Player = () => {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    shuffle,
    repeat,
    playPause,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleEnded = () => {
    nextTrack();
  };

  if (!currentSong) {
    return (
      <div className="h-[90px] bg-black border-t border-white/5 px-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50">
        <div className="flex-1"></div>
        <div className="flex-1 flex flex-col items-center justify-center opacity-30">
          <div className="flex items-center gap-6 mb-2">
            <Shuffle className="w-4 h-4" />
            <SkipBack className="w-5 h-5 fill-current" />
            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
              <Play className="w-4 h-4 text-zinc-600 fill-current ml-1" />
            </div>
            <SkipForward className="w-5 h-5 fill-current" />
            <Repeat className="w-4 h-4" />
          </div>
          <div className="w-full max-w-md bg-white/5 h-1 rounded-full"></div>
        </div>
        <div className="flex-1"></div>
      </div>
    );
  }

  return (
    <div className="h-[90px] bg-black border-t border-white/5 px-2 md:px-6 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50">
      <audio
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Track Info */}
      <div className="flex-1 flex items-center gap-4 min-w-0">
        <div className="relative group shrink-0">
          <div className="w-14 h-14 rounded-lg overflow-hidden shadow-2xl border border-white/5">
            {currentSong.artworkUrl || currentSong.thumbnailUrl ? (
               <img src={currentSong.artworkUrl || currentSong.thumbnailUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
               <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                 <Music className="w-6 h-6 text-zinc-600" />
               </div>
            )}
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <h4 className="text-sm font-bold text-white hover:text-primary transition-colors cursor-pointer truncate">
            {currentSong.title}
          </h4>
          <p className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer truncate font-medium flex items-center gap-1.5">
            <span>{currentSong.singer || currentSong.artist}</span>
            {currentSong.album && (
              <>
                <span className="text-zinc-600 text-[9px] font-bold">•</span>
                <span className="text-[10px] text-zinc-500 truncate" title={`${currentSong.album} (${currentSong.year || 'N/A'})`}>
                  {currentSong.album}
                </span>
              </>
            )}
          </p>
        </div>
        <HeartButton songId={currentSong._id} className="ml-2" />
      </div>

      {/* Player Controls */}
      <div className="flex-[2] max-w-[600px] flex flex-col items-center">
        <div className="flex items-center gap-4 md:gap-7 mb-2">
          <button onClick={toggleShuffle} className={`transition-all ${shuffle ? 'text-primary drop-shadow-[0_0_8px_var(--primary-glow)]' : 'text-zinc-500 hover:text-white'}`}>
            <Shuffle className="w-4 h-4" />
          </button>
          <button onClick={prevTrack} className="text-zinc-400 hover:text-white transition-colors">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button 
            onClick={playPause}
            className="w-10 h-10 rounded-full bg-white hover:scale-110 flex items-center justify-center transition-all shadow-lg active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-black fill-current" />
            ) : (
              <Play className="w-5 h-5 text-black fill-current ml-1" />
            )}
          </button>
          <button onClick={nextTrack} className="text-zinc-400 hover:text-white transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button onClick={toggleRepeat} className={`transition-all ${repeat !== 'off' ? 'text-primary drop-shadow-[0_0_8px_var(--primary-glow)]' : 'text-zinc-500 hover:text-white'}`}>
            {repeat === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-3 group">
          <span className="text-[10px] font-mono text-zinc-500 min-w-[35px] text-right">{formatTime(progress)}</span>
          <div className="flex-1 relative flex items-center h-4 group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer z-10 accent-primary"
              style={{
                background: `linear-gradient(to right, var(--primary) ${(progress / duration) * 100}%, #27272a ${(progress / duration) * 100}%)`
              }}
            />
            <div 
              className="absolute h-1 bg-primary rounded-full shadow-[0_0_10px_var(--primary-glow)] pointer-events-none transition-all"
              style={{ width: `${(progress / duration) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 min-w-[35px]">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume Controls */}
      <div className="flex-1 flex justify-end items-center gap-3 pr-2 group hidden sm:flex">
        <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
          {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <div className="w-24 relative flex items-center h-4">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer z-10 accent-white"
            style={{
              background: `linear-gradient(to right, #fff ${(isMuted ? 0 : volume) * 100}%, #27272a ${(isMuted ? 0 : volume) * 100}%)`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Player;
