import React, { useState, useEffect, useRef } from 'react';
import { Article, ArticleComment, AuthorProfile, Moment, UserMember } from '../types';
import { useTheme } from '../context/ThemeContext';
import { audioManager } from '../utils/audioManager';
import { AISummaryCard } from './AISummaryCard';
import { PanoramaViewer } from './PanoramaViewer';
import { ThreeDViewer } from './ThreeDViewer';
import { SidebarWidget } from './SidebarWidget';
import { authorProfile as defaultProfile, sampleMoments } from '../data/blogData';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  ArrowLeft, Calendar, Clock, Eye, Heart, Share2, MessageSquare, 
  Send, Check, User, Sparkles, BookOpen, ShieldCheck, Copy, List, 
  ChevronLeft, ChevronRight, ExternalLink, Play, Pause, Volume2,
  MapPin, Monitor, Globe, QrCode, Tag, ThumbsUp, Sparkle, Bookmark,
  Compass, Terminal, FileText, CheckCircle2, Award, Lock, Download, Coins,
  Cloud, HardDrive, Key, Smile, Image as ImageIcon, RefreshCw, AlertCircle
} from 'lucide-react';

interface ArticleDetailProps {
  article: Article;
  allArticles?: Article[];
  onBack: () => void;
  onSelectArticle?: (article: Article) => void;
  profile?: AuthorProfile;
  moments?: Moment[];
  categories?: string[];
  selectedCategory?: string;
  selectedTag?: string | null;
  onSelectCategory?: (cat: string) => void;
  onSelectTag?: (tag: string | null) => void;
  onTabChange?: (tab: string) => void;
  onOpenAIChat?: () => void;
  currentUser?: UserMember | null;
  onUnlockArticle?: (articleId: string) => Promise<void>;
  onPurchaseAttachment?: (articleId: string, attachmentId: string) => Promise<void>;
  onUnlockNetdisk?: (articleId: string, netdiskId: string) => Promise<void>;
  onOpenAuthModal?: () => void;
  onOpenUserMember?: () => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ 
  article: initialArticle, 
  allArticles = [],
  onBack,
  onSelectArticle,
  profile = defaultProfile,
  moments = sampleMoments,
  categories = ['产品设计', 'AI 与技术', '前端工程', '生活与思考'],
  selectedCategory = '全部',
  selectedTag = null,
  onSelectCategory = () => {},
  onSelectTag = () => {},
  onTabChange = () => {},
  onOpenAIChat = () => {},
  currentUser = null,
  onUnlockArticle,
  onPurchaseAttachment,
  onUnlockNetdisk,
  onOpenAuthModal = () => {},
  onOpenUserMember
}) => {
  const { accentClasses } = useTheme();
  const [article, setArticle] = useState<Article>(initialArticle);
  const [likes, setLikes] = useState<number>(initialArticle.likes);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<ArticleComment[]>(initialArticle.comments || []);
  const [commentName, setCommentName] = useState(currentUser?.username || '');
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentTab, setCommentTab] = useState<'write' | 'preview'>('write');
  const [submitting, setSubmitting] = useState(false);

  // Captcha State
  const [captchaNum1, setCaptchaNum1] = useState(3);
  const [captchaNum2, setCaptchaNum2] = useState(5);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaInput('');
    setCaptchaError('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);
  const [unlocking, setUnlocking] = useState(false);
  const [purchasingAttId, setPurchasingAttId] = useState<string | null>(null);
  const [unlockingNetdiskId, setUnlockingNetdiskId] = useState<string | null>(null);
  const [copiedNetdiskCodeId, setCopiedNetdiskCodeId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  // Audio / Speech State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechUtt, setSpeechUtt] = useState<SpeechSynthesisUtterance | null>(null);

  // Scroll & Active Heading
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  // TOC
  const [tocOpen, setTocOpen] = useState(true);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  // Register article speech with global AudioManager
  useEffect(() => {
    audioManager.register({
      id: 'article-speech',
      priority: 'FOREGROUND',
      onPauseByManager: () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setIsPlayingAudio(false);
      }
    });

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      audioManager.notifyStopped('article-speech');
      audioManager.unregister('article-speech');
    };
  }, [article.id]);

  // Update article if props change
  useEffect(() => {
    if (!initialArticle) return;
    setArticle(initialArticle);
    setLikes(initialArticle.likes || 0);
    setComments(initialArticle.comments || []);
    setHasLiked(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    audioManager.notifyStopped('article-speech');
    setIsPlayingAudio(false);
  }, [initialArticle?.id]);

  // Helper to extract raw text from markdown children
  const getRawTextFromChildren = (children: any): string => {
    if (!children) return '';
    if (typeof children === 'string' || typeof children === 'number') return String(children);
    if (Array.isArray(children)) return children.map(getRawTextFromChildren).join('');
    if (children?.props?.children) return getRawTextFromChildren(children.props.children);
    return '';
  };

  // Handle scroll progress and active section tracking
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }

      // Track active heading (h1, h2, h3)
      const headingElements = document.querySelectorAll('.article-content h1, .article-content h2, .article-content h3');
      let currentActiveId = '';
      let currentActiveText = '';

      headingElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) {
          currentActiveId = el.id || '';
          currentActiveText = el.getAttribute('data-heading-text') || el.textContent?.trim() || '';
        }
      });

      if (currentActiveId || currentActiveText) {
        setActiveHeadingId(currentActiveId || currentActiveText);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article.id]);

  // Extract headings for TOC
  const headings = (article?.content || '')
    .split('\n')
    .filter(line => line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### '))
    .map(line => {
      const level = line.startsWith('### ') ? 3 : line.startsWith('## ') ? 2 : 1;
      const text = line.replace(/^#+\s*/, '').replace(/[*_~`]/g, '').trim();
      const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
      return { level, text, id };
    });

  // User comment unlock checks
  const hasUserCommented = comments.some(c => c.author === currentUser?.username || (c as any).userId === currentUser?.id);
  const isUnlockedByComment = !!(article.requireCommentToView && hasUserCommented);

  // Real-time article metrics computation
  const articleContentText = article?.content || '';
  const calculatedWordCount = article?.wordCount || articleContentText.replace(/[\s#*`~_>\-[\]()|]/g, '').length;
  const calculatedReadingMinutes = article?.readingTime ? parseInt(article.readingTime) || Math.max(1, Math.ceil(calculatedWordCount / 350)) : Math.max(1, Math.ceil(calculatedWordCount / 350));
  const articleLocation = (article as any)?.location || 'IP属地：北京';

  // Mascot and border styling matching homepage article card
  const defaultMascots = ['🪵', '🐧', '🔋', '📰', '🐱', '🤖', '💡', '🚀'];
  const mascot = article.mascotIcon || defaultMascots[Math.abs(article.id.length) % defaultMascots.length];

  const getLightestBorderColor = (bg?: string) => {
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
  const lightestBorderClass = getLightestBorderColor(article.coverBg);

  // Calculate prev and next articles
  const currentIndex = allArticles.findIndex(a => a.id === article.id);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex >= 0 && currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  // Filter recommended articles (excluding current)
  const recommendedArticles = allArticles
    .filter(a => a.id !== article.id)
    .slice(0, 2);

  // Audio Player Toggle
  const toggleAudioPlayer = () => {
    if (!('speechSynthesis' in window)) {
      alert("您的浏览器暂不支持 SpeechSynthesis 智能语音朗读");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      audioManager.notifyPaused('article-speech');
    } else {
      // Request high priority foreground audio playback
      audioManager.requestPlay('article-speech', 'FOREGROUND');

      const textToRead = `${article.title}。${article.summary}。${article.content.slice(0, 300).replace(/[#*`|[\]]/g, '')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      utterance.onend = () => {
        setIsPlayingAudio(false);
        audioManager.notifyStopped('article-speech');
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        audioManager.notifyStopped('article-speech');
      };
      setSpeechUtt(utterance);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    setLikes(prev => prev + 1);

    try {
      await fetch(`/api/articles/${article.id}/like`, { method: "POST" });
    } catch (err) {
      console.error("Failed to persist like", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }

    if (!commentText.trim()) return;

    // CAPTCHA Verification
    if (parseInt(captchaInput.trim(), 10) !== (captchaNum1 + captchaNum2)) {
      setCaptchaError('验证码计算错误，请重新计算输入！');
      generateCaptcha();
      return;
    }
    setCaptchaError('');

    const nameToUse = currentUser.username;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/articles/${article.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: nameToUse,
          content: commentText.trim(),
          image: commentImage.trim() || undefined,
          avatar: currentUser.avatar,
          level: currentUser.level || "Lv.1 普通会员",
          userId: currentUser.id
        })
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, newComment]);
        setCommentText('');
        setCommentImage('');
        generateCaptcha();
      } else {
        // Fallback local add
        const newLocal: ArticleComment = {
          id: `c-${Date.now()}`,
          author: nameToUse,
          avatar: currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
          content: commentText.trim(),
          image: commentImage.trim() || undefined,
          date: "刚刚",
          likes: 0,
          level: currentUser.level || "Lv.1 普通会员",
          location: "华东地区",
          os: "Web",
          browser: "Chrome"
        };
        setComments(prev => [...prev, newLocal]);
        setCommentText('');
        setCommentImage('');
        generateCaptcha();
      }
    } catch (err) {
      console.error("Failed to add comment", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const scrollToHeading = (id: string, text: string) => {
    setActiveHeadingId(id || text);
    let element: HTMLElement | null = null;
    if (id) {
      element = document.getElementById(id);
    }
    if (!element && text) {
      const allHeadings = Array.from(document.querySelectorAll('.article-content h1, .article-content h2, .article-content h3'));
      element = (allHeadings.find(el => {
        const dataText = el.getAttribute('data-heading-text') || '';
        const txt = el.textContent || '';
        return dataText === text || txt.includes(text) || text.includes(dataText);
      }) as HTMLElement) || null;
    }
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const coverGradient = article.coverBg || 'from-rose-500 to-orange-400';

  return (
    <div className="w-full max-w-[1440px] mx-auto pb-20 animate-in fade-in duration-300 relative font-sans">
      
      {/* Top Fixed Reading Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none">
        <div 
          className={`h-full transition-all duration-150 ${accentClasses.bg}`}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Action Header Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-2xs active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-rose-500" />
          <span>返回文章列表</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-100 transition-colors shadow-2xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? '已复制链接' : '分享本篇'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Top Banner (Header Cover Gradient) */}
      <div className={`relative w-full rounded-2xl overflow-hidden shadow-md bg-gradient-to-r ${coverGradient} text-white p-6 sm:p-8 mb-3`}>
        {/* Dark overlay for extra contrast */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-none" />

        {/* Dynamic Watermark Background Text */}
        <span className="absolute right-4 bottom-2 text-6xl sm:text-9xl font-black text-white/10 uppercase tracking-widest font-sans select-none pointer-events-none truncate max-w-full">
          {article.coverText || article.category || 'SANFUN'}
        </span>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Article Info Column */}
          <div className="max-w-3xl space-y-4">
            {/* Category Breadcrumb & Tag Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                ALL文章
              </span>
              <span className="text-white/60 text-xs">/</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-rose-600 shadow-2xs">
                {article.category || '未分类'}
              </span>

              {(article.tags || []).map(t => (
                <span key={t} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/20 text-white/90 border border-white/20">
                  #{t}
                </span>
              ))}
            </div>

            {/* Article Title */}
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight drop-shadow-2xs">
              {article.title}
            </h1>

            {/* Meta Attributes Bar */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-white/90 font-medium pt-2">
              <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10" title="实际文章阅读次数">
                <Eye className="w-3.5 h-3.5 text-rose-200" />
                <span>{article.views} 次阅读</span>
              </span>

              <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10" title="发布时间">
                <Calendar className="w-3.5 h-3.5 text-orange-200" />
                <span>{article.date}</span>
              </span>

              <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10" title="动态评论互动数">
                <MessageSquare className="w-3.5 h-3.5 text-amber-200" />
                <span>{comments.length} 评论</span>
              </span>

              <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10" title="点赞总数">
                <Heart className="w-3.5 h-3.5 text-rose-300" />
                <span>{likes} 赞</span>
              </span>

              <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10" title="文章发布IP属地">
                <MapPin className="w-3.5 h-3.5 text-sky-200" />
                <span>{articleLocation}</span>
              </span>

              <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg border border-white/10" title="实际字数与预计阅读时间">
                <Clock className="w-3.5 h-3.5 text-emerald-200" />
                <span>{calculatedWordCount.toLocaleString()} 字 · 约 {calculatedReadingMinutes} 分钟</span>
              </span>
            </div>
          </div>

          {/* Right Floating Mascot Cover Card (Matching Homepage Article Card Cover Icon) */}
          <div className="self-center lg:self-auto shrink-0 my-auto">
            <div className={`relative z-10 w-[84px] h-[84px] sm:w-[110px] sm:h-[110px] rounded-[20px] sm:rounded-[24px] bg-white/95 dark:bg-zinc-300/95 shadow-[0_12px_28px_rgba(0,0,0,0.35)] sm:shadow-[0_16px_36px_rgba(0,0,0,0.38)] border-3 sm:border-4 ${lightestBorderClass} flex items-center justify-center text-3xl sm:text-5xl hover:scale-110 hover:-translate-y-1 hover:rotate-2 transition-all duration-300 overflow-hidden p-1.5 sm:p-2`}>
              {mascot.startsWith('http') || mascot.startsWith('data:') || mascot.startsWith('/') ? (
                <img src={mascot} alt="Cover Mascot" className="w-full h-full object-cover rounded-[14px] sm:rounded-[18px]" />
              ) : (
                <span className="drop-shadow-md select-none">{mascot}</span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Two-Column Layout (Content + Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left Column: Article Body & Interactive Modules (col-span-9 - Matched to homepage) */}
        <div className="lg:col-span-9 space-y-3">
          
          {/* Main Article Container Box */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-10 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm relative overflow-hidden">
            
            {/* Top AI Smart Reading Audio Banner */}
            <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-orange-500/10 to-amber-500/10 border border-rose-200/80 dark:border-rose-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      ⚡ 本文支持AI智能阅读 x1
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 font-mono">
                      Speech Engine
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    语音合成引擎·提炼文章核心观点并朗读全文要点
                  </p>
                </div>
              </div>

              <button
                onClick={toggleAudioPlayer}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all shrink-0 active:scale-95 ${
                  isPlayingAudio ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900' : 'bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-90'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span>暂停朗读</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>▶ 播放</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Summary Card Component */}
            <AISummaryCard
              articleTitle={article.title}
              articleContent={article.content}
              initialSummary={article.aiSummary}
            />

            {/* Markdown Article Content Body */}
            <div className="article-content prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-sm sm:text-base leading-relaxed space-y-6">
              <Markdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1({ children, ...props }: any) {
                    const rawText = getRawTextFromChildren(children).replace(/[*_~`]/g, '').trim();
                    const id = rawText.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
                    return (
                      <h1 id={id} data-heading-text={rawText} {...props} className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 pt-6 pb-2 border-b-2 border-rose-500/20 flex items-center gap-2.5 scroll-mt-24">
                        <span className="w-2.5 h-6 rounded-full bg-rose-500 inline-block shrink-0" />
                        <span>{children}</span>
                      </h1>
                    );
                  },
                  h2({ children, ...props }: any) {
                    const rawText = getRawTextFromChildren(children).replace(/[*_~`]/g, '').trim();
                    const id = rawText.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
                    return (
                      <h2 id={id} data-heading-text={rawText} {...props} className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 pt-4 pb-1 flex items-center gap-2 text-rose-600 dark:text-rose-400 scroll-mt-24">
                        <span className="text-rose-500 font-mono">#</span>
                        <span>{children}</span>
                      </h2>
                    );
                  },
                  h3({ children, ...props }: any) {
                    const rawText = getRawTextFromChildren(children).replace(/[*_~`]/g, '').trim();
                    const id = rawText.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
                    return (
                      <h3 id={id} data-heading-text={rawText} {...props} className="text-base sm:text-lg font-semibold text-zinc-800 dark:text-zinc-200 pt-3 pb-1 flex items-center gap-2 scroll-mt-24">
                        <span className="text-rose-400 font-mono">##</span>
                        <span>{children}</span>
                      </h3>
                    );
                  },
                  table({ children }: any) {
                    return (
                      <div className="my-6 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <table className="w-full text-xs sm:text-sm text-left border-collapse">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }: any) {
                    return (
                      <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold border-b border-zinc-200 dark:border-zinc-700">
                        {children}
                      </thead>
                    );
                  },
                  th({ children }: any) {
                    return <th className="p-3 sm:p-3.5 text-zinc-900 dark:text-zinc-100 font-bold">{children}</th>;
                  },
                  td({ children }: any) {
                    return <td className="p-3 sm:p-3.5 border-t border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{children}</td>;
                  },
                  blockquote({ children }: any) {
                    return (
                      <blockquote className="my-4 p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border-l-4 border-rose-500 text-zinc-700 dark:text-zinc-300 italic text-sm font-medium">
                        {children}
                      </blockquote>
                    );
                  },
                  pre({ children }: any) {
                    return <>{children}</>;
                  },
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    const codeIdx = Math.abs(codeString.length * 31);
                    const isInline = inline || (!match && !codeString.includes('\n') && !className);

                    if (!isInline) {
                      return (
                        <div className="my-5 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md font-mono text-xs sm:text-sm">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
                            <span className="font-bold uppercase tracking-wider text-[11px] text-rose-400 flex items-center gap-1.5">
                              <Terminal className="w-3.5 h-3.5" />
                              <span>{match ? match[1] : 'Code'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(codeString, codeIdx)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] transition-colors"
                            >
                              {copiedCodeIndex === codeIdx ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>已复制</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>复制代码</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto leading-relaxed">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <code className="bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-xs font-mono font-semibold border border-rose-200 dark:border-rose-900/40" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {article.content}
              </Markdown>

              {/* 1. PAID CONTENT LOCK SECTION & COMMENT TO VIEW REQUIREMENT */}
              {article.requireCommentToView && (
                <div className={`mt-6 p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${
                  hasUserCommented 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl text-white shrink-0 ${hasUserCommented ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}>
                      {hasUserCommented ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black flex items-center gap-1.5">
                        <span>💬 本文已开启【评论后回复可见】限制</span>
                        {hasUserCommented && <span className="px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px]">已评论解锁</span>}
                      </h4>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {hasUserCommented
                          ? '检测到您已在评论区发表讨论，特权干货内容、附件源码与网盘提取码已为您自动解锁！'
                          : '前往底部评论区发表一条有效评论，即可免费解锁隐藏干货、源码附件与网盘提取码！'}
                      </p>
                    </div>
                  </div>
                  {!hasUserCommented && (
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('comment-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 shadow-xs transition-all active:scale-95 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>去评论解锁</span>
                    </button>
                  )}
                </div>
              )}

              {article.isPaid && (
                <div className="mt-6 border-2 border-dashed border-indigo-500/30 dark:border-indigo-500/20 rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-zinc-50 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-zinc-900 shadow-xs">
                  {(currentUser?.unlockedArticles.includes(article.id) || (currentUser?.levelNumeric || 1) >= (article.requiredLevel || 1) || isUnlockedByComment) ? (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between pb-3 border-b border-indigo-200/50 dark:border-indigo-800/50">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-emerald-500 text-white shadow-xs">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            付费干货专区 (已成功解锁)
                          </span>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                          {isUnlockedByComment ? '评论后解锁' : currentUser?.level || '已解锁'}
                        </span>
                      </div>

                      <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 leading-relaxed">
                        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                          {article.paidContent || '暂无额外计费补充内容'}
                        </Markdown>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4 space-y-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white mx-auto flex items-center justify-center shadow-md animate-bounce">
                        <Lock className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                          🔒 本文包含 VIP 尊享 / 计费阅读内容
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                          包含完整的自动化脚本源码、核心配置文件与深度避坑指南。
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-3 text-xs font-bold pt-1">
                        <span className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                          对应等级: Lv.{article.requiredLevel || 2}+ 免费看
                        </span>
                        <span className="text-zinc-400">或</span>
                        <span className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{article.price || 10} 积分解锁</span>
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-center gap-3">
                        {!currentUser ? (
                          <button
                            type="button"
                            onClick={onOpenAuthModal}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                          >
                            <User className="w-4 h-4" />
                            <span>登录/注册账号解锁</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={unlocking}
                            onClick={async () => {
                              if (!onUnlockArticle) return;
                              setUnlocking(true);
                              await onUnlockArticle(article.id);
                              setUnlocking(false);
                            }}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                          >
                            <Coins className="w-4 h-4" />
                            <span>使用 {article.price || 10} 积分解锁本文</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. ATTACHMENT DOWNLOADS SECTION */}
              {article.attachments && article.attachments.length > 0 && (
                <div className="mt-8 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-rose-500" />
                      <span>本文配套源码与独家附件资源包 ({article.attachments.length})</span>
                    </h4>
                    <span className="text-[10px] text-zinc-400 font-mono">等级特权 / 积分下载</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {article.attachments.map((att) => {
                      const isDownloaded = currentUser?.purchasedAttachments.includes(att.id) || !att.isPaid || (currentUser?.levelNumeric || 1) >= att.requiredLevel || isUnlockedByComment;

                      return (
                        <div
                          key={att.id}
                          className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                                {att.fileType}
                              </span>
                              <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{att.name}</h5>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-2">
                              <span>{att.size}</span>
                              <span>•</span>
                              <span>{att.isPaid ? `${att.price} 积分 / Lv.${att.requiredLevel}+` : '免费资源'}</span>
                            </p>
                          </div>

                          <div className="shrink-0">
                            {isDownloaded ? (
                              <a
                                href={att.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>下载附件</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                disabled={purchasingAttId === att.id}
                                onClick={async () => {
                                  if (!currentUser) {
                                    onOpenAuthModal();
                                    return;
                                  }
                                  if (!onPurchaseAttachment) return;
                                  setPurchasingAttId(att.id);
                                  await onPurchaseAttachment(article.id, att.id);
                                  setPurchasingAttId(null);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>{att.price > 0 ? `${att.price} 积分购买` : '等级解锁'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. NETDISK LINKS SHARING SECTION */}
              {article.netdiskLinks && article.netdiskLinks.length > 0 && (
                <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 dark:from-zinc-900 dark:via-zinc-800/80 dark:to-zinc-900 border border-blue-200/80 dark:border-blue-900/40 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-100 dark:border-zinc-800">
                    <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span>各类网盘资源与独家提取分享 ({article.netdiskLinks.length})</span>
                    </h4>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-950/80 rounded-full">
                      云盘快传 / 密钥防走失
                    </span>
                  </div>

                  {/* Mandatory Netdisk Validity Check Hint Banner */}
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>提示：购买解密前请先点击「检验网盘链接」确认资源文件未过期，确认无误后再消耗积分解锁提取码与解压密码！</span>
                  </div>

                  <div className="space-y-3">
                    {article.netdiskLinks.map((nd) => {
                      const isUnlocked = currentUser?.unlockedNetdisks?.includes(nd.id) || !nd.isPaid || (currentUser?.levelNumeric || 1) >= (nd.requiredLevel || 1) || isUnlockedByComment;

                      const platformMap: Record<string, { label: string; bg: string; text: string }> = {
                        baidu: { label: '百度网盘', bg: 'bg-blue-500', text: 'text-white' },
                        quark: { label: '夸克网盘', bg: 'bg-purple-600', text: 'text-white' },
                        aliyun: { label: '阿里云盘', bg: 'bg-amber-500', text: 'text-white' },
                        lanzou: { label: '蓝奏云盘', bg: 'bg-sky-500', text: 'text-white' },
                        google: { label: 'Google Drive', bg: 'bg-emerald-600', text: 'text-white' },
                        xunlei: { label: '迅雷云盘', bg: 'bg-indigo-600', text: 'text-white' },
                        '115': { label: '115 网盘', bg: 'bg-rose-600', text: 'text-white' },
                        other: { label: '网盘资源', bg: 'bg-zinc-700', text: 'text-white' }
                      };

                      const platInfo = platformMap[nd.platform] || platformMap.other;

                      return (
                        <div
                          key={nd.id}
                          className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-3 transition-all hover:border-blue-400/50"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-black shrink-0 ${platInfo.bg} ${platInfo.text}`}>
                                {platInfo.label}
                              </span>
                              <div>
                                <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                                  {nd.title}
                                </h5>
                                {nd.note && (
                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                                    💡 备注: {nd.note}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {/* Link Verification Button (Always Clickable) */}
                              <a
                                href={nd.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center gap-1 border border-blue-200 dark:border-blue-800 hover:underline shrink-0"
                                title="购买前先验证链接有效性"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>检验网盘链接</span>
                              </a>

                              {nd.isPaid && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 shrink-0">
                                  <Coins className="w-3 h-3" />
                                  <span>{nd.price || 5} 积分 / Lv.{nd.requiredLevel || 2}+</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {isUnlocked ? (
                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg">
                              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                                {nd.code && (
                                  <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-zinc-400 text-[11px]">提取码:</span>
                                    <span className="font-bold text-rose-600 dark:text-rose-400">{nd.code}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(nd.code || '');
                                        setCopiedNetdiskCodeId(`code-${nd.id}`);
                                        setTimeout(() => setCopiedNetdiskCodeId(null), 2000);
                                      }}
                                      className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-blue-600"
                                    >
                                      {copiedNetdiskCodeId === `code-${nd.id}` ? '已复制' : '复制'}
                                    </button>
                                  </div>
                                )}

                                {nd.unzipCode && (
                                  <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-zinc-400 text-[11px]">解压密码:</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{nd.unzipCode}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(nd.unzipCode || '');
                                        setCopiedNetdiskCodeId(`unzip-${nd.id}`);
                                        setTimeout(() => setCopiedNetdiskCodeId(null), 2000);
                                      }}
                                      className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-blue-600"
                                    >
                                      {copiedNetdiskCodeId === `unzip-${nd.id}` ? '已复制' : '复制'}
                                    </button>
                                  </div>
                                )}
                              </div>

                              <a
                                href={nd.url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>跳转网盘下载</span>
                              </a>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>提取码及解压密码解锁后显示</span>
                              </span>

                              <button
                                type="button"
                                disabled={unlockingNetdiskId === nd.id}
                                onClick={async () => {
                                  if (!currentUser) {
                                    onOpenAuthModal();
                                    return;
                                  }
                                  if (!onUnlockNetdisk) return;
                                  setUnlockingNetdiskId(nd.id);
                                  await onUnlockNetdisk(article.id, nd.id);
                                  setUnlockingNetdiskId(null);
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                              >
                                <Coins className="w-3.5 h-3.5" />
                                <span>{nd.price ? `使用 ${nd.price} 积分解密` : '会员极速解锁'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Author Signature Card & Copyright Notice */}
            <div className="mt-10 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={profile?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                    alt={profile?.name || "博主"}
                    className="w-12 h-12 rounded-full object-cover border-2 border-rose-500 shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                        {profile?.name || "三疯Sanfun"}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                        博主
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {profile?.tagline || profile?.bio || "分享设计和科技生活 · 全栈开发与视觉工学"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSubscribed(true);
                      setTimeout(() => setSubscribed(false), 3000);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    {subscribed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                    <span>{subscribed ? '已订阅' : '订阅更新'}</span>
                  </button>
                </div>
              </div>

              {/* Copyright Statement */}
              <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-700/60 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                <p className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>本文采用 ALL 权限创作，采用 CC BY-NC-ND 4.0 许可协议</span>
                </p>
                <p className="text-[11px] text-zinc-400">
                  转载请保留完整出处与原文链接，非商业用途授权开放。
                </p>
              </div>
            </div>

            {/* Bottom Article Tag Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                {article.tags.map(t => (
                  <span key={t} className="px-3 py-1 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer">
                    #{t}
                  </span>
                ))}
              </div>

              <span className="text-xs text-rose-500 hover:underline cursor-pointer font-medium">
                反馈与投诉
              </span>
            </div>

          </div>

          {/* Recommended Articles Grid ("喜欢这篇文章的人也看了") */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-rose-500" />
              <span>喜欢这篇文章的人也看了</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedArticles.map(rec => (
                <div
                  key={rec.id}
                  onClick={() => onSelectArticle && onSelectArticle(rec)}
                  className={`p-4 rounded-xl bg-gradient-to-r ${rec.coverBg || 'from-rose-500 to-orange-400'} text-white shadow-md hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[120px]`}
                >
                  <div className="relative z-10">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-white/90">
                      {rec.category}
                    </span>
                    <h4 className="text-sm font-bold mt-2 leading-snug line-clamp-2 group-hover:underline">
                      {rec.title}
                    </h4>
                  </div>

                  <div className="relative z-10 flex items-center justify-between mt-3 text-[11px] text-white/80">
                    <span>{rec.date}</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3" />
                      {rec.views}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section ("评论 12") */}
          <div id="comment-section" className="bg-white dark:bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-500" />
                <span>评论 ({comments.length})</span>
              </h3>

              {/* Form Mode Tabs */}
              {currentUser && (
                <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setCommentTab('write')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      commentTab === 'write' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'
                    }`}
                  >
                    使用md格式交谈
                  </button>
                  <button
                    onClick={() => setCommentTab('preview')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      commentTab === 'preview' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500'
                    }`}
                  >
                    预览评论
                  </button>
                </div>
              )}
            </div>

            {/* Login Enforcement & Comment Form */}
            {!currentUser ? (
              <div className="mb-8 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-center space-y-3">
                <Lock className="w-8 h-8 text-rose-500 mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">评论区已开启注册登录权限</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">只有登录或注册账号的用户才可以参与互动评论、解锁独家资源与发表见解哦！</p>
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold text-xs shadow-md hover:opacity-90 transition-all inline-flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>立即登录 / 免费注册账号</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCommentSubmit} className="mb-8 space-y-3">
                {commentTab === 'write' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900/60 shrink-0">
                        <User className="w-3.5 h-3.5" />
                        <span>{currentUser.username}</span>
                        <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-md font-mono">
                          {currentUser.level || 'Lv.1'}
                        </span>
                      </div>

                      {/* Comment Toolbars: Emoji & Image upload */}
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-bold flex items-center gap-1 hover:bg-amber-100 transition-colors"
                        >
                          <Smile className="w-3.5 h-3.5" />
                          <span>常用表情</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const url = prompt('请输入评论附带的图片网络链接 (URL):', commentImage);
                            if (url !== null) setCommentImage(url.trim());
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1 hover:bg-blue-100 transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{commentImage ? '修改图片' : '插图配图'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Emoji Preset Grid */}
                    {showEmojiPicker && (
                      <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 grid grid-cols-8 sm:grid-cols-12 gap-2 text-base text-center animate-fadeIn">
                        {['👍','❤️','🔥','🎉','😂','👏','🚀','💡','💯','🙏','✨','🤔','🍺','🌟','🎯','📌','😃','😎','🍿','⚡','🎒','💻','📝','💎'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setCommentText(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-transform hover:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Image preview banner */}
                    {commentImage && (
                      <div className="relative inline-block group">
                        <img
                          src={commentImage}
                          alt="评论配图预览"
                          className="h-20 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setCommentImage('')}
                          className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full text-[10px] font-bold shadow-xs hover:bg-rose-600"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <textarea
                      rows={3}
                      placeholder="支持 Markdown 格式，发表你的独特见解..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 p-3.5 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                      required
                    />

                    {/* Captcha Verification row */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>验证码: {captchaNum1} + {captchaNum2} = ?</span>
                          </span>
                          <button
                            type="button"
                            onClick={generateCaptcha}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            title="换一张"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>

                        <input
                          type="number"
                          placeholder="请输入计算结果..."
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          className="w-36 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          required
                        />
                      </div>

                      {captchaError && (
                        <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{captchaError}</span>
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 min-h-[100px]">
                    {commentText ? commentText : <span className="text-zinc-400 italic">暂无预览内容，请在输入框写下评论</span>}
                  </div>
                )}

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] text-zinc-400">
                    评论带常用表情、支持图片与计算验证码防护
                  </span>
                  <button
                    type="submit"
                    disabled={submitting || !commentText.trim() || !captchaInput.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? '发送中...' : '发送评论'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Comment List */}
            <div className="space-y-6">
              {comments.map((c) => {
                const isCommentAuthor = (c as any).isAuthor || c.level?.includes('博主');
                const commentAuthorName = isCommentAuthor ? (profile?.name || c.author) : c.author;
                const commentAvatar = isCommentAuthor ? (profile?.avatar || c.avatar) : c.avatar;
                return (
                <div key={c.id} className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 space-y-3">
                  
                  {/* Comment User Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={commentAvatar}
                        alt={commentAuthorName}
                        className="w-8 h-8 rounded-full object-cover border border-rose-500/40"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                            {commentAuthorName}
                          </span>
                          {c.level && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              c.level.includes('Lv.7')
                                ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-zinc-950 border-amber-300 font-black animate-pulse shadow-xs'
                                : c.level.includes('Lv.6')
                                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white border-amber-400 font-bold'
                                : c.level.includes('Lv.5')
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400'
                                : c.level.includes('Lv.4')
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300'
                                : c.level.includes('Lv.3')
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
                                : c.level.includes('Lv.2')
                                ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-300'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                            }`}>
                              {c.level}
                            </span>
                          )}
                        </div>

                        {/* User Badges Row */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                          {c.location && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {c.location}
                            </span>
                          )}
                          {c.os && (
                            <span className="flex items-center gap-0.5 font-mono">
                              <Monitor className="w-2.5 h-2.5" />
                              {c.os}
                            </span>
                          )}
                          {c.browser && (
                            <span className="flex items-center gap-0.5 font-mono hidden sm:inline-flex">
                              <Globe className="w-2.5 h-2.5" />
                              {c.browser}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-zinc-400">
                      {c.date}
                    </span>
                  </div>

                  {/* Comment Body */}
                  <div className="pl-10 space-y-2">
                    <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                      {c.content}
                    </p>
                    {c.image && (
                      <img
                        src={c.image}
                        alt="评论配图"
                        className="max-h-52 rounded-xl border border-zinc-200 dark:border-zinc-700 object-cover hover:opacity-95 transition-opacity"
                      />
                    )}
                  </div>

                  {/* Nested Replies List */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="ml-10 mt-3 space-y-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                      {c.replies.map((r) => {
                        const replyAuthorName = r.isAuthor ? (profile?.name || r.author) : r.author;
                        const replyAvatar = r.isAuthor ? (profile?.avatar || r.avatar) : r.avatar;
                        return (
                          <div key={r.id} className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-rose-200/60 dark:border-rose-900/40 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img
                                  src={replyAvatar}
                                  alt={replyAuthorName}
                                  className="w-6 h-6 rounded-full object-cover border border-rose-500"
                                />
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                  {replyAuthorName}
                                </span>
                                {r.isAuthor && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                                    博主
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono">{r.date}</span>
                            </div>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed pl-8">
                              {r.content}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Right Column: Sticky Sidebar Widgets (col-span-3 - Matched to homepage) */}
        <div className="lg:col-span-3 space-y-3 h-full">
          
          {/* Personal Info & Sidebar Widget with TOC inserted after profile card */}
          <SidebarWidget
            profile={profile}
            articles={allArticles}
            moments={moments}
            categories={categories}
            selectedCategory={selectedCategory}
            selectedTag={selectedTag}
            onSelectCategory={onSelectCategory}
            onSelectTag={onSelectTag}
            onSelectArticle={(art) => onSelectArticle && onSelectArticle(art)}
            onTabChange={onTabChange}
            onOpenAIChat={onOpenAIChat}
            onOpenUserMember={onOpenUserMember}
            topAfterProfile={
              headings.length > 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <List className="w-4 h-4 text-rose-500" />
                      <span>文章目录</span>
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={toggleAudioPlayer}
                        className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-[10px] font-bold hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors flex items-center gap-1"
                        title={isPlayingAudio ? '暂停朗读' : '语音朗读'}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{isPlayingAudio ? '暂停' : '朗读'}</span>
                      </button>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold">
                        {headings.length} 章节
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1 text-xs scroll-smooth">
                    {headings.map((h, i) => {
                      const isActive = activeHeadingId === h.id || activeHeadingId === h.text || (!!activeHeadingId && (activeHeadingId.includes(h.text) || h.text.includes(activeHeadingId)));
                      return (
                        <div
                          key={i}
                          onClick={() => scrollToHeading(h.id, h.text)}
                          className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer truncate text-xs flex items-center gap-2 ${
                            isActive
                              ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold shadow-sm translate-x-1'
                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-rose-50/80 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 font-medium'
                          } ${
                            h.level === 1
                              ? 'font-bold'
                              : h.level === 2
                              ? 'ml-3 text-[11.5px]'
                              : 'ml-6 text-[11px] opacity-90'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                            isActive
                              ? 'bg-white scale-125'
                              : h.level === 1
                              ? 'bg-rose-500'
                              : h.level === 2
                              ? 'bg-zinc-400 dark:bg-zinc-600'
                              : 'bg-zinc-300 dark:bg-zinc-700'
                          }`} />
                          <span className="truncate">{h.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            }
          />

        </div>

      </div>

      {/* Floating Bottom Right Next Article Preview Card */}
      {nextArticle && (
        <div 
          onClick={() => onSelectArticle && onSelectArticle(nextArticle)}
          className="fixed bottom-6 right-6 z-40 max-w-xs bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl rounded-2xl p-3.5 cursor-pointer hover:border-rose-500 transition-all transform hover:-translate-y-1 hidden md:block"
        >
          <div className="flex items-center justify-between text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1">
              <Sparkle className="w-3 h-3" />
              <span>下一篇推荐</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {nextArticle.title}
          </p>
        </div>
      )}

    </div>
  );
};
