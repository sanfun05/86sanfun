import React, { useState, useEffect } from 'react';
import { AuthorProfile, Article, Moment } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles, Calendar, Github, Heart, MessageSquareQuote, ChevronRight, ShieldCheck, Tag, ExternalLink, QrCode, Flame,
  MessageCircle, MessageSquare, Mail, Twitter, Tv, Send, Globe, Bookmark, Link as LinkIcon, AtSign, Share2, Compass, Video,
  Clock, Crown
} from 'lucide-react';

interface SidebarWidgetProps {
  profile: AuthorProfile;
  articles: Article[];
  moments: Moment[];
  categories: string[];
  selectedCategory: string;
  selectedTag: string | null;
  onSelectCategory: (cat: string) => void;
  onSelectTag: (tag: string | null) => void;
  onSelectArticle: (article: Article) => void;
  onTabChange: (tab: string) => void;
  onOpenAIChat: () => void;
  topAfterProfile?: React.ReactNode;
  onOpenUserMember?: () => void;
}

// Icon mapper for custom contact links
const renderContactIcon = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case 'github': return <Github className="w-4 h-4" />;
    case 'wechat':
    case 'messagecircle': return <MessageCircle className="w-4 h-4 text-emerald-300" />;
    case 'qq':
    case 'messagesquare': return <MessageSquare className="w-4 h-4 text-sky-300" />;
    case 'mail':
    case 'email': return <Mail className="w-4 h-4 text-amber-300" />;
    case 'twitter':
    case 'x': return <Twitter className="w-4 h-4 text-cyan-300" />;
    case 'bilibili':
    case 'tv': return <Tv className="w-4 h-4 text-pink-300" />;
    case 'telegram':
    case 'send': return <Send className="w-4 h-4 text-blue-300" />;
    case 'xiaohongshu':
    case 'heart': return <Heart className="w-4 h-4 text-rose-300" />;
    case 'qrcode': return <QrCode className="w-4 h-4 text-teal-300" />;
    case 'zhihu':
    case 'juejin':
    case 'bookmark': return <Bookmark className="w-4 h-4 text-indigo-300" />;
    case 'globe':
    case 'website': return <Globe className="w-4 h-4 text-emerald-300" />;
    case 'calendar':
    case 'moments': return <Calendar className="w-4 h-4 text-amber-300" />;
    case 'video':
    case 'douyin': return <Video className="w-4 h-4 text-purple-300" />;
    case 'flame':
    case 'rss': return <Flame className="w-4 h-4 text-orange-300" />;
    default: return <LinkIcon className="w-4 h-4" />;
  }
};

export const SidebarWidget: React.FC<SidebarWidgetProps> = ({
  profile,
  articles,
  moments,
  categories,
  selectedCategory,
  selectedTag,
  onSelectCategory,
  onSelectTag,
  onSelectArticle,
  onTabChange,
  onOpenAIChat,
  topAfterProfile,
  onOpenUserMember
}) => {
  const { accentClasses } = useTheme();

  // State for 12 Recent Upgraded Members
  const [recentMembers, setRecentMembers] = useState<Array<{
    id?: string;
    username: string;
    avatar: string;
    level: string;
    levelNumeric?: number;
    createdAt?: string;
  }>>([]);

  useEffect(() => {
    fetch('/api/members/recent')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRecentMembers(data.slice(0, 12));
        }
      })
      .catch(() => {});
  }, []);

  const fallback12Members = [
    { username: '代码吟游诗人', level: 'Lv.7 冠世尊者', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200' },
    { username: '独立开发者', level: 'Lv.7 冠世尊者', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' },
    { username: 'Bento设计师', level: 'Lv.6 荣耀SVIP', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200' },
    { username: '灵感工程师', level: 'Lv.6 荣耀SVIP', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200' },
    { username: '前端狂想曲', level: 'Lv.5 星耀 VIP', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
    { username: 'Swift先锋', level: 'Lv.5 星耀 VIP', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200' },
    { username: '开源贡献者', level: 'Lv.5 星耀 VIP', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
    { username: 'AI创作者', level: 'Lv.4 钻石会员', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200' },
    { username: 'UI设计大咖', level: 'Lv.4 钻石会员', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
    { username: '全栈发烧友', level: 'Lv.3 黄金会员', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200' },
    { username: '数字游民', level: 'Lv.3 黄金会员', avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=200' },
    { username: '极客体验官', level: 'Lv.2 白银会员', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' }
  ];

  const displayMembers = recentMembers.length > 0 ? recentMembers : fallback12Members;

  // Sponsor friend tags matching the screenshot
  const sponsorTags = [
    "草东日记", "Adil", "HaoUp", "极数本源", "MysticStars", "Temp Mail",
    "好主机", "狄伊", "webfem", "蓝易云CDN", "西风往事", "繁中方块社", "中文独立博客聚合站"
  ];

  // Default promo blocks if profile.sidebarPromos is empty or undefined
  const defaultPromos = [
    {
      id: 'promo_wechat',
      title: '公众号',
      badgeText: '微信',
      subtitle: '快人一步获取最新文章 ▶',
      icon: '💬',
      bgGradient: 'from-emerald-500 via-teal-500 to-green-600',
      linkUrl: 'alert:欢迎关注公众号【微信】：快人一步获取最新科技文章与设计工具！'
    },
    {
      id: 'promo_openclaw',
      title: '将本博客接入到你的 OpenClaw',
      badgeText: 'AI 架构',
      subtitle: '开放 AI 智能体应用架构',
      icon: '🐱',
      bgGradient: 'from-orange-500 via-rose-500 to-red-500',
      linkUrl: 'action:projects'
    }
  ];

  const promoBlocks = profile.sidebarPromos && profile.sidebarPromos.length > 0
    ? profile.sidebarPromos
    : defaultPromos;

  const contactLinks = profile.customLinks && profile.customLinks.length > 0
    ? profile.customLinks
    : [
        { id: 'moments', name: '归档动态', icon: 'Calendar', url: 'action:moments' },
        { id: 'github', name: 'GitHub', icon: 'Github', url: profile.socials?.github || 'https://github.com' },
        { id: 'email', name: 'Email', icon: 'Mail', url: profile.socials?.email ? `mailto:${profile.socials.email}` : 'mailto:sanfun185@gmail.com' },
        { id: 'bilibili', name: 'Bilibili', icon: 'Bilibili', url: profile.socials?.bilibili || 'https://bilibili.com' }
      ];

  return (
    <aside className="space-y-3 h-full">
      
      {/* 1. SANFUN AUTHOR PROFILE CARD (Blue Gradient with avatar & flexible height) */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white rounded-xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[350px] transition-all duration-300">
        
        {/* Top Motto / Status Banner */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-2xs truncate max-w-[180px]">
            {profile.statusText || '坚持是最好的老师'}
          </span>
          <span className="text-xl shrink-0">{profile.statusEmoji || '🤩'}</span>
        </div>

        {/* Central Avatar & Info */}
        <div className="flex flex-col items-center text-center my-2">
          <div className="relative mb-2.5 group">
            <img
              src={profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"}
              alt={profile.name}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-white/30 shadow-2xl border-2 border-white/20 group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute bottom-1 right-1 text-xl bg-white/95 dark:bg-zinc-900/95 rounded-full p-1 shadow-md border border-white/50 backdrop-blur-sm leading-none flex items-center justify-center shrink-0">
              {profile.statusEmoji || '🤩'}
            </span>
          </div>

          <h3 className="text-xl font-black tracking-tight flex items-center gap-1.5 text-white">
            <span>{profile.name || '三疯Sanfun'}</span>
            <ShieldCheck className="w-4.5 h-4.5 text-amber-300 shrink-0" />
          </h3>
          <p className="text-xs text-white/85 font-medium mt-1 leading-relaxed max-w-[200px]">
            {profile.tagline || '分享设计与科技生活'}
          </p>
        </div>

        {/* Bottom Custom Contact Icons & Ask AI */}
        <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-center gap-2">
          {contactLinks.map((link) => {
            const isMoments = link.url === 'action:moments' || link.id === 'moments';
            
            if (isMoments) {
              return (
                <button
                  key={link.id || link.name}
                  onClick={() => onTabChange('moments')}
                  className="p-2.5 rounded-lg bg-white/15 hover:bg-white/30 text-white border border-white/20 hover:border-white/40 transition-all shadow-2xs hover:scale-105"
                  title={link.name || "归档与动态"}
                >
                  <Calendar className="w-4 h-4" />
                </button>
              );
            }

            return (
              <a
                key={link.id || link.name}
                href={link.url.startsWith('http') || link.url.startsWith('mailto') ? link.url : '#'}
                onClick={(e) => {
                  if (link.url.startsWith('alert:')) {
                    e.preventDefault();
                    alert(link.url.replace('alert:', ''));
                  }
                }}
                target={link.url.startsWith('http') ? "_blank" : "_self"}
                rel="noreferrer"
                className="p-2.5 rounded-lg bg-white/15 hover:bg-white/30 text-white border border-white/20 hover:border-white/40 transition-all shadow-2xs hover:scale-105 flex items-center justify-center"
                title={link.name}
              >
                {renderContactIcon(link.icon)}
              </a>
            );
          })}

          <button
            onClick={onOpenAIChat}
            className="px-3.5 py-2 rounded-lg bg-white text-indigo-950 font-bold text-xs hover:bg-amber-300 hover:text-indigo-950 transition-colors shadow-sm flex items-center gap-1.5 shrink-0 ml-1"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>问 AI</span>
          </button>
        </div>
      </div>

      {/* STICKY CONTAINER FOR MODULES BELOW PROFILE CARD */}
      <div className="sticky top-20 space-y-3">
        {/* TOP AFTER PROFILE SLOT (e.g. Table of Contents in Article Detail) */}
        {topAfterProfile}

        {/* DYNAMIC SIDEBAR PROMO CARDS */}
        {promoBlocks.map((promo) => {
          const handleCardClick = () => {
            if (!promo.linkUrl) return;
            if (promo.linkUrl.startsWith('action:')) {
              const tabName = promo.linkUrl.replace('action:', '');
              onTabChange(tabName);
            } else if (promo.linkUrl.startsWith('alert:')) {
              alert(promo.linkUrl.replace('alert:', ''));
            } else if (promo.linkUrl.startsWith('http://') || promo.linkUrl.startsWith('https://')) {
              window.open(promo.linkUrl, promo.target || '_blank', 'noopener,noreferrer');
            } else if (promo.linkUrl.startsWith('#')) {
              const tabName = promo.linkUrl.replace('#', '');
              onTabChange(tabName);
            }
          };

          const isExternal = promo.linkUrl.startsWith('http://') || promo.linkUrl.startsWith('https://');

          return (
            <div
              key={promo.id || promo.title}
              onClick={handleCardClick}
              className={`bg-gradient-to-r ${promo.bgGradient || 'from-emerald-500 via-teal-500 to-green-600'} text-white rounded-lg p-4.5 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform flex items-center justify-between group`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-md bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  {promo.icon && (promo.icon.startsWith('http') || promo.icon.startsWith('data:') || promo.icon.startsWith('/')) ? (
                    <img src={promo.icon} alt={promo.title} className="w-full h-full object-cover rounded-md" />
                  ) : (
                    <span>{promo.icon || '📌'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold flex items-center gap-1">
                    <span className="truncate">{promo.title}</span>
                    {promo.badgeText && (
                      <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-xs font-mono shrink-0">
                        {promo.badgeText}
                      </span>
                    )}
                  </h4>
                  {promo.subtitle && (
                    <p className="text-xs text-white/90 font-medium mt-0.5 truncate">
                      {promo.subtitle}
                    </p>
                  )}
                </div>
              </div>
              {isExternal ? (
                <ExternalLink className="w-4 h-4 text-white/70 group-hover:scale-110 transition-transform shrink-0 ml-2" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
              )}
            </div>
          );
        })}

        {/* 4. 👑 正在升级会员 */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-lg p-5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3">
            <span className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              <span>正在升级会员</span>
            </span>
            <button
              onClick={() => onOpenUserMember ? onOpenUserMember() : onTabChange('home')}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>升级会员</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Featured Recent Member Banner */}
          {displayMembers[0] && (
            <div
              onClick={() => onOpenUserMember ? onOpenUserMember() : onTabChange('home')}
              className="p-2.5 rounded-md bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 dark:border-amber-500/30 cursor-pointer hover:border-amber-500/50 transition-all mb-3 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={displayMembers[0].avatar}
                  alt={displayMembers[0].username}
                  className="w-8 h-8 rounded-full object-cover border border-amber-400/50 shrink-0 shadow-2xs"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {displayMembers[0].username}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white shrink-0">
                      {displayMembers[0].level.split(' ')[0] || displayMembers[0].level}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium truncate mt-0.5">
                    ✨ 专属高级会员特权已激活
                  </p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            </div>
          )}

          {/* Grid of 12 Recent Upgraded Members (2 columns) */}
          <div className="grid grid-cols-2 gap-1.5">
            {displayMembers.slice(0, 12).map((m, idx) => (
              <div
                key={m.username + idx}
                onClick={() => onOpenUserMember ? onOpenUserMember() : onTabChange('home')}
                className="p-1.5 rounded-md bg-zinc-50 dark:bg-zinc-800/40 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-zinc-100 dark:border-zinc-800/80 cursor-pointer transition-all flex items-center gap-1.5 min-w-0 group"
              >
                <img
                  src={m.avatar}
                  alt={m.username}
                  className="w-5 h-5 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                />
                <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                    {m.username}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0 font-bold">
                    {m.level.split(' ')[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. 🔥 今日热门 */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-lg p-5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500 fill-rose-500/20" />
              <span>今日热门</span>
            </span>
            <button
              onClick={() => onTabChange('articles')}
              className="text-[11px] text-zinc-400 hover:text-indigo-600 transition-colors font-normal"
            >
              更多
            </button>
          </div>

          <div className="space-y-2.5">
            {articles.slice(0, 5).map((article, idx) => (
              <div
                key={article.id}
                onClick={() => onSelectArticle(article)}
                className="flex items-start gap-2.5 cursor-pointer group text-xs"
              >
                <span className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center font-bold text-[10px] ${
                  idx === 0 ? 'bg-indigo-600 text-white' :
                  idx === 1 ? 'bg-blue-500 text-white' :
                  idx === 2 ? 'bg-sky-500 text-white' :
                  'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'
                }`}>
                  {idx + 1}
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 leading-snug font-medium">
                  {article.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 6. 🕒 最近发布 */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-lg p-5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-zinc-800 dark:text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>最近发布</span>
            </span>
            <button
              onClick={() => onTabChange('articles')}
              className="text-[11px] text-zinc-400 hover:text-indigo-600 transition-colors font-normal"
            >
              更多
            </button>
          </div>

          <div className="space-y-2.5">
            {[...articles]
              .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
              .slice(0, 5)
              .map((article, idx) => (
                <div
                  key={article.id}
                  onClick={() => onSelectArticle(article)}
                  className="flex items-start gap-2.5 cursor-pointer group text-xs"
                >
                  <span className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center font-bold text-[10px] ${
                    idx === 0 ? 'bg-emerald-600 text-white' :
                    idx === 1 ? 'bg-teal-500 text-white' :
                    idx === 2 ? 'bg-cyan-500 text-white' :
                    'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'
                  }`}>
                    {idx + 1}
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 leading-snug font-medium">
                    {article.title}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>

    </aside>
  );
};

