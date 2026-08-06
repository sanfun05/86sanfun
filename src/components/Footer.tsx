import React from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Github, Twitter, Mail, Sparkles, Compass,
  Calendar, Heart, MessageCircle, MessageSquare,
  Tv, Send, Globe, Bookmark, Link as LinkIcon, Video, Flame, QrCode,
  ShieldCheck
} from 'lucide-react';
import { SiteConfig, AuthorProfile, ModuleLayoutConfig } from '../types';

interface FooterProps {
  totalArticles: number;
  totalMoments: number;
  onOpenAIChat: () => void;
  onOpenAdmin?: () => void;
  siteConfig?: SiteConfig;
  profile?: AuthorProfile;
  layoutConfig?: ModuleLayoutConfig;
  onTabChange?: (tab: string) => void;
}

const renderFooterIcon = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case 'github': return <Github className="w-4 h-4" />;
    case 'wechat':
    case 'messagecircle': return <MessageCircle className="w-4 h-4" />;
    case 'qq':
    case 'messagesquare': return <MessageSquare className="w-4 h-4" />;
    case 'mail':
    case 'email': return <Mail className="w-4 h-4" />;
    case 'twitter':
    case 'x': return <Twitter className="w-4 h-4" />;
    case 'bilibili':
    case 'tv': return <Tv className="w-4 h-4" />;
    case 'telegram':
    case 'send': return <Send className="w-4 h-4" />;
    case 'xiaohongshu':
    case 'heart': return <Heart className="w-4 h-4" />;
    case 'qrcode': return <QrCode className="w-4 h-4" />;
    case 'zhihu':
    case 'juejin':
    case 'bookmark': return <Bookmark className="w-4 h-4" />;
    case 'globe':
    case 'website': return <Globe className="w-4 h-4" />;
    case 'calendar':
    case 'moments': return <Calendar className="w-4 h-4" />;
    case 'video':
    case 'douyin': return <Video className="w-4 h-4" />;
    case 'flame':
    case 'rss': return <Flame className="w-4 h-4" />;
    case 'admin':
    case 'shieldcheck': return <ShieldCheck className="w-4 h-4" />;
    default: return <LinkIcon className="w-4 h-4" />;
  }
};

export const Footer: React.FC<FooterProps> = ({ totalArticles, totalMoments, onOpenAIChat, onOpenAdmin, siteConfig, profile, layoutConfig, onTabChange }) => {
  const { accentClasses } = useTheme();

  const siteTitle = profile?.customLogoText || siteConfig?.logoText || siteConfig?.siteTitle || 'Sanfun';
  const icp = siteConfig?.icpNumber || '粤ICP备2021000000号-1';

  const adaptiveWidthClass = layoutConfig?.enableAdaptiveWidth === false
    ? 'max-w-6xl'
    : (layoutConfig?.adaptiveMaxWidth || 'max-w-[1440px]');

  const footerLinks = profile?.customLinks && profile.customLinks.length > 0
    ? profile.customLinks
    : [
        { id: 'moments', name: '归档动态', icon: 'Calendar', url: 'action:moments' },
        { id: 'github', name: 'GitHub', icon: 'Github', url: profile?.socials?.github || 'https://github.com' },
        { id: 'email', name: 'Email', icon: 'Mail', url: profile?.socials?.email ? `mailto:${profile.socials.email}` : 'mailto:sanfun185@gmail.com' },
        { id: 'bilibili', name: 'Bilibili', icon: 'Bilibili', url: profile?.socials?.bilibili || 'https://bilibili.com' }
      ];

  return (
    <footer className="mt-8 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md pt-5 pb-5 transition-colors duration-300">
      <div className={`${adaptiveWidthClass} w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-4 transition-all duration-300`}>
        
        {/* Top Footer Banner / Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-1.5">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs shadow-xs shadow-indigo-500/25 bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-500 border border-white/20 shrink-0">
                {siteTitle ? siteTitle[0].toUpperCase() : 'S'}
              </div>
              <span className="font-black text-sm tracking-tight text-zinc-900 dark:text-zinc-100 font-sans flex items-center gap-1.5">
                <span>{siteTitle}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">数字花园</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md leading-snug">
              {siteConfig?.siteSubtitle || '设计即态度。专注于构建无障碍 UI 系统、全栈 Web 应用与 AI 智能体验，探索技术与美学的结合。'}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{siteTitle} OS • 智能摘要与全站算法已就绪</span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="md:col-span-4 space-y-1.5">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>快速导航</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
              <button onClick={() => onTabChange?.('home')} className="text-left text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                • 博客首页
              </button>
              <button onClick={() => onTabChange?.('articles')} className="text-left text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                • 文章文库 ({totalArticles})
              </button>
              <button onClick={() => onTabChange?.('columns')} className="text-left text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                • 专栏分类
              </button>
              <button onClick={() => onTabChange?.('friends')} className="text-left text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                • 友链朋友圈
              </button>
            </div>
          </div>

          {/* AI Assistance & Stats */}
          <div className="md:col-span-3 space-y-1.5">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              AI 助手 & 数据
            </div>
            <div className="bg-zinc-100/80 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Gemini 3.6 Flash</span>
                <button
                  onClick={onOpenAIChat}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-white shadow-xs hover:opacity-90 transition-all ${accentClasses.bg}`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>智能提问</span>
                </button>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-1 flex justify-between">
                <span>文章: {totalArticles} 篇</span>
                <span>动态: {totalMoments} 条</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>© {siteConfig?.copyrightYear || '2026'} <strong className="text-zinc-800 dark:text-zinc-200 font-sans">{siteTitle}</strong>. 保留所有权利。</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="font-mono text-[11px] hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer">{icp}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {footerLinks.map((link) => {
              const isAction = link.url?.startsWith('action:');
              if (isAction) {
                const actionTab = link.url.replace('action:', '');
                return (
                  <button
                    key={link.id || link.name}
                    onClick={() => {
                      if (actionTab === 'admin') {
                        onOpenAdmin?.();
                      } else {
                        onTabChange?.(actionTab);
                      }
                    }}
                    className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center cursor-pointer"
                    title={link.name}
                  >
                    {renderFooterIcon(link.icon)}
                  </button>
                );
              }
              return (
                <a
                  key={link.id || link.name}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center"
                  title={link.name}
                >
                  {renderFooterIcon(link.icon)}
                </a>
              );
            })}

            {onOpenAdmin && !footerLinks.some(l => l.id === 'admin' || l.url === 'action:admin') && (
              <button
                onClick={onOpenAdmin}
                className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center cursor-pointer"
                title="后台管理"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
