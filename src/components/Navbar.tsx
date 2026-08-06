import React, { useState } from 'react';
import { useTheme, AccentColor } from '../context/ThemeContext';
import { Home, Search, Moon, Sun, Sparkles, Menu, X, Palette, BookOpen, Clock, FolderGit2, Monitor, Users, ShieldCheck, Shuffle, ExternalLink, ChevronDown, User, Award, Coins } from 'lucide-react';
import { SiteConfig, NavItem, AuthorProfile, UserMember, ModuleLayoutConfig } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenAIChat: () => void;
  onOpenAdmin: () => void;
  onRandomArticle?: () => void;
  siteConfig?: SiteConfig;
  profile?: AuthorProfile;
  customNavItems?: NavItem[];
  currentUser?: UserMember | null;
  onOpenUserMemberModal?: () => void;
  layoutConfig?: ModuleLayoutConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenAIChat,
  onOpenAdmin,
  onRandomArticle,
  siteConfig,
  profile,
  customNavItems,
  currentUser = null,
  onOpenUserMemberModal,
  layoutConfig
}) => {
  const { darkMode, toggleDarkMode, accentColor, setAccentColor, accentClasses } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const defaultNavItems: NavItem[] = [
    { id: 'home', label: '首页', icon: 'Home' },
    { id: 'articles', label: '文库', icon: 'BookOpen' },
    { id: 'columns', label: '专栏', icon: 'FolderGit2' },
    { id: 'friends', label: '友链', icon: 'Users' },
    { id: 'equipment', label: '我的', icon: 'Monitor' },
  ];

  const navItems = customNavItems && customNavItems.length > 0 ? customNavItems : defaultNavItems;

  const iconMap: Record<string, any> = {
    Home,
    BookOpen,
    FolderGit2,
    Users,
    Monitor,
  };

  const colors: { id: AccentColor; name: string; hex: string }[] = [
    { id: 'blue', name: 'Sanfun 蓝', hex: '#3b82f6' },
    { id: 'purple', name: '紫罗兰', hex: '#a855f7' },
    { id: 'emerald', name: '翡翠绿', hex: '#10b981' },
    { id: 'amber', name: '暖琥珀', hex: '#f59e0b' },
    { id: 'rose', name: '玫瑰红', hex: '#f43f5e' },
  ];

  const logoText = profile?.customLogoText || siteConfig?.logoText || siteConfig?.siteTitle || 'Sanfun';
  const logoImage = profile?.customLogoUrl || siteConfig?.logoImageUrl;
  const logoType = profile?.customLogoType || siteConfig?.logoType || (logoImage ? 'image' : 'icon');
  const logoLink = profile?.customLogoLink;

  const handleLogoClick = () => {
    if (logoLink && logoLink.trim()) {
      const link = logoLink.trim();
      if (link.startsWith('http://') || link.startsWith('https://')) {
        window.open(link, '_blank');
        return;
      } else if (link.startsWith('#')) {
        const tab = link.replace('#', '');
        if (tab) setActiveTab(tab);
        return;
      }
    }
    setActiveTab('home');
  };

  const adaptiveWidthClass = layoutConfig?.enableAdaptiveWidth === false
    ? 'max-w-6xl'
    : (layoutConfig?.adaptiveMaxWidth || 'max-w-[1440px]');

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors duration-300">
      <div className={`${adaptiveWidthClass} w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between transition-all duration-300`}>
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2.5 cursor-pointer group" onClick={handleLogoClick} title={logoLink ? `跳转至: ${logoLink}` : '返回首页'}>
          {logoType === 'image' && logoImage ? (
            <img
              src={logoImage}
              alt={logoText}
              className="w-8.5 h-8.5 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs group-hover:scale-105 transition-transform"
            />
          ) : logoType === 'text' ? null : (
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/25 border border-white/20 group-hover:scale-105 transition-transform">
              {logoText ? logoText[0].toUpperCase() : 'S'}
            </div>
          )}
          <span className="font-black text-xl tracking-tight text-zinc-900 dark:text-zinc-100 font-sans flex items-center gap-1.5">
            <span>{logoText}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">BLOG</span>
          </span>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-zinc-100/80 dark:bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
          {navItems.map((item) => {
            const Icon = item.icon ? (iconMap[item.icon] || Home) : Home;
            const isActive = activeTab === item.id;
            const hasSub = item.subItems && item.subItems.length > 0;

            if (item.isExternal && item.url) {
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target={item.target || '_blank'}
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              );
            }

            if (hasSub) {
              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? accentClasses.text : ''}`} />
                    <span>{item.label}</span>
                    <ChevronDown className="w-3 h-3 opacity-60 group-hover:rotate-180 transition-transform" />
                  </button>

                  {/* Dropdown Menu Popover */}
                  <div className="absolute top-full left-0 mt-1 w-44 hidden group-hover:block z-50 pt-1">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200/80 dark:border-zinc-800/80 p-1.5 space-y-0.5 backdrop-blur-md">
                      {item.subItems?.map((sub, idx) => {
                        const isSubExt = sub.url && (sub.url.startsWith('http') || sub.url.startsWith('/'));
                        if (isSubExt) {
                          return (
                            <a
                              key={sub.id || idx}
                              href={sub.url}
                              target={sub.target || '_blank'}
                              rel="noopener noreferrer"
                              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                              <span>{sub.label}</span>
                              <ExternalLink className="w-3 h-3 text-zinc-400" />
                            </a>
                          );
                        }
                        return (
                          <button
                            key={sub.id || idx}
                            onClick={() => setActiveTab(sub.url || item.id)}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? accentClasses.text : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions (Random, Search, AI Chat, Admin Console, Accent Picker, Dark Toggle) */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          
          {/* Random Article Button */}
          {onRandomArticle && (
            <button
              onClick={onRandomArticle}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              title="随机看一篇文章"
            >
              <Shuffle className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden lg:inline text-[11px]">随机文章</span>
            </button>
          )}

          {/* Ask AI Button */}
          <button
            onClick={onOpenAIChat}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-all shadow-sm hover:opacity-90 active:scale-95 ${accentClasses.bg}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>问问 AI</span>
          </button>

          {/* Member Center / User Auth Button */}
          {currentUser ? (
            <button
              onClick={onOpenUserMemberModal}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-500/30 text-zinc-900 dark:text-zinc-100 hover:border-indigo-500/60 transition-all group shrink-0"
              title="查看会员个人中心与等级"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-5.5 h-5.5 rounded-full object-cover ring-1 ring-indigo-500 shrink-0"
              />
              <span className="text-xs font-bold truncate max-w-[80px] hidden sm:inline">{currentUser.username}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500 text-white font-black shrink-0 shadow-2xs">
                {currentUser.level.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenUserMemberModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors shadow-2xs"
            >
              <User className="w-3.5 h-3.5" />
              <span>登录 / 注册</span>
            </button>
          )}


          {/* Search Trigger Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            title="搜索博客内容 (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-mono text-[11px] bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">⌘K</span>
          </button>

          {/* Accent Color Palette Popover */}
          <div className="relative">
            <button
              onClick={() => setPaletteOpen(!paletteOpen)}
              className="p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              title="切换主题强调色"
            >
              <Palette className="w-4 h-4" />
            </button>

            {paletteOpen && (
              <div className="absolute right-0 mt-2 w-44 p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 py-1">
                  主题强调色
                </div>
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {colors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setAccentColor(c.id);
                        setPaletteOpen(false);
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                        accentColor === c.id ? 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-zinc-600 scale-105' : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title={darkMode ? "切换到浅色模式" : "切换到深色模式"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon ? (iconMap[item.icon] || Home) : Home;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? accentClasses.text : ''}`} />
                  {item.label}
                </button>
              );
            })}

            {onRandomArticle && (
              <button
                onClick={() => {
                  onRandomArticle();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
              >
                <Shuffle className="w-4 h-4 text-zinc-500" />
                <span>随机阅读一篇文章</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenAIChat();
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center gap-2 mt-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-sm ${accentClasses.bg}`}
            >
              <Sparkles className="w-4 h-4" />
              <span>咨询 Sanfun AI 助手</span>
            </button>
            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 mt-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>后台编辑发布控制台</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
