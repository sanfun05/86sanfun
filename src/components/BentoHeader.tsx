import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Article, HeroRecommendItem, Moment } from '../types';
import { sampleMoments } from '../data/blogData';
import { Sparkles, ArrowRight, ChevronRight, Zap, Star, Compass, Flame, BookOpen, Layers, Terminal, Megaphone } from 'lucide-react';

interface BentoHeaderProps {
  articles: Article[];
  heroItems?: HeroRecommendItem[];
  moments?: Moment[];
  selectedCategory: string;
  selectedTag: string | null;
  onSelectCategory: (cat: string) => void;
  onSelectTag: (tag: string | null) => void;
  onArticleClick: (article: Article) => void;
  onTabChange: (tab: string) => void;
  onOpenAIChat: () => void;
}

export const BentoHeader: React.FC<BentoHeaderProps> = ({
  articles,
  heroItems: customHeroItems,
  moments,
  selectedCategory,
  selectedTag,
  onSelectCategory,
  onSelectTag,
  onArticleClick,
  onTabChange,
  onOpenAIChat,
}) => {
  // Moments Rolling Ticker State
  const momentList = moments && moments.length > 0 ? moments : sampleMoments;
  const [momentIndex, setMomentIndex] = useState(0);

  useEffect(() => {
    if (momentList.length <= 1) return;
    const timer = setInterval(() => {
      setMomentIndex((prev) => (prev + 1) % momentList.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [momentList.length]);

  const currentMoment = momentList[momentIndex] || momentList[0];
  // Default Sanfun Hero Recommend Items matching the official blog
  const defaultHeroItems: HeroRecommendItem[] = [
    {
      id: 'h1',
      title: '三疯敲木鱼App - 打节拍敲音效解压神器',
      subtitle: '支持多种打击音效，敲木鱼积累功德，桌面极简解压神器',
      tag: '★ 全站推荐',
      mascotIcon: '🪵',
      bannerBg: 'from-indigo-600 via-purple-600 to-indigo-700',
      articleId: 'art-4'
    },
    {
      id: 'h2',
      title: '三疯墨AI - 构建具有AI优势的先进网站',
      subtitle: '驱动大语言模型与全栈独立站点架构开发',
      tag: '★ AI 前沿',
      mascotIcon: '🤖',
      bannerBg: 'from-sky-500 to-blue-600',
      articleId: 'art-3'
    },
    {
      id: 'h3',
      title: 'SanfunAwards2025：年度我喜欢的博主',
      subtitle: '寻找优秀的中文独立博客与创作者集合',
      tag: '★ 博客周报',
      mascotIcon: '🏆',
      bannerBg: 'from-amber-500 to-orange-500',
      articleId: 'art-5'
    },
    {
      id: 'h4',
      title: '三疯电子章 - 给PDF快速盖章、骑缝章',
      subtitle: '纯前端本地印章合成与矢量PDF快速加密签名',
      tag: '★ 效率工具',
      mascotIcon: '📜',
      bannerBg: 'from-rose-500 to-pink-500',
      articleId: 'art-6'
    },
    {
      id: 'h5',
      title: '博客六周年记',
      subtitle: '时光荏苒，关于设计、独立开发与持续写作的感悟',
      tag: '★ 随笔记录',
      mascotIcon: '🎂',
      bannerBg: 'from-purple-500 to-indigo-600',
      articleId: 'art-7'
    },
  ];

  // Dynamically build hero items from backend-controlled articles
  const items = React.useMemo(() => {
    if (customHeroItems && customHeroItems.length > 0) return customHeroItems;

    const heroArticle = articles.find(a => a.isHeroFeatured) || articles.find(a => a.featured) || articles[0];
    const sideArticles = articles.filter(a => (a.isBannerRecommend || a.featured) && a.id !== heroArticle?.id);

    const result: HeroRecommendItem[] = [];

    if (heroArticle) {
      result.push({
        id: heroArticle.id,
        title: heroArticle.title,
        subtitle: heroArticle.summary || heroArticle.title,
        tag: '★ 全站推荐',
        mascotIcon: heroArticle.mascotIcon || '🪵',
        bannerBg: heroArticle.coverBg || 'from-purple-600 via-indigo-600 to-blue-600',
        articleId: heroArticle.id,
        article: heroArticle
      });
    }

    const defaultBgs = [
      'from-sky-500 to-blue-600',
      'from-amber-500 to-orange-500',
      'from-rose-500 to-pink-500',
      'from-purple-500 to-indigo-600'
    ];
    const defaultIcons = ['🤖', '🏆', '📜', '🎂'];

    sideArticles.slice(0, 4).forEach((art, i) => {
      result.push({
        id: art.id,
        title: art.title,
        subtitle: art.summary || art.title,
        tag: '★ 精选推荐',
        mascotIcon: art.mascotIcon || defaultIcons[i % defaultIcons.length],
        bannerBg: art.coverBg || defaultBgs[i % defaultBgs.length],
        articleId: art.id,
        article: art
      });
    });

    if (result.length < 5 && articles.length > 0) {
      const existingIds = new Set(result.map(r => r.id));
      const remain = articles.filter(a => !existingIds.has(a.id));
      for (const art of remain) {
        if (result.length >= 5) break;
        const idx = result.length - 1;
        result.push({
          id: art.id,
          title: art.title,
          subtitle: art.summary || art.title,
          tag: '★ 全站推荐',
          mascotIcon: art.mascotIcon || defaultIcons[idx % defaultIcons.length],
          bannerBg: art.coverBg || defaultBgs[idx % defaultBgs.length],
          articleId: art.id,
          article: art
        });
      }
    }

    return result.length > 0 ? result : defaultHeroItems;
  }, [articles, customHeroItems]);

  const [activeIndex, setActiveIndex] = useState(0);

  // Auto carousel rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  const activeItem = items[activeIndex] || items[0];

  // Primary filter pills matching Sanfun
  const filterPills = [
    { label: '精选', cat: '精选', icon: Star, color: 'bg-blue-600 text-white' },
    { label: '热门', cat: '热门', icon: Flame },
    { label: '必看', cat: '必看', icon: Zap },
    { label: '全部文章', cat: '全部', icon: BookOpen },
    { label: '我的项目', cat: '我的项目', icon: Layers, tab: 'projects' },
    { label: '经验分享', cat: '经验分享' },
    { label: '软件推荐', cat: '软件推荐' },
    { label: '好物推荐', cat: '好物推荐' },
    { label: '翻译内容', cat: '翻译内容' },
    { label: '资源中心', cat: '资源中心' },
    { label: '佳作推荐', cat: '佳作推荐' },
    { label: '闲聊杂谈', cat: '闲聊杂谈' },
  ];

  return (
    <section className="mb-3.5 space-y-3">
      {/* 0. JIKE / MOMENTS ROLLING AD TICKER BANNER */}
      {currentMoment && (
        <div
          onClick={() => onTabChange('moments')}
          className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-rose-500/10 dark:from-orange-500/20 dark:via-amber-500/20 dark:to-rose-500/20 border border-orange-500/30 text-zinc-900 dark:text-zinc-100 flex items-center justify-between gap-3 cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/15 transition-all group overflow-hidden shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[11px] flex items-center gap-1.5 shrink-0 shadow-xs tracking-wide">
              <Megaphone className="w-3.5 h-3.5 animate-bounce shrink-0" />
              <span>即刻 / 说说动态</span>
            </div>

            {/* Rolling Ticker Text */}
            <div className="min-w-0 flex-1 overflow-hidden h-5 relative flex items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMoment.id || momentIndex}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate flex items-center gap-2 w-full"
                >
                  {currentMoment.date && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold shrink-0">
                      {currentMoment.date.substring(0, 10)}
                    </span>
                  )}
                  <span className="truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {currentMoment.content}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 shrink-0 group-hover:translate-x-1 transition-transform">
            <span>进入动态</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 1. SANFUN TOP HERO BANNER & RECOMMENDED LIST GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl overflow-hidden shadow-md border border-zinc-200/80 dark:border-zinc-800/80">
        
        {/* Left Large Hero Card (Span 8) */}
        <div className={`lg:col-span-8 relative min-h-[190px] sm:min-h-[225px] bg-gradient-to-br ${activeItem.bannerBg} p-4.5 sm:p-5.5 text-white flex flex-col justify-between overflow-hidden transition-all duration-700 group`}>
          
          {/* Floating Decorative App Stickers Background */}
          <div className="absolute right-3 top-2 bottom-2 w-1/2 opacity-20 pointer-events-none grid grid-cols-3 gap-2 transform rotate-6 scale-100 transition-transform duration-700 group-hover:rotate-3 group-hover:scale-105">
            {['🪵', '🤖', '🏆', '📜', '🎂', '🎨', '💻', '🚀', '⚡'].map((emoji, i) => (
              <div key={i} className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-lg sm:text-xl shadow-md border border-white/30">
                {emoji}
              </div>
            ))}
          </div>

          {/* Top Tag & AI Sparkle Button */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center gap-1.5 shadow-sm">
              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>{activeItem.tag}</span>
            </span>

            <button
              onClick={onOpenAIChat}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">问问 AI 博客助手</span>
            </button>
          </div>

          {/* Main Title & Description */}
          <div className="relative z-10 max-w-2xl my-2">
            <div className="flex items-center gap-2 sm:gap-2.5 mb-1">
              <span className="text-2xl sm:text-4xl drop-shadow-md shrink-0">
                {activeItem.mascotIcon || '🪵'}
              </span>
              <h1 className="text-base sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug drop-shadow-sm text-white line-clamp-2">
                {activeItem.title}
              </h1>
            </div>
            <p className="text-[11px] sm:text-sm text-white/85 line-clamp-1 font-medium leading-relaxed mt-0.5">
              {activeItem.subtitle}
            </p>
          </div>

          {/* Bottom Action Footer & Carousel Indicators */}
          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/20">
            <div className="flex items-center gap-1.5">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeIndex === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                if (activeItem.article) {
                  onArticleClick(activeItem.article);
                  return;
                }
                if (activeItem.articleId) {
                  const foundById = articles.find(a => a.id === activeItem.articleId);
                  if (foundById) {
                    onArticleClick(foundById);
                    return;
                  }
                }
                const cleanItemTitle = (activeItem.title || '').replace(/[-：:—\s]/g, '');
                const matched = articles.find(a => {
                  const cleanArtTitle = (a.title || '').replace(/[-：:—\s]/g, '');
                  return cleanArtTitle.includes(cleanItemTitle) || cleanItemTitle.includes(cleanArtTitle);
                });
                if (matched) {
                  onArticleClick(matched);
                } else if (articles.length > 0) {
                  onArticleClick(articles[0]);
                } else if (activeItem.url) {
                  window.open(activeItem.url, '_blank');
                }
              }}
              className="px-3.5 py-1.5 rounded-md bg-white text-zinc-950 hover:bg-amber-300 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 group-hover:scale-105"
            >
              <span>查看详情</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Recommended List Panel (Span 4 - Doubled width) */}
        <div className="lg:col-span-4 bg-indigo-600 dark:bg-indigo-950/90 text-white p-4 sm:p-4.5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-indigo-500/30">
          <div>
            <div className="flex items-center justify-between text-xs font-bold tracking-wider text-indigo-200 uppercase mb-2">
              <span className="flex items-center gap-1.5 truncate">
                <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">全站精选推荐</span>
              </span>
              <span className="font-mono text-xs opacity-70 shrink-0">
                0{activeIndex + 1} / 0{items.length}
              </span>
            </div>

            <div className="space-y-1.5">
              {items.map((item, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => setActiveIndex(idx)}
                    className={`p-2 sm:p-2.5 rounded-md cursor-pointer transition-all duration-200 flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-white text-indigo-950 font-bold shadow-md scale-[1.01]'
                        : 'hover:bg-white/10 text-white/90'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-xs shadow-xs ${
                      isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-white/20 text-white'
                    }`}>
                      {item.mascotIcon || '📌'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs truncate leading-tight font-bold">
                        {item.title}
                      </h4>
                      <p className={`text-[10px] truncate ${isActive ? 'text-indigo-700' : 'text-indigo-200'}`}>
                        {item.subtitle}
                      </p>
                    </div>

                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
            <span className="truncate">关联看点</span>
            <button
              onClick={() => onTabChange('projects')}
              className="font-bold hover:text-white flex items-center gap-1 shrink-0"
            >
              <span>查看全部项目</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. SANFUN HORIZONTAL FILTER PILLS ROW */}
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
        {filterPills.map((pill) => {
          const IconComp = pill.icon;
          const isSelected = selectedCategory === pill.cat || (pill.cat === '精选' && selectedCategory === '精选');
          return (
            <button
              key={pill.label}
              onClick={() => {
                if (pill.tab) {
                  onTabChange(pill.tab);
                } else {
                  onSelectCategory(pill.cat === '全部' ? '全部' : pill.cat);
                  onSelectTag(null);
                }
              }}
              className={`px-3.5 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 shadow-2xs ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80'
              }`}
            >
              {IconComp && <IconComp className="w-3.5 h-3.5 shrink-0" />}
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

    </section>
  );
};


