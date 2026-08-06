import React, { useState } from 'react';
import { FriendLink, AuthorProfile, Article, Moment, UserMember } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Users, ExternalLink, Globe, Sparkles, Check, Send, Copy, Info, Lock, LogIn } from 'lucide-react';
import { SidebarWidget } from './SidebarWidget';
import { authorProfile as defaultProfile, sampleMoments } from '../data/blogData';

interface FriendsViewProps {
  friends: FriendLink[];
  profile?: AuthorProfile;
  articles?: Article[];
  moments?: Moment[];
  categories?: string[];
  selectedCategory?: string;
  selectedTag?: string | null;
  onSelectCategory?: (category: string) => void;
  onSelectTag?: (tag: string | null) => void;
  onSelectArticle?: (article: Article) => void;
  onTabChange?: (tab: string) => void;
  onOpenAIChat?: () => void;
  currentUser?: UserMember | null;
  onOpenAuthModal?: () => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  friends,
  profile = defaultProfile,
  articles = [],
  moments = sampleMoments,
  categories = ['产品设计', 'AI 与技术', '前端工程', '生活与思考'],
  selectedCategory = '全部',
  selectedTag = null,
  onSelectCategory = () => {},
  onSelectTag = () => {},
  onSelectArticle = () => {},
  onTabChange = () => {},
  onOpenAIChat = () => {},
  currentUser = null,
  onOpenAuthModal
}) => {
  const { accentClasses } = useTheme();
  const [applyName, setApplyName] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [applyAvatar, setApplyAvatar] = useState('');
  const [applyDesc, setApplyDesc] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyTags, setApplyTags] = useState('独立博客, 技术交锋');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleOpenApplyModal = () => {
    if (!currentUser) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        setApplyModalOpen(true);
      }
      return;
    }
    if (!applyEmail && currentUser.email) {
      setApplyEmail(currentUser.email);
    }
    if (!applyAvatar && currentUser.avatar) {
      setApplyAvatar(currentUser.avatar);
    }
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyName || !applyUrl || !applyDesc) {
      setApplyError('请填写完整名称、网址和站点描述！');
      return;
    }

    setIsSubmitting(true);
    setApplyError('');
    try {
      const res = await fetch('/api/friends/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: applyName,
          url: applyUrl,
          avatar: applyAvatar,
          description: applyDesc,
          applicantEmail: applyEmail,
          tags: applyTags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '提交失败');
      setSubmitted(true);
      setApplyName('');
      setApplyUrl('');
      setApplyAvatar('');
      setApplyDesc('');
      setApplyEmail('');
    } catch (err: any) {
      setApplyError(err.message || '网络连接异常');
    } finally {
      setIsSubmitting(false);
    }
  };

  const siteInfo = {
    name: 'Sanfun Blog',
    url: 'https://sanfun.cn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    description: '探索技术、UI设计与数字生活随想的个人博客花园'
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto pb-12 font-sans">
      
      {/* 2-Column Grid Layout (Matches Homepage Width & Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start my-3">
        
        {/* Left Column: Friends Header & Cards (Span 9) */}
        <div className="lg:col-span-9 space-y-3">
          
          {/* Header Banner */}
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-md p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>数字友链网络</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                友情链接与数字邻居
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                探索充满灵感的技术博客、设计日志与开源创作者。
              </p>
            </div>

            <button
              onClick={handleOpenApplyModal}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white shadow-2xs hover:opacity-90 transition-all ${accentClasses.bg}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>申请友链</span>
              {!currentUser && (
                <span className="text-[10px] font-normal opacity-90 bg-black/20 dark:bg-white/20 px-1.5 py-0.5 rounded ml-0.5 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>需登录</span>
                </span>
              )}
            </button>
          </div>

          {/* Friends Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {friends.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-md p-4 sm:p-5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs flex items-start gap-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-xs group"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={f.avatar}
                    alt={f.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-md object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                    f.status === 'Online' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {f.name}
                    </h3>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 mb-2">
                    {f.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {f.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Site Info Card (For users who want to link back) */}
          <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-md p-5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Info className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                本站友链信息
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">名称</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{siteInfo.name}</span>
                </div>
                <button
                  onClick={() => handleCopy(siteInfo.name, 'name')}
                  className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                >
                  {copiedField === 'name' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">网址</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{siteInfo.url}</span>
                </div>
                <button
                  onClick={() => handleCopy(siteInfo.url, 'url')}
                  className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                >
                  {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-md border border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between sm:col-span-2">
                <div className="truncate pr-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">描述</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">{siteInfo.description}</span>
                </div>
                <button
                  onClick={() => handleCopy(siteInfo.description, 'description')}
                  className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors shrink-0"
                >
                  {copiedField === 'description' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Personal Profile Sidebar Widget (Span 3 - Matches Homepage) */}
        <div className="lg:col-span-3">
          <SidebarWidget
            profile={profile}
            articles={articles}
            moments={moments}
            categories={categories}
            selectedCategory={selectedCategory}
            selectedTag={selectedTag}
            onSelectCategory={onSelectCategory}
            onSelectTag={onSelectTag}
            onSelectArticle={onSelectArticle}
            onTabChange={onTabChange}
            onOpenAIChat={onOpenAIChat}
          />
        </div>

      </div>

      {/* Friend Link Application Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 sm:p-8 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl relative">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              申请加入友情链接
            </h3>

            {!currentUser ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-500 mx-auto flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  请先登录或注册会员
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  申请友情链接需要登录注册会员，方便为您记录申请记录与接收审核结果通知。
                </p>
                <div className="flex justify-center gap-2 pt-3">
                  <button
                    onClick={() => setApplyModalOpen(false)}
                    className="px-4 py-2 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      setApplyModalOpen(false);
                      if (onOpenAuthModal) onOpenAuthModal();
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white shadow-2xs hover:opacity-90 transition-all ${accentClasses.bg}`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>立即登录 / 注册</span>
                  </button>
                </div>
              </div>
            ) : submitted ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  申请已提交！
                </h4>
                <p className="text-xs text-zinc-500">
                  管理员已收到您的友链申请，审核通过后将即时展示至友链墙。
                </p>
                <button
                  onClick={() => {
                    setApplyModalOpen(false);
                    setSubmitted(false);
                  }}
                  className="mt-4 px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold"
                >
                  关闭
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  提交前请确保您的站点包含优质的原图文或技术设计内容！
                </p>
                {applyError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-md">
                    {applyError}
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">站点名称 *</label>
                  <input
                    type="text"
                    required
                    value={applyName}
                    onChange={(e) => setApplyName(e.target.value)}
                    placeholder="例如：我的数字花园"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-md text-xs border border-zinc-200 dark:border-zinc-700 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">站点地址 *</label>
                  <input
                    type="url"
                    required
                    value={applyUrl}
                    onChange={(e) => setApplyUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-md text-xs border border-zinc-200 dark:border-zinc-700 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">Logo / 头像链接</label>
                  <input
                    type="url"
                    value={applyAvatar}
                    onChange={(e) => setApplyAvatar(e.target.value)}
                    placeholder="https://...（选填，留空将自动生成）"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-md text-xs border border-zinc-200 dark:border-zinc-700 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">联系邮箱</label>
                  <input
                    type="email"
                    value={applyEmail}
                    onChange={(e) => setApplyEmail(e.target.value)}
                    placeholder="用于接收审核通过通知（选填）"
                    className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-md text-xs border border-zinc-200 dark:border-zinc-700 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">站点描述 *</label>
                  <textarea
                    rows={2}
                    required
                    value={applyDesc}
                    onChange={(e) => setApplyDesc(e.target.value)}
                    placeholder="简短介绍你的博客定位..."
                    className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-md text-xs border border-zinc-200 dark:border-zinc-700 mt-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setApplyModalOpen(false)}
                    className="px-4 py-2 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-md text-xs font-semibold text-white shadow-2xs hover:opacity-90 transition-all ${accentClasses.bg} disabled:opacity-50`}
                  >
                    {isSubmitting ? '提交中...' : '提交申请'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

