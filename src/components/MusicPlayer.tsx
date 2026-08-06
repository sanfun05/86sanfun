import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipForward, SkipBack, ListMusic, Volume2, VolumeX, 
  Disc, ChevronLeft, ChevronRight, X, Music, Sparkles, RefreshCw 
} from 'lucide-react';
import { MusicTrackInfo } from '../types';
import { audioManager } from '../utils/audioManager';

interface MusicPlayerProps {
  customPlaylist?: MusicTrackInfo[];
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ customPlaylist }) => {
  // Playlist State
  const [playlist, setPlaylist] = useState<MusicTrackInfo[]>([
    {
      id: "track-1",
      title: "凌晨三点的多愁",
      artist: "你永远在我心里",
      cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
      audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
      platform: "custom"
    },
    {
      id: "track-2",
      title: "星空下的舒缓 Lofi",
      artist: "Chill Hop Sound",
      cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200",
      audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-abstract-intention-12099.mp3",
      platform: "custom"
    },
    {
      id: "track-3",
      title: "雨夜编码与思考",
      artist: "Sanfun Ambient Beats",
      cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=200",
      audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a7321d.mp3?filename=ambient-piano-10786.mp3",
      platform: "custom"
    },
    {
      id: "track-4",
      title: "晴空 Melody",
      artist: "网易云精选",
      cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=200",
      audioUrl: "https://music.163.com/song/media/outer/url?id=186016.mp3",
      platform: "163",
      platformId: "186016"
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed/Closed pill by default
  const [showPlaylist, setShowPlaylist] = useState(false); // Playlist modal toggled by clicking circular cover
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioError, setAudioError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Register with global AudioManager for priority synchronization
  useEffect(() => {
    audioManager.register({
      id: 'bg-music-player',
      priority: 'BACKGROUND',
      onPauseByManager: () => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      },
      onResumeByManager: () => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.warn("Auto resume bg music failed:", err);
              setIsPlaying(false);
            });
        }
      }
    });

    return () => {
      audioManager.unregister('bg-music-player');
    };
  }, []);

  // Fetch playlist from server on mount
  useEffect(() => {
    fetch('/api/music/playlist')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPlaylist(data);
        }
      })
      .catch(() => {});
  }, []);

  const currentTrack = playlist[currentIndex] || playlist[0] || {
    title: 'Sanfun 默认音轨',
    artist: '三疯',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200',
    audioUrl: ''
  };

  // Toggle play/pause
  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioManager.notifyPaused('bg-music-player');
    } else {
      audioManager.requestPlay('bg-music-player', 'BACKGROUND');
      setAudioError(false);
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio play blocked or failed:", err);
          setIsPlaying(false);
          setAudioError(true);
        });
    }
  };

  // Handle song selection from playlist
  const handleSelectTrack = (index: number) => {
    setCurrentIndex(index);
    setAudioError(false);
    setIsPlaying(true);
    
    // Auto-collapse animation back to compact pill shape after choosing song
    setIsExpanded(false);
    setShowPlaylist(false);

    audioManager.requestPlay('bg-music-player', 'BACKGROUND');

    if (audioRef.current) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {
            setIsPlaying(false);
          });
        }
      }, 100);
    }
  };

  const handlePrevTrack = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    handleSelectTrack(prevIdx);
  };

  const handleNextTrack = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextIdx = (currentIndex + 1) % playlist.length;
    handleSelectTrack(nextIdx);
  };

  // Toggle Cover click: opens/closes playlist popover
  const handleCoverClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPlaylist(prev => !prev);
  };

  // Click on pill body: expands/collapses the pill horizontally
  const handlePillClick = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <>
      {/* Hidden audio element persistent across SPA routes */}
      <audio
        id="bg-music-audio-element"
        ref={audioRef}
        src={currentTrack.audioUrl}
        preload="metadata"
        muted={isMuted}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => handleNextTrack()}
        onError={() => setAudioError(true)}
      />

      {/* Floating Bottom Left Music Player Container */}
      <div className="fixed bottom-5 left-5 z-50 select-none">
        
        {/* Floating Playlist Popover (Opens when clicking circular cover) */}
        <AnimatePresence>
          {showPlaylist && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 left-0 w-72 sm:w-80 bg-zinc-900/95 dark:bg-zinc-950/95 backdrop-blur-2xl text-white rounded-2xl p-4 border border-white/15 shadow-2xl space-y-3 z-50 mb-2"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-zinc-100">歌单列表 ({playlist.length}首)</span>
                </div>
                <button
                  onClick={() => setShowPlaylist(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tracks List */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
                {playlist.map((item, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => handleSelectTrack(idx)}
                      className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-r from-rose-500/20 to-indigo-500/20 border border-rose-500/40 text-white font-bold'
                          : 'hover:bg-white/10 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Round Thumbnail */}
                        <div className="relative shrink-0">
                          <img
                            src={item.cover}
                            alt={item.title}
                            className={`w-8 h-8 rounded-full object-cover ring-1 ${
                              isCurrent ? 'ring-rose-400' : 'ring-white/20'
                            }`}
                          />
                          {isCurrent && isPlaying && (
                            <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-xs font-bold truncate text-zinc-100 flex items-center gap-1.5">
                            <span>{item.title}</span>
                            {item.platform === '163' && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40 font-mono">
                                网易云
                              </span>
                            )}
                            {item.platform === 'qq' && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono">
                                QQ音乐
                              </span>
                            )}
                          </h5>
                          <p className="text-[10px] text-zinc-400 truncate">{item.artist}</p>
                        </div>
                      </div>

                      {/* Playing Indicator Icon */}
                      <div className="shrink-0 pl-1">
                        {isCurrent ? (
                          isPlaying ? (
                            <span className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 h-full bg-rose-400 animate-pulse" />
                              <span className="w-0.5 h-2/3 bg-rose-400 animate-pulse delay-75" />
                              <span className="w-0.5 h-1/2 bg-rose-400 animate-pulse delay-150" />
                            </span>
                          ) : (
                            <Pause className="w-3.5 h-3.5 text-rose-400" />
                          )
                        ) : (
                          <Play className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-zinc-400 text-center pt-1 border-t border-white/10 flex items-center justify-between px-1">
                <span>点击歌曲立即切换并收起歌单</span>
                <span className="text-rose-400 font-bold">可在后台解析添加歌曲</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Pill-Shaped Player Widget with Smooth Width Animation */}
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          onClick={handlePillClick}
          className={`group bg-zinc-900/90 dark:bg-zinc-950/90 text-white backdrop-blur-2xl rounded-full border border-white/20 shadow-2xl flex items-center p-1.5 transition-shadow hover:border-white/30 cursor-pointer ${
            isExpanded ? 'pr-3' : 'pr-2'
          }`}
        >
          {/* Circular Album Cover ("歌曲封面图标是圆形", "只显示短的圆形歌曲封面") */}
          <div 
            onClick={handleCoverClick} 
            className="relative shrink-0 group/cover cursor-pointer"
            title="点击查看歌单列表"
          >
            <img
              src={currentTrack.cover}
              alt={currentTrack.title}
              className={`w-9 h-9 rounded-full object-cover ring-2 ring-white/20 transition-transform group-hover/cover:scale-105 ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '8s' }}
            />
            
            {/* Hover overlay on circular cover */}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity">
              <ListMusic className="w-4 h-4 text-white" />
            </div>

            {/* Online/Playing Dot Badge */}
            {isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-zinc-900 rounded-full animate-pulse" />
            )}
          </div>

          {/* Song Title & Equalizer (Compact View) */}
          <div className="min-w-0 px-2 flex-1">
            <h5 className="text-xs font-bold text-zinc-100 truncate flex items-center gap-1.5">
              <span className="truncate max-w-[90px] sm:max-w-[120px]">{currentTrack.title}</span>
              {isPlaying && (
                <span className="flex items-end gap-0.5 h-3 shrink-0">
                  <span className="w-0.5 h-full bg-rose-400 animate-pulse" />
                  <span className="w-0.5 h-2/3 bg-rose-400 animate-pulse delay-75" />
                  <span className="w-0.5 h-1/2 bg-rose-400 animate-pulse delay-150" />
                </span>
              )}
            </h5>
            {isExpanded && (
              <p className="text-[10px] text-zinc-400 truncate max-w-[110px]">
                {currentTrack.artist}
              </p>
            )}
          </div>

          {/* Expanded State Control Buttons ("当点击时会产生动画变长增加播放暂停换歌曲按钮") */}
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="controls-expanded"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1 shrink-0 pl-1 border-l border-white/10"
              >
                {/* Previous Song */}
                <button
                  onClick={handlePrevTrack}
                  className="p-1.5 rounded-full hover:bg-white/15 text-zinc-300 hover:text-white transition-colors"
                  title="上一首"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                {/* Play / Pause Toggle Button */}
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-xs transition-transform active:scale-95"
                  title={isPlaying ? "暂停" : "播放"}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>

                {/* Next Song */}
                <button
                  onClick={handleNextTrack}
                  className="p-1.5 rounded-full hover:bg-white/15 text-zinc-300 hover:text-white transition-colors"
                  title="下一首"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                {/* Open Playlist */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPlaylist(prev => !prev);
                  }}
                  className={`p-1.5 rounded-full transition-colors ${
                    showPlaylist ? 'bg-white/20 text-white' : 'hover:bg-white/15 text-zinc-300'
                  }`}
                  title="歌单"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                </button>

                {/* Collapse Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-0.5"
                  title="收起"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ) : (
              /* Compact State Single Play/Stop Button ("选完后自动动画缩原来小长方圆边...一个播放键") */
              <motion.div
                key="controls-compact"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1 shrink-0"
              >
                <button
                  onClick={togglePlay}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isPlaying 
                      ? 'bg-rose-500 text-white shadow-xs' 
                      : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                  title={isPlaying ? "暂停/停止" : "播放"}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </>
  );
};
