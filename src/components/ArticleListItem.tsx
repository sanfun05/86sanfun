import React, { useState } from 'react';
import { Article } from '../types';
import { ChevronRight, Copy, Check } from 'lucide-react';
import { getArticlePaths } from '../utils/pinyin';

interface ArticleListItemProps {
  article: Article;
  onClick: () => void;
}

export const ArticleListItem: React.FC<ArticleListItemProps> = ({ article, onClick }) => {
  const [copiedType, setCopiedType] = useState<'rel' | 'abs' | null>(null);
  const { relativePath, absolutePath } = getArticlePaths(article);

  const handleCopyPath = (e: React.MouseEvent, text: string, type: 'rel' | 'abs') => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };
  // Vibrant Sanfun style gradients matching article covers
  const bgGradients = [
    'from-rose-500 to-red-600',
    'from-orange-500 to-amber-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
    'from-cyan-600 to-blue-700',
    'from-indigo-500 to-violet-600',
    'from-purple-500 to-pink-600',
    'from-teal-500 to-emerald-600',
    'from-sky-500 to-blue-600',
  ];

  const hash = article.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradient = article.coverBg || bgGradients[Math.abs(hash) % bgGradients.length];
  const watermarkText = article.coverText || article.title.substring(0, 4);
  const mid = Math.ceil(watermarkText.length / 2);
  const watermarkLeft = watermarkText.slice(0, mid);
  const watermarkRight = watermarkText.slice(mid);
  const mascot = article.mascotIcon || '🦀';

  return (
    <div
      onClick={onClick}
      className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer transition-all duration-200 group flex items-center justify-between gap-2.5 sm:gap-4"
    >
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        {/* Left Mini Cover Badge Thumbnail (Responsive Width: 105px on mobile, 180px on sm+) */}
        <div className={`relative w-[105px] sm:w-[180px] h-[72px] sm:h-[90px] rounded-xl bg-gradient-to-tr ${gradient} shrink-0 p-1.5 sm:p-2 flex items-center justify-center text-white shadow-2xs overflow-hidden select-none group-hover:scale-[1.02] transition-transform duration-200`}>
          {/* Horizontal Background Watermark Text - Split around centered mascot */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-[24px] sm:gap-[46px] pointer-events-none z-0 px-1 select-none">
            <span className="text-[18px] sm:text-[28px] font-black text-white/45 uppercase tracking-tight font-sans leading-none text-right whitespace-nowrap">
              {watermarkLeft}
            </span>
            <span className="text-[18px] sm:text-[28px] font-black text-white/45 uppercase tracking-tight font-sans leading-none text-left whitespace-nowrap">
              {watermarkRight}
            </span>
          </div>

          {/* Centered Mascot / Icon Sticker Badge (Responsive sizing) */}
          <div className="relative z-10 w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/95 dark:bg-zinc-300/95 border-2 border-white/90 dark:border-zinc-200/80 shadow-md flex items-center justify-center text-base sm:text-2xl group-hover:scale-110 group-hover:rotate-2 transition-all duration-300 overflow-hidden p-0.5 sm:p-1">
            {mascot.startsWith('http') || mascot.startsWith('data:') || mascot.startsWith('/') ? (
              <img src={mascot} alt="" className="w-full h-full object-cover rounded-md sm:rounded-lg" />
            ) : (
              <span className="drop-shadow-xs">{mascot}</span>
            )}
          </div>

          {/* Glass shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none" />
        </div>

        {/* Article Title & Category Date Sub-info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">{article.category}</span>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
            <span className="font-mono text-zinc-400 dark:text-zinc-500">{article.date}</span>
          </div>

          {/* Paths Bar (Relative & Absolute Path for Easy Management) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-zinc-400 dark:text-zinc-500"
          >
            <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-800/70 px-1.5 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700/60 text-[10.5px]">
              <span className="text-zinc-500 dark:text-zinc-400 font-sans font-semibold">相对:</span>
              <span className="select-all text-zinc-700 dark:text-zinc-300">{relativePath}</span>
              <button
                type="button"
                onClick={(e) => handleCopyPath(e, relativePath, 'rel')}
                className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-sans font-bold text-[10px] flex items-center gap-0.5"
              >
                {copiedType === 'rel' ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedType === 'rel' ? '已复制' : '复制'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-800/70 px-1.5 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700/60 text-[10.5px]">
              <span className="text-zinc-500 dark:text-zinc-400 font-sans font-semibold">绝对:</span>
              <span className="select-all text-zinc-700 dark:text-zinc-300 truncate max-w-[150px] sm:max-w-[280px]">{absolutePath}</span>
              <button
                type="button"
                onClick={(e) => handleCopyPath(e, absolutePath, 'abs')}
                className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-sans font-bold text-[10px] flex items-center gap-0.5"
              >
                {copiedType === 'abs' ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedType === 'abs' ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Arrow Chevron */}
      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
    </div>
  );
};

