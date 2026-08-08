import React, { useState } from 'react';
import { Article } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Heart, Sparkles, Clock, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { getArticlePaths } from '../utils/pinyin';

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  const { accentClasses } = useTheme();
  const [copiedType, setCopiedType] = useState<'rel' | 'abs' | null>(null);

  const { relativePath, absolutePath } = getArticlePaths(article);

  const handleCopyPath = (e: React.MouseEvent, text: string, type: 'rel' | 'abs') => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  // Default soft desaturated gradients matching Sanfun design aesthetic
  const gradientBgs = [
    'from-rose-500 to-orange-400',
    'from-amber-500 to-orange-500',
    'from-emerald-400 to-teal-500',
    'from-sky-400 to-blue-500',
    'from-purple-400 to-indigo-500',
    'from-pink-400 to-rose-500',
  ];

  const bgGradient = article.coverBg || gradientBgs[Math.abs(article.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % gradientBgs.length];

  // Default mascots / 3D stickers
  const defaultMascots = ['🪵', '🐧', '🔋', '📰', '🐱', '🤖', '💡', '🚀'];
  const mascot = article.mascotIcon || defaultMascots[Math.abs(article.id.length) % defaultMascots.length];

  // Watermark text split into left & right halves so characters flow out from behind the icon
  const watermarkText = article.coverText || article.category || 'SANFUN';
  const mid = Math.ceil(watermarkText.length / 2);
  const watermarkLeft = watermarkText.slice(0, mid);
  const watermarkRight = watermarkText.slice(mid);

  // Function to derive the lightest accent border color matching the gradient background
  const getLightestBorderColor = (bg: string) => {
    if (!bg) return 'border-white/95 dark:border-zinc-200/90';
    const lower = bg.toLowerCase();
    if (lower.includes('rose') || lower.includes('pink') || lower.includes('red')) return 'border-rose-200 dark:border-rose-300';
    if (lower.includes('amber') || lower.includes('yellow') || lower.includes('orange')) return 'border-amber-200 dark:border-amber-300';
    if (lower.includes('teal') || lower.includes('cyan') || lower.includes('emerald') || lower.includes('green')) return 'border-cyan-200 dark:border-teal-200';
    if (lower.includes('purple') || lower.includes('violet') || lower.includes('fuchsia')) return 'border-purple-200 dark:border-violet-200';
    if (lower.includes('blue') || lower.includes('sky')) return 'border-sky-200 dark:border-blue-200';
    if (lower.includes('indigo')) return 'border-indigo-200 dark:border-indigo-300';
    return 'border-zinc-100 dark:border-zinc-200';
  };

  const lightestBorderClass = getLightestBorderColor(bgGradient);

  return (
    <article
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs cursor-pointer group flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 h-full"
    >
      <div className="flex-1 flex flex-col justify-between">
        {/* SANFUN Style Banner Header with 5/6 Height */}
        <div className={`relative h-44 sm:h-52 w-full overflow-hidden bg-gradient-to-tr ${bgGradient} p-3.5 sm:p-5 flex items-center justify-center select-none shrink-0`}>
          
          {/* Background Watermark Text - Split left & right so characters flow out from behind icon */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-[46px] sm:gap-[72px] pointer-events-none z-0 px-2 select-none">
            <span className="text-[42px] sm:text-[68px] font-black text-white/45 uppercase tracking-tight font-sans leading-none text-right whitespace-nowrap">
              {watermarkLeft}
            </span>
            <span className="text-[42px] sm:text-[68px] font-black text-white/45 uppercase tracking-tight font-sans leading-none text-left whitespace-nowrap">
              {watermarkRight}
            </span>
          </div>

          {/* Background Decorative Particles */}
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-6 -top-6 w-28 h-28 rounded-full bg-black/10 blur-xl pointer-events-none" />

          {/* Center 3D Floating Mascot / App Sticker */}
          <div className={`relative z-10 w-[82px] h-[82px] sm:w-[108px] sm:h-[108px] rounded-[20px] sm:rounded-[24px] bg-white/95 dark:bg-zinc-300/95 shadow-[0_12px_28px_rgba(0,0,0,0.35)] sm:shadow-[0_16px_36px_rgba(0,0,0,0.38)] border-3 sm:border-4 ${lightestBorderClass} flex items-center justify-center text-3xl sm:text-5xl group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-2 transition-all duration-300 overflow-hidden p-1.5 sm:p-2`}>
            {mascot.startsWith('http') || mascot.startsWith('data:') || mascot.startsWith('/') ? (
              <img src={mascot} alt="Cover Mascot" className="w-full h-full object-cover rounded-[14px] sm:rounded-[18px]" />
            ) : (
              <span className="drop-shadow-md">{mascot}</span>
            )}
          </div>

          {/* Featured Badge */}
          {article.featured && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-zinc-950 shadow-xs">
              ⭐ 精选
            </span>
          )}

          {/* Reading Time Pill */}
          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono text-white/90 bg-black/30 backdrop-blur-md border border-white/20 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{article.readingTime}</span>
          </span>
        </div>

        {/* Card Body Details */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Category & Status Row */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400 font-sans">
                {article.category} <span className="mx-1 text-zinc-300 dark:text-zinc-600">•</span> {article.readStatus || '最新'}
              </span>
              <span className="font-mono text-[11px] text-zinc-400">{article.date}</span>
            </div>

            {/* Title */}
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
              {article.title}
            </h2>
          </div>

          {/* Tag Pills Row */}
          <div className="flex flex-wrap items-center gap-1 mt-2 pt-1">
            {article.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60"
              >
                #{t.replace(/^#/, '')}
              </span>
            ))}
          </div>

          {/* Paths Bar (Relative & Absolute Path for Easy Management) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col gap-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400"
          >
            <div className="flex items-center justify-between gap-1 group/rel">
              <span className="truncate select-all text-zinc-600 dark:text-zinc-400 text-[10.5px]" title={`相对路径: ${relativePath}`}>
                <span className="font-sans font-semibold text-zinc-400 dark:text-zinc-500 mr-1 shrink-0">相对:</span>
                {relativePath}
              </span>
              <button
                type="button"
                onClick={(e) => handleCopyPath(e, relativePath, 'rel')}
                className="shrink-0 px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-sans flex items-center gap-0.5 transition-colors"
                title="复制相对路径"
              >
                {copiedType === 'rel' ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedType === 'rel' ? '已复制' : '复制'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-1 group/abs">
              <span className="truncate select-all text-zinc-500 dark:text-zinc-400 text-[10.5px]" title={`绝对路径: ${absolutePath}`}>
                <span className="font-sans font-semibold text-zinc-400 dark:text-zinc-500 mr-1 shrink-0">绝对:</span>
                {absolutePath}
              </span>
              <button
                type="button"
                onClick={(e) => handleCopyPath(e, absolutePath, 'abs')}
                className="shrink-0 px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-sans flex items-center gap-0.5 transition-colors"
                title="复制绝对路径"
              >
                {copiedType === 'abs' ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedType === 'abs' ? '已复制' : '复制'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stat Bar */}
      <div className="px-3.5 py-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-rose-500 font-medium text-[11px]">
            <Heart className="w-3 h-3 fill-rose-500/20" />
            {article.likes}
          </span>
          {article.aiSummary && (
            <span className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
              <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
              AI 摘要
            </span>
          )}
        </div>

        <span className="font-mono text-[11px] text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
          {article.views} 次阅读
        </span>
      </div>
    </article>
  );
};

