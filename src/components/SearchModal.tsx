import React, { useState, useEffect } from 'react';
import { Article, Moment } from '../types';
import { Search, X, BookOpen, Clock, Tag, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  moments: Moment[];
  onSelectArticle: (article: Article) => void;
  onSelectTag: (tag: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  articles,
  moments,
  onSelectArticle,
  onSelectTag,
}) => {
  const { accentClasses } = useTheme();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredArticles = query.trim()
    ? articles.filter(a =>
        (a.title || '').toLowerCase().includes(query.toLowerCase()) ||
        (a.summary || '').toLowerCase().includes(query.toLowerCase()) ||
        (a.tags || []).some(t => t.toLowerCase().includes(query.toLowerCase()))
      )
    : articles.slice(0, 4);

  const filteredMoments = query.trim()
    ? moments.filter(m =>
        (m.content || '').toLowerCase().includes(query.toLowerCase()) ||
        m.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const allTags = Array.from(
    new Set(articles.flatMap(a => a.tags || []))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden relative">
        
        {/* Search Input Header */}
        <div className="p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center gap-3">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            type="text"
            autoFocus
            placeholder="输入关键词搜索文章、标签或动态... (Esc 关闭)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[420px] overflow-y-auto p-4 space-y-5">
          
          {/* Quick Tags Palette */}
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              热门标签
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    onSelectTag(t);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Section */}
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              文章 ({filteredArticles.length})
            </div>
            {filteredArticles.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-2">未找到匹配的文章。</p>
            ) : (
              <div className="space-y-1.5">
                {filteredArticles.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      onSelectArticle(a);
                      onClose();
                    }}
                    className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {a.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 line-clamp-1">
                        {a.summary}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Moments Section */}
          {filteredMoments.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                说说动态 ({filteredMoments.length})
              </div>
              <div className="space-y-1.5">
                {filteredMoments.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    "{m.content}"
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
          <span>Sanfun 全局搜索引擎</span>
          <span>按 ESC 退出</span>
        </div>

      </div>
    </div>
  );
};
