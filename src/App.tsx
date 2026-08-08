import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { BentoHeader } from './components/BentoHeader';
import { ArticleCard } from './components/ArticleCard';
import { ArticleListItem } from './components/ArticleListItem';
import { ArticleDetail } from './components/ArticleDetail';
import { MomentsView } from './components/MomentsView';
import { ProjectsView } from './components/ProjectsView';
import { EquipmentView } from './components/EquipmentView';
import { FriendsView } from './components/FriendsView';
import { AIChatModal } from './components/AIChatModal';
import { SearchModal } from './components/SearchModal';
import { AdminModal } from './components/AdminModal';
import { UserMemberModal } from './components/UserMemberModal';
import { MusicPlayer } from './components/MusicPlayer';
import { Footer } from './components/Footer';
import { SidebarWidget } from './components/SidebarWidget';
import { Article, Moment, Project, EquipmentItem, FriendLink, AuthorProfile, SiteConfig, NavItem, ModuleLayoutConfig, UserMember } from './types';
import { authorProfile as defaultProfile, sampleArticles, sampleMoments, sampleProjects, sampleEquipment, sampleFriends } from './data/blogData';
import { generatePinyinSlug } from './utils/pinyin';
import { BookOpen, Search, Sparkles, Filter, Tag, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';

function BlogApp() {
  const { accentClasses } = useTheme();

  // Navigation & View States
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [aiChatOpen, setAiChatOpen] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [userMemberModalOpen, setUserMemberModalOpen] = useState<boolean>(false);

  // User Member State
  const [currentUser, setCurrentUser] = useState<UserMember | null>(null);

  // Load stored user session
  useEffect(() => {
    const storedId = localStorage.getItem('sanfun_user_id');
    if (storedId) {
      fetch(`/api/user/me?userId=${storedId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && !data.error) setCurrentUser(data);
        })
        .catch(() => {});
    }
  }, []);

  // Unlock Article Handler
  const handleUnlockArticle = async (articleId: string) => {
    if (!currentUser) {
      setUserMemberModalOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/user/unlock-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, articleId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '解锁失败');
      if (data.user) setCurrentUser(data.user);
      alert(data.message || '解锁成功！');
    } catch (err: any) {
      alert(err.message || '解锁失败');
    }
  };

  // Purchase Attachment Handler
  const handlePurchaseAttachment = async (articleId: string, attachmentId: string) => {
    if (!currentUser) {
      setUserMemberModalOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/user/purchase-attachment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, articleId, attachmentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '解锁附件失败');
      if (data.user) setCurrentUser(data.user);
      if (data.fileUrl) {
        window.open(data.fileUrl, '_blank');
      }
      alert(data.message || '操作成功！');
    } catch (err: any) {
      alert(err.message || '解锁附件失败');
    }
  };

  // Unlock Netdisk Link Handler
  const handleUnlockNetdisk = async (articleId: string, netdiskId: string) => {
    if (!currentUser) {
      setUserMemberModalOpen(true);
      return;
    }
    try {
      const res = await fetch('/api/user/unlock-netdisk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, articleId, netdiskId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '解锁失败');
      if (data.user) setCurrentUser(data.user);
      alert(data.message || '解密成功！');
    } catch (err: any) {
      alert(err.message || '解锁网盘链接失败');
    }
  };

  // Data States
  const [profile, setProfile] = useState<AuthorProfile>(defaultProfile);
  const [articles, setArticles] = useState<Article[]>(sampleArticles);
  const [categories, setCategories] = useState<string[]>(['产品设计', 'AI 与技术', '前端工程', '生活与思考']);
  const [moments, setMoments] = useState<Moment[]>(sampleMoments);
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [equipment, setEquipment] = useState<EquipmentItem[]>(sampleEquipment);
  const [friends, setFriends] = useState<FriendLink[]>(sampleFriends);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | undefined>(undefined);
  const [navMenu, setNavMenu] = useState<NavItem[]>([]);
  const [layoutConfig, setLayoutConfig] = useState<ModuleLayoutConfig>({
    showBentoHeader: true,
    showHeroRecommend: true,
    showFilterPills: true,
    showSidebar: true,
    cardShape: 'rounded-2xl',
    gridColumns: 3,
    defaultViewMode: 'grid',
    moduleOrder: ['bentoHeader', 'filterPills', 'articles', 'sidebar']
  });

  // Filter & Layout States
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [selectedYear, setSelectedYear] = useState<string>('全部');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Category and Year presets matching Sanfun layout
  const categoryPills = [
    { id: '精选', label: '精选', icon: '★' },
    { id: '热门', label: '热门', icon: '🔥' },
    { id: '必看', label: '必看', icon: '📌' },
    { id: '全部文章', label: '全部文章', icon: '📑' },
    { id: '设计报告', label: '设计报告', icon: '' },
    { id: '教程', label: '教程', icon: '' },
    { id: '设计', label: '设计', icon: '' },
    { id: '开发', label: '开发', icon: '' },
    { id: '干货', label: '干货', icon: '' },
    { id: '软件', label: '软件', icon: '' },
    { id: 'Swift', label: 'Swift', icon: '' },
    { id: '日常', label: '日常', icon: '' },
    { id: 'Mac', label: 'Mac', icon: '' },
    { id: 'Sketch', label: 'Sketch', icon: '' },
  ];

  const yearPills = [
    '全部', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015'
  ];

  // Fetch initial data from API with fallback
  useEffect(() => {
    fetch('/api/site-config').then(r => r.json()).then(setSiteConfig).catch(() => {});
    fetch('/api/nav-menu').then(r => r.json()).then(setNavMenu).catch(() => {});
    fetch('/api/layout-config').then(r => r.json()).then(data => {
      if (data && typeof data === 'object') setLayoutConfig(data);
    }).catch(() => {});
    fetch('/api/author').then(r => r.json()).then(setProfile).catch(() => {});
    fetch('/api/articles').then(r => r.json()).then(setArticles).catch(() => {});
    fetch('/api/categories').then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) setCategories(data);
    }).catch(() => {});
    fetch('/api/moments').then(r => r.json()).then(setMoments).catch(() => {});
    fetch('/api/projects').then(r => r.json()).then(setProjects).catch(() => {});
    fetch('/api/equipment').then(r => r.json()).then(setEquipment).catch(() => {});
    fetch('/api/friends').then(r => r.json()).then(setFriends).catch(() => {});
  }, []);

  // Sync article query parameters and deep link handling
  useEffect(() => {
    if (articles.length === 0) return;

    const parseAndSetArticle = () => {
      const pathname = window.location.pathname;
      let pathKey = '';
      if (pathname.includes('/article/')) {
        pathKey = pathname.split('/article/')[1]?.split('/')[0] || '';
      }

      const params = new URLSearchParams(window.location.search);
      let artId = pathKey || params.get('article') || params.get('id') || params.get('articleId');
      if (!artId && window.location.hash) {
        const hash = window.location.hash.replace('#', '');
        if (hash.startsWith('article=')) {
          artId = hash.replace('article=', '');
        } else if (hash.startsWith('article-')) {
          artId = hash.replace('article-', '');
        }
      }

      if (artId) {
        const found = articles.find(a => a.id === artId || a.slug === artId);
        if (found) {
          setSelectedArticle(found);
          setActiveTab('articles');
        }
      }
    };

    parseAndSetArticle();

    const handlePopState = () => {
      const pathname = window.location.pathname;
      let pathKey = '';
      if (pathname.includes('/article/')) {
        pathKey = pathname.split('/article/')[1]?.split('/')[0] || '';
      }

      const params = new URLSearchParams(window.location.search);
      let artId = pathKey || params.get('article') || params.get('id') || params.get('articleId');
      if (artId) {
        const found = articles.find(a => a.id === artId || a.slug === artId);
        if (found) {
          setSelectedArticle(found);
          setActiveTab('articles');
          return;
        }
      }
      setSelectedArticle(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [articles]);

  // Synchronize URL search params with current selected article state
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (selectedArticle) {
        const targetSlug = selectedArticle.slug || generatePinyinSlug(selectedArticle.title, selectedArticle.date);
        if (url.searchParams.get('article') !== targetSlug) {
          url.searchParams.set('article', targetSlug);
          window.history.replaceState({}, '', url.toString());
        }
      } else {
        if (url.searchParams.has('article') || url.searchParams.has('id') || url.searchParams.has('articleId')) {
          url.searchParams.delete('article');
          url.searchParams.delete('id');
          url.searchParams.delete('articleId');
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch (e) {
      console.error('Failed to sync URL state', e);
    }
  }, [selectedArticle]);

  // Update default view mode on tab switch
  useEffect(() => {
    if (activeTab === 'home') {
      setViewMode('grid');
    } else if (activeTab === 'articles') {
      setViewMode('list');
    } else if (activeTab === 'columns') {
      setViewMode('grid');
    }
    setCurrentPage(1);
  }, [activeTab]);

  // Filtered Articles Calculation
  const filteredArticles = articles.filter(a => {
    let matchCategory = true;
    if (selectedCategory === '精选' || selectedCategory === '精选文章') {
      matchCategory = !!a.featured;
    } else if (selectedCategory === '热门' || selectedCategory === '热门文章') {
      matchCategory = a.views > 2000 || a.likes > 100;
    } else if (selectedCategory === '必看' || selectedCategory === '必看文章') {
      matchCategory = !!a.featured || a.likes > 150;
    } else if (selectedCategory !== '全部' && selectedCategory !== '全部文章' && selectedCategory !== '📑 全部文章') {
      matchCategory = a.category === selectedCategory || (a.tags || []).some(t => t.includes(selectedCategory));
    }

    const matchTag = !selectedTag || (a.tags || []).some(t => t.toLowerCase() === selectedTag.toLowerCase());
    const matchYear = selectedYear === '全部' || (a.date || '').includes(selectedYear);

    return matchCategory && matchTag && matchYear;
  });

  // Pagination Calculation
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / ITEMS_PER_PAGE));
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const featuredArticle = articles.find(a => a.featured) || articles[0];
  const latestMoment = moments[0];

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setActiveTab('articles');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('article', article.id);
      window.history.pushState({}, '', url.toString());
    } catch (e) {}
  };

  const handleRandomArticle = () => {
    if (articles.length === 0) return;
    const randomIndex = Math.floor(Math.random() * articles.length);
    const randomArt = articles[randomIndex];
    setSelectedArticle(randomArt);
    setActiveTab('articles');
  };

  const handleAddMoment = (newMoment: Moment) => {
    setMoments(prev => [newMoment, ...prev]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      <div>
        {/* Navigation Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedArticle(null);
          }}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenAIChat={() => setAiChatOpen(true)}
          onOpenAdmin={() => setAdminModalOpen(true)}
          onRandomArticle={handleRandomArticle}
          siteConfig={siteConfig}
          profile={profile}
          customNavItems={navMenu}
          currentUser={currentUser}
          onOpenUserMemberModal={() => setUserMemberModalOpen(true)}
          layoutConfig={layoutConfig}
        />

        <main className={`${layoutConfig.enableAdaptiveWidth === false ? 'max-w-6xl' : (layoutConfig.adaptiveMaxWidth || 'max-w-[1440px]')} w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 transition-all duration-300`}>
          
          <AnimatePresence mode="wait">
            {/* Detailed Article Reader View */}
            {selectedArticle ? (
              <motion.div
                key="article-detail"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ArticleDetail
                  article={selectedArticle}
                  allArticles={articles}
                  onBack={() => setSelectedArticle(null)}
                  onSelectArticle={handleArticleClick}
                  profile={profile}
                  moments={moments}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  selectedTag={selectedTag}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setActiveTab('articles');
                    setSelectedArticle(null);
                  }}
                  onSelectTag={(tag) => {
                    setSelectedTag(tag);
                    setActiveTab('articles');
                    setSelectedArticle(null);
                  }}
                  onTabChange={(tab) => {
                    setActiveTab(tab);
                    setSelectedArticle(null);
                  }}
                  onOpenAIChat={() => setAiChatOpen(true)}
                  currentUser={currentUser}
                  onUnlockArticle={handleUnlockArticle}
                  onPurchaseAttachment={handlePurchaseAttachment}
                  onUnlockNetdisk={handleUnlockNetdisk}
                  onOpenAuthModal={() => setUserMemberModalOpen(true)}
                  onOpenUserMember={() => setUserMemberModalOpen(true)}
                />
              </motion.div>
            ) : (
              <React.Fragment key="main-views">
                {/* Main Tab Views */}
                {(activeTab === 'home' || activeTab === 'articles' || activeTab === 'columns') && (
                  <motion.div
                    key={`view-${activeTab}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Sanfun Bento Hero Header - Shown on Home Page when enabled in layoutConfig */}
                    {activeTab === 'home' && layoutConfig.showBentoHeader !== false && (
                      <BentoHeader
                        articles={articles}
                        moments={moments}
                        selectedCategory={selectedCategory}
                        selectedTag={selectedTag}
                        onSelectCategory={setSelectedCategory}
                        onSelectTag={setSelectedTag}
                        onArticleClick={handleArticleClick}
                        onTabChange={setActiveTab}
                        onOpenAIChat={() => setAiChatOpen(true)}
                      />
                    )}

                    {/* Sanfun Layout Grid (Main Content + Right Sidebar) */}
                    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3 ${activeTab === 'home' && layoutConfig.showBentoHeader !== false ? 'mt-3 mb-6' : 'mb-6'}`}>
                      
                      {/* Left Main Article Column (Span 9 or Span 12 based on sidebar toggle) */}
                      <div className={layoutConfig.showSidebar !== false ? "lg:col-span-9 space-y-3" : "lg:col-span-12 space-y-3"}>
                        
                        {/* Sanfun Double Category & Year Filter Header Bar - Hidden on Home tab where BentoHeader already has category pills */}
                        {activeTab !== 'home' && (
                          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 sm:p-5 rounded-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-3">
                            
                            {/* Category Pills Row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
                                {categoryPills.map(cat => {
                                  const isSelected = selectedCategory === cat.id || (selectedCategory === '全部' && cat.id === '全部文章');
                                  return (
                                    <button
                                      key={cat.id}
                                      onClick={() => {
                                        setSelectedCategory(cat.id === '全部文章' ? '全部' : cat.id);
                                        setCurrentPage(1);
                                      }}
                                      className={`px-4.5 py-1 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1 ${
                                        isSelected
                                          ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
                                          : 'bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                      }`}
                                    >
                                      {cat.icon && <span>{cat.icon}</span>}
                                      <span>{cat.label}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* View Mode Switcher Toggle */}
                              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md shrink-0">
                                <button
                                  onClick={() => setViewMode('list')}
                                  className={`p-1.5 rounded-sm text-xs font-semibold transition-colors ${
                                    viewMode === 'list'
                                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                                  }`}
                                  title="列表视图"
                                >
                                  <List className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setViewMode('grid')}
                                  className={`p-1.5 rounded-sm text-xs font-semibold transition-colors ${
                                    viewMode === 'grid'
                                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                                  }`}
                                  title="卡片网格"
                                >
                                  <LayoutGrid className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Year Filter Pills Row */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-zinc-100 dark:border-zinc-800/80 no-scrollbar">
                              {yearPills.map(yr => {
                                const isSelected = selectedYear === yr;
                                return (
                                  <button
                                    key={yr}
                                    onClick={() => {
                                      setSelectedYear(yr);
                                      setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1 rounded-md text-[13px] font-semibold whitespace-nowrap transition-all ${
                                      isSelected
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                                  >
                                    {yr}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Selected Tag Active Indicator */}
                            {selectedTag && (
                              <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                                <span className="text-zinc-500 font-mono">当前包含标签: #{selectedTag}</span>
                                <button
                                  onClick={() => {
                                    setSelectedTag(null);
                                    setCurrentPage(1);
                                  }}
                                  className="text-rose-500 font-semibold hover:underline"
                                >
                                  清除标签筛选
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Selected Tag Active Indicator for Home tab if tag or category filter active */}
                        {activeTab === 'home' && (selectedTag || (selectedCategory && selectedCategory !== '全部')) && (
                          <div className="flex items-center justify-between px-4 py-2.5 bg-white/80 dark:bg-zinc-900/80 rounded-md border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
                            <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                              当前筛选: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedCategory !== '全部' ? selectedCategory : ''}</span>
                              {selectedTag && <span className="font-mono ml-2">#{selectedTag}</span>}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedCategory('全部');
                                setSelectedTag(null);
                                setCurrentPage(1);
                              }}
                              className="text-rose-500 font-semibold hover:underline"
                            >
                              重置筛选
                            </button>
                          </div>
                        )}

                        {/* Article List / Grid Container */}
                        {viewMode === 'list' ? (
                          <div className={activeTab === 'articles' ? "space-y-[2px]" : "space-y-2.5"}>
                            {paginatedArticles.map((article, idx) => (
                              <motion.div
                                key={article.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: idx * 0.03 }}
                              >
                                <ArticleListItem
                                  article={article}
                                  onClick={() => handleArticleClick(article)}
                                />
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className={activeTab === 'articles' ? "grid grid-cols-1 sm:grid-cols-2 gap-[2px]" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
                            {paginatedArticles.map((article, idx) => (
                              <motion.div
                                key={article.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                                className="h-full"
                              >
                                <ArticleCard
                                  article={article}
                                  onClick={() => handleArticleClick(article)}
                                />
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Bottom Pagination Bar */}
                        {filteredArticles.length > 0 && (
                          <div className="flex items-center justify-center gap-2 pt-6 pb-2">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              className="w-[34px] h-[34px] rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            >
                              <ChevronLeft className="w-[18px] h-[18px]" />
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = i + 1;
                              const isActive = pageNum === currentPage;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`w-[34px] h-[34px] rounded-full font-bold text-sm flex items-center justify-center transition-all cursor-pointer ${
                                    isActive
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}

                            {totalPages > 5 && (
                              <>
                                <span className="text-zinc-400 font-mono text-sm px-1">...</span>
                                <button
                                  onClick={() => setCurrentPage(totalPages)}
                                  className={`w-[34px] h-[34px] rounded-full font-bold text-sm flex items-center justify-center transition-all cursor-pointer ${
                                    currentPage === totalPages
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                  }`}
                                >
                                  {totalPages}
                                </button>
                              </>
                            )}

                            <button
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              className="w-[34px] h-[34px] rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                            >
                              <ChevronRight className="w-[18px] h-[18px]" />
                            </button>
                          </div>
                        )}

                        {filteredArticles.length === 0 && (
                          <div className="py-16 text-center space-y-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-md border border-zinc-200/80 dark:border-zinc-800/80 p-8">
                            <BookOpen className="w-10 h-10 text-zinc-400 mx-auto" />
                            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
                              没有找到匹配该筛选条件的文章
                            </h3>
                            <button
                              onClick={() => {
                                setSelectedCategory('全部');
                                setSelectedTag(null);
                              }}
                              className="text-xs text-blue-600 dark:text-blue-400 font-semibold underline"
                            >
                              重置筛选条件
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right Sidebar Column (Span 3) */}
                      {layoutConfig.showSidebar !== false && (
                        <div className="lg:col-span-3 space-y-3 h-full">
                          <SidebarWidget
                            profile={profile}
                            articles={articles}
                            moments={moments}
                            categories={categories}
                            selectedCategory={selectedCategory}
                            selectedTag={selectedTag}
                            onSelectCategory={setSelectedCategory}
                            onSelectTag={setSelectedTag}
                            onSelectArticle={handleArticleClick}
                            onTabChange={setActiveTab}
                            onOpenAIChat={() => setAiChatOpen(true)}
                            onOpenUserMember={() => setUserMemberModalOpen(true)}
                          />
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}

                {activeTab === 'moments' && (
                  <motion.div
                    key="view-moments"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <MomentsView
                      moments={moments}
                      onAddMoment={handleAddMoment}
                    />
                  </motion.div>
                )}

                {activeTab === 'projects' && (
                  <motion.div
                    key="view-projects"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProjectsView
                      projects={projects}
                    />
                  </motion.div>
                )}

                {activeTab === 'equipment' && (
                  <motion.div
                    key="view-equipment"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EquipmentView
                      equipment={equipment}
                      projects={projects}
                    />
                  </motion.div>
                )}

                {activeTab === 'friends' && (
                  <motion.div
                    key="view-friends"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FriendsView
                      friends={friends}
                      profile={profile}
                      articles={articles}
                      moments={moments}
                      categories={categories}
                      selectedCategory={selectedCategory}
                      selectedTag={selectedTag}
                      onSelectCategory={setSelectedCategory}
                      onSelectTag={setSelectedTag}
                      onSelectArticle={handleArticleClick}
                      onTabChange={setActiveTab}
                      onOpenAIChat={() => setAiChatOpen(true)}
                      currentUser={currentUser}
                      onOpenAuthModal={() => setUserMemberModalOpen(true)}
                    />
                  </motion.div>
                )}
              </React.Fragment>
            )}
          </AnimatePresence>

        </main>
      </div>

      {/* Footer */}
      <Footer
        totalArticles={articles.length}
        totalMoments={moments.length}
        onOpenAIChat={() => setAiChatOpen(true)}
        onOpenAdmin={() => setAdminModalOpen(true)}
        siteConfig={siteConfig}
        profile={profile}
        layoutConfig={layoutConfig}
        onTabChange={setActiveTab}
      />

      {/* Modals */}
      <AIChatModal
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        articles={articles}
        moments={moments}
        onSelectArticle={handleArticleClick}
        onSelectTag={(t) => {
          setSelectedTag(t);
          setActiveTab('articles');
          setSelectedArticle(null);
        }}
      />

      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        articles={articles}
        categories={categories}
        equipment={equipment}
        projects={projects}
        moments={moments}
        profile={profile}
        siteConfig={siteConfig}
        navMenu={navMenu}
        layoutConfig={layoutConfig}
        onArticleCreated={(newArt) => setArticles(prev => [newArt, ...prev])}
        onArticleUpdated={(updatedArt) => setArticles(prev => prev.map(a => a.id === updatedArt.id ? updatedArt : a))}
        onArticleDeleted={(id) => setArticles(prev => prev.filter(a => a.id !== id))}
        onCategoriesUpdated={(cats) => setCategories(cats)}
        onEquipmentCreated={(newItem) => setEquipment(prev => [newItem, ...prev])}
        onEquipmentUpdated={(updatedItem) => setEquipment(prev => prev.map(e => e.id === updatedItem.id ? updatedItem : e))}
        onEquipmentDeleted={(id) => setEquipment(prev => prev.filter(e => e.id !== id))}
        onProjectCreated={(newProj) => setProjects(prev => [newProj, ...prev])}
        onProjectUpdated={(updatedProj) => setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p))}
        onProjectDeleted={(id) => setProjects(prev => prev.filter(p => p.id !== id))}
        onMomentCreated={(newMom) => setMoments(prev => [newMom, ...prev])}
        onMomentUpdated={(updatedMom) => setMoments(prev => prev.map(m => m.id === updatedMom.id ? updatedMom : m))}
        onMomentDeleted={(id) => setMoments(prev => prev.filter(m => m.id !== id))}
        onProfileUpdated={(updatedProf) => setProfile(updatedProf)}
        onSiteConfigUpdated={(cfg) => setSiteConfig(cfg)}
        onNavMenuUpdated={(menu) => setNavMenu(menu)}
        onLayoutConfigUpdated={(cfg) => setLayoutConfig(cfg)}
      />

      <UserMemberModal
        isOpen={userMemberModalOpen}
        onClose={() => setUserMemberModalOpen(false)}
        currentUser={currentUser}
        onUserUpdate={setCurrentUser}
      />
      {/* Floating Bottom Music Player */}
      <MusicPlayer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BlogApp />
    </ThemeProvider>
  );
}
