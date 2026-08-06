import React, { useState } from 'react';
import { Moment } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Clock, Heart, MapPin, Send, Tag, Sparkles, MessageCircle, Image } from 'lucide-react';

interface MomentsViewProps {
  moments: Moment[];
  onAddMoment?: (newMoment: Moment) => void;
}

export const MomentsView: React.FC<MomentsViewProps> = ({ moments }) => {
  const { accentClasses } = useTheme();
  const [likedIds, setLikedIds] = useState<Record<string, number>>({});

  const handleLike = (id: string, initialLikes: number) => {
    setLikedIds(prev => ({
      ...prev,
      [id]: (prev[id] ?? initialLikes) + 1
    }));
  };

  return (
    <div className="space-y-3.5">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-800 dark:from-zinc-900 dark:to-zinc-950 text-white rounded-lg p-7 sm:p-9 shadow-md flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-400 text-zinc-950 mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>即刻 / 说说动态</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
            Sanfun 的日常随想与微动态
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300">
            碎片化的开发笔记、UI 实验日志与生活近况记录。（管理员在后台统一发布与编辑）
          </p>
        </div>
        <Clock className="w-12 h-12 text-zinc-600 hidden sm:block" />
      </div>

      {/* Moments Feed List */}
      <div className="space-y-2.5">
        {moments.map((m) => {
          const currentLikes = likedIds[m.id] ?? m.likes;
          return (
            <div
              key={m.id}
              className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg p-6 sm:p-7 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm transition-all hover:shadow-md"
            >
              {/* Top Row: User Avatar + Time */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${accentClasses.bg}`}>
                    S
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Sanfun
                    </h4>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {m.date}
                    </span>
                  </div>
                </div>

                {m.location && (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                    <MapPin className="w-3 h-3" />
                    <span>{m.location}</span>
                  </div>
                )}
              </div>

              {/* Moment Content */}
              <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line mb-3">
                {m.content}
              </p>

              {/* Optional Images */}
              {m.images && m.images.length > 0 && (
                <div className="mb-3 rounded-lg overflow-hidden max-h-72">
                  <img
                    src={m.images[0]}
                    alt="Moment visual"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Tags & Interaction Row */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="flex flex-wrap items-center gap-1.5">
                  {m.tags?.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleLike(m.id, m.likes)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500" />
                  <span>{currentLikes}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
