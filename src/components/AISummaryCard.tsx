import React, { useState } from 'react';
import { Sparkles, RefreshCw, Copy, Check, Bot } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface AISummaryCardProps {
  articleTitle: string;
  articleContent: string;
  initialSummary?: string;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  articleTitle,
  articleContent,
  initialSummary
}) => {
  const { accentClasses } = useTheme();
  const [summary, setSummary] = useState<string | null>(initialSummary || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAISummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleTitle, articleContent })
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        setSummary(data.summary);
      } else {
        setError(data.error || "Could not generate summary");
      }
    } catch (err) {
      setError("Failed to connect to AI summarizer service.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 p-5 sm:p-6 rounded-lg bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-blue-50/70 dark:from-zinc-900/90 dark:via-zinc-900/90 dark:to-zinc-800/90 border border-indigo-200/60 dark:border-indigo-900/40 shadow-sm relative overflow-hidden">
      
      {/* Background Subtle Sparkle Accent */}
      <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20 pointer-events-none">
        <Bot className="w-24 h-24 text-indigo-600 dark:text-indigo-400" />
      </div>

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md text-white ${accentClasses.bg}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>🤖 AI 智能文章精炼</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Gemini 3.6
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              基于 Gemini 3.6 实时提炼文章要点
            </p>
          </div>
        </div>

        {summary && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors"
              title="Copy Summary"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={fetchAISummary}
              disabled={loading}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors disabled:opacity-50"
              title="Regenerate Summary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="relative z-10">
        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center text-xs text-indigo-600 dark:text-indigo-400 space-y-2">
            <Sparkles className="w-6 h-6 animate-spin" />
            <span className="font-medium">Gemini 3.6 Flash 正在深度解析文章核心观点...</span>
          </div>
        ) : summary ? (
          <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 space-y-2 leading-relaxed font-sans bg-white/60 dark:bg-zinc-950/40 p-4 rounded-md border border-indigo-100/60 dark:border-indigo-900/30 whitespace-pre-line">
            {summary}
          </div>
        ) : (
          <div className="pt-2 pb-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              想在阅读全文前快速获取 10 秒要点总结吗？
            </p>
            <button
              onClick={fetchAISummary}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all ${accentClasses.bg}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>生成 AI 摘要</span>
            </button>
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-rose-500 dark:text-rose-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
