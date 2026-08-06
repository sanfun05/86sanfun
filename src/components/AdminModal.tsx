import React, { useState, useEffect, useRef } from 'react';
import { Article, Moment, AuthorProfile, EquipmentItem, SiteConfig, NavItem, ModuleLayoutConfig, SidebarPromoBlock, ArticleAttachment, NetdiskLink, MusicTrackInfo } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  X, Plus, Edit, Trash2, Save, Sparkles, FileText, MessageSquare, 
  UserCheck, ShieldCheck, Eye, EyeOff, Lock, User, LogOut, KeyRound, ChevronLeft, ChevronRight, LayoutGrid, RefreshCw,
  FolderPlus, Tag, Monitor, Laptop, Keyboard, Smartphone, Camera, Headphones, Layout, Code, Star, CheckCircle2,
  Check, Copy, AlertCircle, Lightbulb, AlertTriangle, Rocket, PartyPopper, ChevronDown, Quote, Table, ListOrdered, FileCode, LayoutTemplate, CopyCheck, Wand2, Image as ImageIcon,
  Bold, Italic, Underline, Strikethrough, Link as LinkIcon, List as ListIcon, CheckSquare, AlignLeft, AlignCenter, AlignRight, Type, Palette, Smile, Terminal, Upload, Columns, Split, ImagePlus, Box, Compass, Globe, Layers, Crop,
  Maximize2, Minimize2, Minus, ArrowUp, ArrowDown, Cloud, HardDrive, Paperclip, Coins, Download, Key, Music, Disc, Radio
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import { PanoramaViewer } from './PanoramaViewer';
import { ThreeDViewer } from './ThreeDViewer';
import { ImageCropperModal } from './ImageCropperModal';
import { AdminMembersManager } from './admin/AdminMembersManager';
import { AdminTiersManager } from './admin/AdminTiersManager';
import { AdminMessagesManager } from './admin/AdminMessagesManager';
import { AdminFriendAuditManager } from './admin/AdminFriendAuditManager';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  categories: string[];
  equipment: EquipmentItem[];
  moments: Moment[];
  profile: AuthorProfile;
  siteConfig?: SiteConfig;
  navMenu?: NavItem[];
  layoutConfig?: ModuleLayoutConfig;
  onArticleCreated: (newArticle: Article) => void;
  onArticleUpdated: (updatedArticle: Article) => void;
  onArticleDeleted: (articleId: string) => void;
  onCategoriesUpdated: (categories: string[]) => void;
  onEquipmentCreated: (newItem: EquipmentItem) => void;
  onEquipmentUpdated: (updatedItem: EquipmentItem) => void;
  onEquipmentDeleted: (equipmentId: string) => void;
  onMomentCreated: (newMoment: Moment) => void;
  onMomentUpdated?: (updatedMoment: Moment) => void;
  onMomentDeleted: (momentId: string) => void;
  onProfileUpdated: (updatedProfile: AuthorProfile) => void;
  onSiteConfigUpdated?: (updatedConfig: SiteConfig) => void;
  onNavMenuUpdated?: (updatedMenu: NavItem[]) => void;
  onLayoutConfigUpdated?: (updatedLayout: ModuleLayoutConfig) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  articles,
  categories,
  equipment,
  moments,
  profile,
  siteConfig,
  navMenu,
  layoutConfig,
  onArticleCreated,
  onArticleUpdated,
  onArticleDeleted,
  onCategoriesUpdated,
  onEquipmentCreated,
  onEquipmentUpdated,
  onEquipmentDeleted,
  onMomentCreated,
  onMomentUpdated,
  onMomentDeleted,
  onProfileUpdated,
  onSiteConfigUpdated,
  onNavMenuUpdated,
  onLayoutConfigUpdated
}) => {
  const { accentClasses } = useTheme();
  
  // Toast notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Captcha & Security states
  const [captchaSvg, setCaptchaSvg] = useState<string>('');
  const [captchaId, setCaptchaId] = useState<string>('');
  const [captchaInput, setCaptchaInput] = useState<string>('');
  const [captchaLoading, setCaptchaLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [securityAuditInfo, setSecurityAuditInfo] = useState<{ method?: string; time?: string; clientIp?: string } | null>(null);

  // Window controls states (Maximize, Minimize, Close)
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'articles' | 'categories' | 'equipment' | 'moments' | 'profile' | 'navMenu' | 'music' | 'members' | 'tiers' | 'messages' | 'friendAudit'>('articles');
  const [memberSubTab, setMemberSubTab] = useState<'members' | 'tiers' | 'messages' | 'friendAudit'>('members');
  const [momentSubTab, setMomentSubTab] = useState<'moments' | 'music'>('moments');

  // Music Playlist Admin State
  const [adminPlaylist, setAdminPlaylist] = useState<MusicTrackInfo[]>([]);
  const [musicParseUrl, setMusicParseUrl] = useState('');
  const [musicParsing, setMusicParsing] = useState(false);
  const [musicEditingTrackId, setMusicEditingTrackId] = useState<string | null>(null);
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [musicCover, setMusicCover] = useState('');
  const [musicAudioUrl, setMusicAudioUrl] = useState('');
  const [musicPlatform, setMusicPlatform] = useState<'163' | 'qq' | 'kugou' | 'custom'>('custom');

  // Fetch music playlist from server
  const fetchAdminPlaylist = async () => {
    try {
      const res = await fetch('/api/music/playlist');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAdminPlaylist(data);
      }
    } catch (e) {
      console.error('Failed to fetch admin playlist:', e);
    }
  };

  useEffect(() => {
    if (isOpen && (activeTab === 'music' || (activeTab === 'moments' && momentSubTab === 'music'))) {
      fetchAdminPlaylist();
    }
  }, [isOpen, activeTab, momentSubTab]);

  const handleParseMusicUrl = async () => {
    if (!musicParseUrl.trim()) return;
    setMusicParsing(true);
    try {
      const res = await fetch('/api/music/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: musicParseUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '解析失败');
      if (data.track) {
        setMusicTitle(data.track.title || '');
        setMusicArtist(data.track.artist || '');
        setMusicCover(data.track.cover || '');
        setMusicAudioUrl(data.track.audioUrl || '');
        setMusicPlatform(data.track.platform || 'custom');
        showToast(`已成功解析单曲「${data.track.title}」！`);
        setMusicParseUrl('');
      }
    } catch (err: any) {
      showToast(err.message || '解析失败，请检查音乐链接');
    } finally {
      setMusicParsing(false);
    }
  };

  const handleSaveMusicTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicTitle.trim() || !musicAudioUrl.trim()) {
      showToast('请填写歌曲名称和音频播放 URL 地址！');
      return;
    }

    const trackItem: MusicTrackInfo = {
      id: musicEditingTrackId || `track-${Date.now()}`,
      title: musicTitle.trim(),
      artist: musicArtist.trim() || '未知歌手',
      cover: musicCover.trim() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200',
      audioUrl: musicAudioUrl.trim(),
      platform: musicPlatform
    };

    let updatedList: MusicTrackInfo[];
    if (musicEditingTrackId) {
      updatedList = adminPlaylist.map(t => t.id === musicEditingTrackId ? trackItem : t);
    } else {
      updatedList = [trackItem, ...adminPlaylist];
    }

    try {
      const res = await fetch('/api/music/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracks: updatedList })
      });
      const data = await res.json();
      if (res.ok && data.playlist) {
        setAdminPlaylist(data.playlist);
        showToast(musicEditingTrackId ? '更新单曲成功！' : '加入歌单成功！');
        setMusicEditingTrackId(null);
        setMusicTitle('');
        setMusicArtist('');
        setMusicCover('');
        setMusicAudioUrl('');
        setMusicPlatform('custom');
      }
    } catch (err: any) {
      showToast('保存歌单失败');
    }
  };

  const handleDeleteMusicTrack = async (id: string) => {
    if (!confirm('确定要从后台歌单中移除此单曲吗？')) return;
    try {
      const res = await fetch(`/api/music/playlist/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.playlist) {
        setAdminPlaylist(data.playlist);
        showToast('已成功从歌单中移除此单曲！');
      }
    } catch (err) {
      showToast('删除失败');
    }
  };

  // Navigation Menu Management State
  const [localNavMenu, setLocalNavMenu] = useState<NavItem[]>(navMenu || [
    { id: 'home', label: '首页', icon: 'Home', url: '#home', target: '_self', isExternal: false },
    { id: 'articles', label: '文库', icon: 'BookOpen', url: '#articles', target: '_self', isExternal: false },
    { id: 'columns', label: '专栏', icon: 'FolderGit2', url: '#columns', target: '_self', isExternal: false },
    { id: 'friends', label: '友链', icon: 'Users', url: '#friends', target: '_self', isExternal: false },
    { id: 'equipment', label: '我的', icon: 'Monitor', url: '#equipment', target: '_self', isExternal: false },
  ]);

  // Layout Configuration State
  const [localLayoutConfig, setLocalLayoutConfig] = useState<ModuleLayoutConfig>(layoutConfig || {
    showBentoHeader: true,
    showHeroRecommend: true,
    showFilterPills: true,
    showSidebar: true,
    cardShape: 'rounded-2xl',
    gridColumns: 3,
    defaultViewMode: 'grid',
    moduleOrder: ['bentoHeader', 'filterPills', 'articles', 'sidebar']
  });

  useEffect(() => {
    if (navMenu && navMenu.length > 0) {
      setLocalNavMenu(navMenu);
    }
  }, [navMenu]);

  useEffect(() => {
    if (layoutConfig) {
      setLocalLayoutConfig(layoutConfig);
    }
  }, [layoutConfig]);

  // Mobile article sub-view ('list' or 'editor')
  const [mobileSubView, setMobileSubView] = useState<'list' | 'editor'>('list');

  // Form states for creating/editing article
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0] || '产品设计');
  const [tags, setTags] = useState('Bento Grid, UI 设计');
  const [coverImage, setCoverImage] = useState('');
  const [coverBg, setCoverBg] = useState('from-rose-500 to-orange-400');
  const [coverText, setCoverText] = useState('SANFUN');
  const [mascotIcon, setMascotIcon] = useState('🪵');
  const [readStatus, setReadStatus] = useState('最新');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [featured, setFeatured] = useState(false);
  const [isHeroFeatured, setIsHeroFeatured] = useState(false);
  const [isBannerRecommend, setIsBannerRecommend] = useState(false);

  // Paid Reading & VIP Membership Locks states
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(10);
  const [requiredLevel, setRequiredLevel] = useState(1);
  const [paidContent, setPaidContent] = useState('');
  const [requireCommentToView, setRequireCommentToView] = useState(false);

  // Attachments and Netdisk Links states
  const [attachments, setAttachments] = useState<ArticleAttachment[]>([]);
  const [netdiskLinks, setNetdiskLinks] = useState<NetdiskLink[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const [previewMode, setPreviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropperTarget, setCropperTarget] = useState<'coverImage' | 'mascotIcon' | 'avatar' | 'customLogo' | 'promoIcon'>('coverImage');
  const [editingPromoIndexForCrop, setEditingPromoIndexForCrop] = useState<number>(0);

  // Markdown Typography & Template states
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Extended Markdown Editor Tooling States
  const [editorViewMode, setEditorViewMode] = useState<'edit' | 'visual' | 'split' | 'preview'>('edit');
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, idx: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(idx);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const markdownComponents = {
    div({ node, className, children, ...props }: any) {
      const dataType = props['data-type'];
      if (dataType === '3d-model' || props['data-3d-model'] || className?.includes('threed-viewer-embed')) {
        return (
          <ThreeDViewer
            src={props['data-src'] || props['data-model-url']}
            title={props['data-title'] || '3D 交互模型与 3D PDF 在线体验'}
            format={props['data-format'] || 'procedural'}
            pdfUrl={props['data-pdf-url']}
          />
        );
      }
      if (dataType === 'panorama' || props['data-panorama'] || className?.includes('panorama-viewer-embed')) {
        return (
          <PanoramaViewer
            imageUrl={props['data-src'] || props['data-panorama-url'] || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=2000'}
            caption={props['data-caption'] || props['data-title'] || '360° 交互式全景环视体验'}
          />
        );
      }
      return <div className={className} {...props}>{children}</div>;
    },
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      const codeIdx = Math.abs(codeString.length * 31);

      if (!inline) {
        return (
          <div className="my-4 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 text-zinc-100 shadow-md font-mono text-xs sm:text-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80 border-b border-zinc-700/60 text-xs text-zinc-400">
              <span className="font-bold uppercase tracking-wider text-[11px]">
                {match ? match[1] : 'Code Snippet'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(codeString, codeIdx)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-700/60 hover:bg-zinc-700 text-zinc-200 text-[11px] transition-colors"
              >
                {copiedCodeIndex === codeIdx ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>复制代码</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code>{children}</code>
            </pre>
          </div>
        );
      }
      return (
        <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono text-rose-500 dark:text-rose-400" {...props}>
          {children}
        </code>
      );
    },
    blockquote({ node, children, ...props }: any) {
      return (
        <blockquote className="my-4 pl-4 py-2 border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-zinc-700 dark:text-zinc-300 rounded-r-xl italic text-xs sm:text-sm" {...props}>
          {children}
        </blockquote>
      );
    },
    table({ node, children, ...props }: any) {
      return (
        <div className="my-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <table className="w-full text-left text-xs sm:text-sm border-collapse" {...props}>
            {children}
          </table>
        </div>
      );
    },
    img({ node, className, alt, src, ...props }: any) {
      return (
        <span className="block my-4 space-y-1.5 text-center">
          <img
            src={src}
            alt={alt || '文章插图'}
            className="mx-auto rounded-lg max-h-[450px] object-cover border border-zinc-200 dark:border-zinc-800 shadow-md transition-all hover:scale-[1.01]"
            {...props}
          />
          {alt && <span className="block text-center text-[11px] text-zinc-400 italic">{alt}</span>}
        </span>
      );
    }
  };
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPanoramaModal, setShowPanoramaModal] = useState(false);
  const [show3DModal, setShow3DModal] = useState(false);

  // Panorama insertion states
  const [panoramaUrlInput, setPanoramaUrlInput] = useState('');
  const [panoramaCaptionInput, setPanoramaCaptionInput] = useState('360° 交互式全景环视体验');

  // 3D Model / 3D PDF insertion states
  const [threeDTitleInput, setThreeDTitleInput] = useState('智能 3D 轮廓模型与 3D PDF 图纸');
  const [threeDUrlInput, setThreeDUrlInput] = useState('');
  const [threeDFormatInput, setThreeDFormatInput] = useState<'procedural' | 'gltf' | '3dpdf' | 'iframe'>('procedural');

  // Image insertion modal states
  const [imageModalTab, setImageModalTab] = useState<'url' | 'upload' | 'presets'>('url');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageAltInput, setImageAltInput] = useState('');
  const [imageCaptionInput, setImageCaptionInput] = useState('');
  const [imageUploadPreview, setImageUploadPreview] = useState<string | null>(null);

  // Code template modal state
  const [selectedCodeIndex, setSelectedCodeIndex] = useState(0);

  // Selection wrapping function for formatting (Bold, Italic, Underline, Color, etc.)
  const wrapSelection = (prefix: string, suffix: string, defaultPlaceholder: string = '选中文本') => {
    const textarea = contentRef.current;
    if (!textarea) {
      setContent(prev => prev + `${prefix}${defaultPlaceholder}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const textToWrap = selected || defaultPlaceholder;
    const replacement = `${prefix}${textToWrap}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + defaultPlaceholder.length);
      }
    }, 50);
  };

  // Line prefixing function (Headings, Lists, Quotes)
  const prependLinePrefix = (prefix: string) => {
    const textarea = contentRef.current;
    if (!textarea) {
      setContent(prev => `${prefix}${prev}`);
      return;
    }

    const start = textarea.selectionStart;
    const currentVal = content;
    const lineStart = currentVal.lastIndexOf('\n', start - 1) + 1;

    const newContent = currentVal.substring(0, lineStart) + prefix + currentVal.substring(lineStart);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 50);
  };

  // Direct String / Emoji Insertion at cursor
  const insertAtCursor = (str: string, label?: string) => {
    const textarea = contentRef.current;
    if (!textarea) {
      setContent(prev => prev + str);
      if (label) showToast(`已插入 ${label}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.substring(0, start) + str + content.substring(end);
    setContent(newContent);

    if (label) showToast(`已插入 ${label}`);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + str.length, start + str.length);
    }, 50);
  };

  // Image Upload Handling
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('单个图片文件请控制在 8MB 以内');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageUploadPreview(dataUrl);
      setImageUrlInput(dataUrl);
      if (!imageAltInput) setImageAltInput(file.name.replace(/\.[^/.]+$/, ""));
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmInsertImage = () => {
    if (!imageUrlInput.trim()) {
      alert('请填写图片 URL 或上传本地图片');
      return;
    }

    const alt = imageAltInput.trim() || '文章插图';
    const caption = imageCaptionInput.trim();
    let imgMd = `![${alt}](${imageUrlInput.trim()})`;
    if (caption) {
      imgMd += `\n*图：${caption}*`;
    }

    handleInsertSnippet(imgMd, '图片与图注');
    setShowImageModal(false);
    setImageUrlInput('');
    setImageAltInput('');
    setImageCaptionInput('');
    setImageUploadPreview(null);
  };

  // Pre-made Code Snippets Template Library
  const CODE_TEMPLATES = [
    {
      id: 'react_ts',
      title: 'React 19 & TypeScript 组件模版',
      lang: 'tsx',
      code: `import React, { useState } from 'react';

interface CardProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
}

export const BentoCard: React.FC<CardProps> = ({ title, badge, children }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="p-6 rounded-md bg-zinc-900 text-white border border-zinc-800 transition-all hover:scale-[1.02]"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{title}</h3>
        {badge && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
            {badge}
          </span>
        )}
      </div>
      <div className="text-sm text-zinc-400">{children}</div>
    </div>
  );
};`
    },
    {
      id: 'python_ai',
      title: 'Python Gemini AI 文本处理脚本',
      lang: 'python',
      code: `from google import genai
import os

def generate_article_summary(text: str) -> str:
    """使用 Gemini 自动生成文章核心要点"""
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    prompt = f"请用中文将以下文章提炼为 3 句精炼观点：\\n\\n{text}"
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text.strip()`
    },
    {
      id: 'go_api',
      title: 'Go HTTP REST API Handler',
      lang: 'go',
      code: `package main

import (
	"encoding/json"
	"net/http"
	"time"
)

type ArticleResponse struct {
	ID        string    \`json:"id"\`
	Title     string    \`json:"title"\`
	Status    string    \`json:"status"\`
	CreatedAt time.Time \`json:"created_at"\`
}

func handleGetArticles(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	
	article := ArticleResponse{
		ID:        "art_001",
		Title:     "Sanfun Bento 全栈实践指南",
		Status:    "published",
		CreatedAt: time.Now(),
	}
	
	json.NewEncoder(w).Encode(article)
}`
    },
    {
      id: 'sql_schema',
      title: 'SQL 表结构设计与组合索引查询',
      lang: 'sql',
      code: `-- 建立文章基础信息表
CREATE TABLE IF NOT EXISTS articles (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  views INT DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 高频热门文章索引组合查询
SELECT id, title, views, category 
FROM articles 
WHERE featured = TRUE AND views > 100 
ORDER BY created_at DESC 
LIMIT 10;`
    },
    {
      id: 'bash_deploy',
      title: 'Bash 自动化构建部署脚本',
      lang: 'bash',
      code: `#!/usr/bin/env bash
set -e

echo "🚀 开始执行 Sanfun Bento 部署构建流程..."

# 1. 语法与类型校验
npm run lint

# 2. 生产环境编译打包
NODE_ENV=production npm run build

# 3. 部署发布与重启
restart_dev_server

echo "✅ 部署完成！项目运行于端口 3000。"`
    },
    {
      id: 'tailwind_css',
      title: 'Tailwind CSS v4 样式与微卡片',
      lang: 'css',
      code: `@import "tailwindcss";

@layer components {
  .bento-glass-card {
    @apply rounded-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 p-6 shadow-sm hover:shadow-md transition-all;
  }
}`
    }
  ];

  const EMOJI_GROUPS = [
    {
      title: '👨‍💻 极客与技术',
      list: ['👨‍💻', '💻', '🚀', '⚡', '🐛', '🔧', '📦', '🛠️', '🛡️', '🌐', '⚙️', '💾', '🤖', '💡', '📱', '🖥️', '📊', '🧠', '🔮', '⌨️', '🔌', '📡']
    },
    {
      title: '💡 笔记与思考',
      list: ['💡', '📝', '📌', '🔍', '📖', '✏️', '🏷️', '📊', '📋', '💬', '🎯', '✨', '📜', '🔖', '🎓', '📑', '🗺️', '📐', '✒️', '🖊️']
    },
    {
      title: '🎉 状态与生活',
      list: ['🎉', '🔥', '❤️', '🌟', '☕', '🎨', '🏆', '👏', '💯', '🌈', '🍀', '☀️', '🍵', '🍔', '🍕', '🎁', '🎈', '💎', '🌸', '🥳', '👀']
    },
    {
      title: '标记与符号',
      list: ['👉', '➡️', '⬇️', '⬆️', '✅', '❌', '⚠️', 'ℹ️', '⭕', '🔘', '🚩', '❓', '❗', '🔔', '🔒', '🔓', '🧭', '⭐', '✦', '❖', '•']
    }
  ];

  const UNSPLASH_PRESETS = [
    { name: '极客代码与屏幕', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800' },
    { name: '极简桌面与咖啡', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800' },
    { name: 'BentoUI 艺术色彩', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800' },
    { name: '深色架构与网格', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800' },
    { name: '未来科技光影', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800' }
  ];

  // Quick Typography Snippets
  const TYPOGRAPHY_SNIPPETS = [
    {
      id: 'tip',
      name: '💡 提示卡片',
      icon: Lightbulb,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      snippet: `> 💡 **提示**：在这里填写温馨提示或补充说明内容。`
    },
    {
      id: 'warning',
      name: '⚠️ 警告提示',
      icon: AlertTriangle,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      snippet: `> ⚠️ **注意**：此处为重要注意事项或配置风险提示，请仔细核对。`
    },
    {
      id: 'key_takeaway',
      name: '🚀 核心要点',
      icon: Rocket,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
      snippet: `> 🚀 **核心结论**：一句话总结本文核心观点，帮助读者快速把握要义。`
    },
    {
      id: 'success',
      name: '🎉 成功公告',
      icon: PartyPopper,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      snippet: `> 🎉 **版本发布**：功能已全面升级并成功部署，带来全新的交互质感！`
    },
    {
      id: 'details',
      name: '展开折叠区',
      icon: ChevronDown,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      snippet: `<details>\n<summary><b>点击展开查看完整代码与配置细节</b></summary>\n\n这里是折叠内部的详细内容，支持标准 Markdown 与代码段。\n\n</details>`
    },
    {
      id: 'quote',
      name: '精致名言',
      icon: Quote,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
      snippet: `> "简单不仅是一种视觉风格，更是一种对待复杂世界的优雅态度。"\n> —— *三疯 Sanfun*`
    },
    {
      id: 'table',
      name: '对比表格',
      icon: Table,
      color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',
      snippet: `| 功能指标 | 原旧方案 | 升级后新方案 | 性能提升 |
| :--- | :--- | :--- | :--- |
| **首屏渲染** | 1.8s | 0.4s | 🚀 77% |
| **内存占用** | 120MB | 45MB | ⚡ 62% |`
    },
    {
      id: 'timeline',
      name: '步骤时间轴',
      icon: ListOrdered,
      color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
      snippet: `- **步骤 1：需求拆解** — 明确用户核心诉求与排版约束。
- **步骤 2：视觉原型** — 采用 Sanfun Bento 网格规范进行布局划分。
- **步骤 3：上线部署** — 快速迭代并进行多端响应式校验。`
    },
    {
      id: 'code',
      name: '代码高亮',
      icon: FileCode,
      color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
      snippet: `\`\`\`tsx
// Bento 布局示例组件
export const BentoCard = ({ title }: { title: string }) => {
  return (
    <div className="p-4 bg-zinc-900 text-white rounded-lg shadow-lg">
      <h3 className="font-bold">{title}</h3>
    </div>
  );
};
\`\`\``
    },
    {
      id: 'image',
      name: '图注卡片',
      icon: ImageIcon,
      color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800',
      snippet: `![配图说明](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800)\n*图 1.1：Sanfun Bento 视觉与组件细节展示*`
    }
  ];

  const FULL_TEMPLATES = [
    {
      id: 'tech_review',
      title: '🚀 科技 & 架构性能解析模版',
      category: '技术干货',
      tags: '架构设计, React 19, 性能优化',
      summary: '深入拆解全新响应式架构的设计哲学与性能优化实战，包含对比表格与核心代码。',
      desc: '包含业务背景、对比表格、核心代码段、重点提示与折叠细节区，适合发布技术深度好文。',
      content: `## 1. 业务背景与问题痛点

在现代前端开发中，保持极致的渲染性能与良好的用户体验至关重要。随着项目规模增长，传统的组件架构面临以下挑战：

> ⚠️ **注意**：首屏加载资源过多会导致 Lighthouse 性能评分下降，建议开启按需加载与服务端代理。

---

## 2. 核心架构设计

我们采用了全新的全栈响应式架构，并结合了 Gemini 智能分析引擎：

| 指标维度 | 优化前旧方案 | 优化后新方案 | 性能提升幅度 |
| :--- | :--- | :--- | :--- |
| **FCP (首屏绘制)** | 2.1s | 0.4s | 🚀 81% |
| **BUNDLE 体积** | 1.2MB | 310KB | ⚡ 74% |
| **交互响应延迟** | 120ms | 16ms | 🎯 86% |

\`\`\`tsx
// 核心路由与数据预加载架构
export async function getStaticProps() {
  const data = await fetchBlogArticles();
  return { props: { articles: data } };
}
\`\`\`

---

## 3. 核心结论与经验总结

> 🚀 **核心要点**：通过合理的组件拆分与缓存策略，可以大幅提升应用的响应流畅度与交互质感。

<details>
<summary><b>点击展开查看完整代码库目录结构</b></summary>

- \`/src/components\`: UI 视图与 Bento 卡片组件
- \`/src/context\`: 主题与状态管理器
- \`/server.ts\`: Express 服务端 proxy 与后端 API

</details>`
    },
    {
      id: 'design_spec',
      title: '🎨 UI/UX 设计与 Bento 规范模版',
      category: 'UI/UX设计',
      tags: 'BentoUI, 设计规范, Sanfun主题',
      summary: '探讨如何将秩序感与微动态引入 Bento 布局，打造出色的数字花园视觉与交互体验。',
      desc: '包含设计师名言、带图注精美图片、Bento 网格特点列举与版本发布高亮卡片。',
      content: `> "优秀的 UI 设计不仅让视效赏心悦目，更能引导用户顺畅地完成目标交互。"
> —— *三疯 Sanfun*

## 1. 设计理念：把秩序感带入卡片

在本次 Sanfun 博客的视觉迭代中，我们引入了 Sanfun 式 Bento 栅格体系。通过高对比度卡片、恰到好处的圆角与呼吸感间距，呈现出秩序与层次感。

> 💡 **提示**：建议使用 24px 大圆角与 16px 外边距以获得最佳视觉效果。

---

## 2. 关键设计细节

![Bento Grid 组件展示](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800)
*图 1.1：Bento 栅格高分辨率对比效果图*

- **渐进式沉浸**: 结合 Tailwind CSS v4 与平滑过渡动画
- **深浅色自适应**: 无缝支持 Dark / Light Mode 优雅切换
- **层次化网格**: 将高频微动态与经典文章错落排布

---

## 3. 总结与后续规划

> 🎉 **版本发布**：此套设计系统已全面上线，欢迎体验并提出改进建议！`
    },
    {
      id: 'gadget_review',
      title: '📦 硬件开箱 & 极客测评模版',
      category: '装备数码',
      tags: '硬件测评, 极客装备, 生产力',
      summary: '全方位深度测评主力生产力装备，包含多维评分表格与优缺点客观分析。',
      desc: '包含硬件配置对比表、选购指南卡片、评分指标与折叠配置参数，适合发表设备测评。',
      content: `## 1. 选购背景与第一印象

作为长期工作的全栈工程师与设计师，对硬件装备的舒适度与性能有极高要求。

> 🚀 **核心要点**：优秀的生产力工具能够显著提高工作专注度与产出效率。

---

## 2. 详细配置与实际体验

| 测评维度 | 参数配置 | 实际体验评分 |
| :--- | :--- | :--- |
| **屏幕色彩** | 4K Mini-LED 120Hz | ⭐️⭐️⭐️⭐️⭐️ (5/5) |
| **续航表现** | 18 小时综合续航 | ⭐️⭐️⭐️⭐️⭐️ (5/5) |
| **噪音控制** | 风扇常态静音 | ⭐️⭐️⭐️⭐️⭐️ (5/5) |

> 💡 **提示**：建议配合人体工学显示器支架使用以保护颈椎健康。

---

## 3. 优缺点汇总

- **优点**:
  1. 顶级工业设计与高质感金属机身
  2. 极高的能效比，全天候运行安静
- **缺点**:
  1. 接口数量较少，需搭配扩展坞

<details>
<summary><b>点击展开查看完整参数测试数据</b></summary>

包含详细接口协议、适配器功率及极限发热测试数据。

</details>`
    },
    {
      id: 'essay_notes',
      title: '✍️ 开发者日志 & 思考随笔模版',
      category: '生活随笔',
      tags: '独立开发, 思考随笔, 程序员',
      summary: '记录近期独立开发过程中的顿悟与思考，探讨工作与生活的平衡。',
      desc: '包含开篇金句、步骤里程碑时间轴、温馨提示卡片与末尾感悟，适合日常随笔记录。',
      content: `> "保持好奇，持续探索。用代码打造美观且有价值的数字产品。"
> —— *三疯 Sanfun*

## 1. 近期思考与顿悟

在过去的一个月中，我一直在思考如何平衡工程复杂度与产品灵巧度：

- **步骤 1：明确核心方向** — 剔除冗余功能，聚焦于真正为用户创造价值的细节。
- **步骤 2：沉淀设计系统** — 构建可复用的 UI 规范与交互逻辑。
- **步骤 3：保持长期主义** — 日拱一卒，打造陪伴式个人数字花园。

---

## 2. 关键收获与复盘

> 💡 **提示**：无论是技术选型还是生活选择，复盘都是最快速的成长方式。

> 🎉 **阶段成果**：Sanfun 个人博客全新后台系统与主题排版工具上线！`
    }
  ];

  const handleInsertSnippet = (snippet: string, snippetName?: string) => {
    const textarea = contentRef.current;
    if (!textarea) {
      setContent(prev => prev ? prev + '\n\n' + snippet : snippet);
      showToast(`已插入排版样式「${snippetName || '通用卡片'}」`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = content;

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);

    const needBeforeNewline = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    const needAfterNewline = after && !after.startsWith('\n\n') ? (after.startsWith('\n') ? '\n' : '\n\n') : '';

    const newContent = before + needBeforeNewline + snippet + needAfterNewline + after;
    setContent(newContent);
    showToast(`已插入排版样式「${snippetName || '常用样式'}」`);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + needBeforeNewline.length + snippet.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleLoadFullTemplate = (templateContent: string, templateTitle: string, defaultCategory?: string, defaultTags?: string, defaultSummary?: string) => {
    if (content.trim() && content !== templateContent) {
      if (!window.confirm(`确认要载入文章模版「${templateTitle}」吗？这将会覆盖当前输入框中的正文内容。`)) {
        return;
      }
    }
    setContent(templateContent);
    if (defaultCategory && categories.includes(defaultCategory)) setCategory(defaultCategory);
    if (defaultTags && (!tags || tags === 'Bento, React 19, UI')) setTags(defaultTags);
    if (defaultSummary && (!summary || summary.includes('用于搜索'))) setSummary(defaultSummary);
    setShowTemplateModal(false);
    showToast(`已成功一键载入文章排版模版「${templateTitle}」！`);
  };

  // Category & Navigation Menu management states & integrated subtab
  const [articleSubTab, setArticleSubTab] = useState<'editor' | 'categories' | 'navMenu'>('editor');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string | null>(null);
  const [showInlineCatAdd, setShowInlineCatAdd] = useState(false);
  const [inlineCatNameInput, setInlineCatNameInput] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [editingCatOldName, setEditingCatOldName] = useState<string | null>(null);
  const [editingCatNewName, setEditingCatNewName] = useState('');

  // Equipment management states
  const [editingEqId, setEditingEqId] = useState<string | null>(null);
  const [eqName, setEqName] = useState('');
  const [eqCategory, setEqCategory] = useState('核心硬件');
  const [eqDescription, setEqDescription] = useState('');
  const [eqIconName, setEqIconName] = useState('Laptop');
  const [eqRating, setEqRating] = useState(5);
  const [eqStatus, setEqStatus] = useState('主力使用');
  const [eqImageUrl, setEqImageUrl] = useState('');
  const [eqLink, setEqLink] = useState('');

  // Form states for moment
  const [editingMomentId, setEditingMomentId] = useState<string | null>(null);
  const [momentContent, setMomentContent] = useState('');
  const [momentTags, setMomentTags] = useState('开发日志');
  const [momentImage, setMomentImage] = useState('');
  const [momentLocation, setMomentLocation] = useState('常州 · 钟楼');

  // Form states for profile
  const [profileName, setProfileName] = useState(profile.name);
  const [profileAvatar, setProfileAvatar] = useState(profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300");
  const [profileTagline, setProfileTagline] = useState(profile.tagline);
  const [profileBio, setProfileBio] = useState(profile.bio);
  const [profileStatus, setProfileStatus] = useState(profile.statusText);
  const [profileStatusEmoji, setProfileStatusEmoji] = useState(profile.statusEmoji || '🤩');
  const [profileLocation, setProfileLocation] = useState(profile.location);
  const [profileIcpNumber, setProfileIcpNumber] = useState(siteConfig?.icpNumber || '粤ICP备2021000000号-1');
  const [profileTechStack, setProfileTechStack] = useState<{ name: string; icon: string; color: string }[]>(profile.techStack || []);
  const [profileCustomLinks, setProfileCustomLinks] = useState<{ id: string; name: string; icon: string; url: string; color?: string }[]>(
    profile.customLinks && profile.customLinks.length > 0
      ? profile.customLinks
      : [
          { id: 'moments', name: '归档动态', icon: 'Calendar', url: 'action:moments' },
          { id: 'github', name: 'GitHub', icon: 'Github', url: profile.socials?.github || 'https://github.com' },
          { id: 'email', name: 'Email', icon: 'Mail', url: profile.socials?.email ? `mailto:${profile.socials.email}` : 'mailto:sanfun185@gmail.com' },
          { id: 'bilibili', name: 'Bilibili', icon: 'Bilibili', url: profile.socials?.bilibili || 'https://bilibili.com' }
        ]
  );

  // Sidebar Promo Blocks States
  const defaultSidebarPromos: SidebarPromoBlock[] = [
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

  const [profileSidebarPromos, setProfileSidebarPromos] = useState<SidebarPromoBlock[]>(
    profile.sidebarPromos && profile.sidebarPromos.length > 0 ? profile.sidebarPromos : defaultSidebarPromos
  );

  // Front-End Custom Logo States
  const [profileCustomLogoType, setProfileCustomLogoType] = useState<'image' | 'text' | 'icon'>(profile.customLogoType || 'image');
  const [profileCustomLogoUrl, setProfileCustomLogoUrl] = useState(profile.customLogoUrl || siteConfig?.logoImageUrl || '');
  const [profileCustomLogoText, setProfileCustomLogoText] = useState(profile.customLogoText || siteConfig?.logoText || siteConfig?.siteTitle || 'Sanfun');
  const [profileCustomLogoLink, setProfileCustomLogoLink] = useState(profile.customLogoLink || '');

  const [editingTechIndex, setEditingTechIndex] = useState<number | null>(null);
  const [techNameInput, setTechNameInput] = useState('');
  const [techColorInput, setTechColorInput] = useState('#3B82F6');
  const [techIconInput, setTechIconInput] = useState('Code2');

  // Admin Credentials States
  const [adminUsername, setAdminUsername] = useState('admin');
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  const handleUpdateAdminCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentAdminPassword) {
      showToast('请输入当前原密码以验证权限！');
      return;
    }
    if (newAdminPassword && newAdminPassword !== confirmAdminPassword) {
      showToast('两次输入的确认新密码不一致！');
      return;
    }
    if (newAdminPassword && newAdminPassword.length < 3) {
      showToast('新密码过于简单，长度至少 3 个字符！');
      return;
    }

    setIsUpdatingCredentials(true);
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentAdminPassword,
          newUsername: adminUsername,
          newPassword: newAdminPassword
        })
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        showToast(data.message || '后台管理员账号与密码修改成功！');
        setCurrentAdminPassword('');
        setNewAdminPassword('');
        setConfirmAdminPassword('');
        if (data.username) {
          setAdminUsername(data.username);
        }
      } else {
        showToast(data?.error || '修改凭据失败，请检查原密码！');
      }
    } catch (err) {
      console.error(err);
      showToast('网络请求失败，请稍后重试！');
    } finally {
      setIsUpdatingCredentials(false);
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo 图片请控制在 5MB 以内');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProfileCustomLogoUrl(dataUrl);
      setProfileCustomLogoType('image');
      showToast('自定义 Logo 图片已成功载入！');
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('形象照图片请控制在 8MB 以内');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProfileAvatar(dataUrl);
      setCropperTarget('avatar');
      setIsCropperOpen(true);
      showToast('形象照已预载入，您可以在裁切弹窗中进一步调整区域！');
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomLink = () => {
    const newLink = {
      id: 'link_' + Date.now(),
      name: '新社交外链',
      icon: 'Github',
      url: 'https://'
    };
    setProfileCustomLinks(prev => [...prev, newLink]);
  };

  const handleDeleteCustomLink = (index: number) => {
    setProfileCustomLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveCustomLink = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === profileCustomLinks.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setProfileCustomLinks(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

  const handleCustomLinkChange = (index: number, key: 'name' | 'icon' | 'url', value: string) => {
    setProfileCustomLinks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  // Promo Blocks handlers
  const handleAddPromoBlock = () => {
    const newBlock: SidebarPromoBlock = {
      id: `promo_${Date.now()}`,
      title: '新推荐与合作模块',
      subtitle: '支持填写项目优势、产品优势或引导链接 ▶',
      badgeText: 'NEW',
      icon: '🚀',
      bgGradient: 'from-blue-500 via-indigo-500 to-purple-600',
      linkUrl: 'https://'
    };
    setProfileSidebarPromos(prev => [...prev, newBlock]);
  };

  const handleUpdatePromoBlock = (index: number, field: keyof SidebarPromoBlock, value: any) => {
    setProfileSidebarPromos(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDeletePromoBlock = (index: number) => {
    if (confirm('确定要删除该侧边栏宣传/推荐卡片模块吗？')) {
      setProfileSidebarPromos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleMovePromoBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === profileSidebarPromos.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setProfileSidebarPromos(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

  // Sync profile state when modal opens or profile prop changes
  useEffect(() => {
    if (isOpen && profile) {
      setProfileName(profile.name);
      setProfileAvatar(profile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300");
      setProfileTagline(profile.tagline);
      setProfileBio(profile.bio);
      setProfileStatus(profile.statusText);
      setProfileStatusEmoji(profile.statusEmoji || '🤩');
      setProfileLocation(profile.location);
      setProfileTechStack(profile.techStack || []);
      setProfileCustomLogoType(profile.customLogoType || 'image');
      setProfileCustomLogoUrl(profile.customLogoUrl || siteConfig?.logoImageUrl || '');
      setProfileCustomLogoText(profile.customLogoText || siteConfig?.logoText || siteConfig?.siteTitle || 'Sanfun');
      setProfileCustomLogoLink(profile.customLogoLink || '');
      setProfileIcpNumber(siteConfig?.icpNumber || '粤ICP备2021000000号-1');
      setProfileCustomLinks(
        profile.customLinks && profile.customLinks.length > 0
          ? profile.customLinks
          : [
              { id: 'moments', name: '归档动态', icon: 'Calendar', url: 'action:moments' },
              { id: 'github', name: 'GitHub', icon: 'Github', url: profile.socials?.github || 'https://github.com' },
              { id: 'email', name: 'Email', icon: 'Mail', url: profile.socials?.email ? `mailto:${profile.socials.email}` : 'mailto:sanfun185@gmail.com' },
              { id: 'bilibili', name: 'Bilibili', icon: 'Bilibili', url: profile.socials?.bilibili || 'https://bilibili.com' }
            ]
      );
      setProfileSidebarPromos(
        profile.sidebarPromos && profile.sidebarPromos.length > 0
          ? profile.sidebarPromos
          : defaultSidebarPromos
      );

      // Fetch current admin credentials username
      fetch('/api/admin/credentials')
        .then(res => res.json())
        .then(data => {
          if (data?.username) {
            setAdminUsername(data.username);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, profile, siteConfig]);

  // Sync category state when categories change
  useEffect(() => {
    if (categories.length > 0 && (!category || !categories.includes(category))) {
      setCategory(categories[0]);
    }
  }, [categories]);

  // Helper for SHA-256 client-side encryption
  const sha256Hex = async (str: string): Promise<string> => {
    try {
      const msgUint8 = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return str;
    }
  };

  // Fetch security captcha
  const fetchCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const res = await fetch('/api/admin/captcha');
      if (res.ok) {
        const data = await res.json();
        setCaptchaSvg(data.svg);
        setCaptchaId(data.captchaId);
      }
    } catch (err) {
      console.error('Failed to load captcha', err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  // Check login status on mount or modal open
  useEffect(() => {
    if (isOpen) {
      try {
        const token = sessionStorage.getItem('sanfun_admin_token') || sessionStorage.getItem('zhheo_admin_token');
        if (token) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          fetchCaptcha();
        }
      } catch (e) {
        setIsAuthenticated(false);
        fetchCaptcha();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const cleanUsername = (customUser || loginUsername).trim();
    const cleanPassword = (customPass || loginPassword).trim();

    if (!cleanUsername || !cleanPassword) {
      setLoginError('请输入用户名和密码！');
      return;
    }

    if (!customUser && !captchaInput.trim()) {
      setLoginError('请输入图形验证码！');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const passwordHash = await sha256Hex(cleanPassword);

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password: cleanPassword,
          passwordHash,
          captchaId,
          captchaInput: captchaInput.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data?.success) {
        try {
          sessionStorage.setItem('sanfun_admin_token', data.token);
        } catch (e) {}
        setIsAuthenticated(true);
        setLoginError('');
        setSecurityAuditInfo(data.securityAudit || null);
        showToast('通过 SHA-256 安全加密验证，成功登录！');
      } else {
        setLoginError(data?.error || '用户名、密码或验证码错误，请重试');
        fetchCaptcha();
        setCaptchaInput('');
      }
    } catch (err) {
      // Local fallback in case of connection issue
      if (
        (cleanUsername.toLowerCase() === 'admin' || cleanUsername.toLowerCase() === 'sanfun' || cleanUsername.toLowerCase() === 'zhheo') &&
        (cleanPassword === 'sanfun123' || cleanPassword === 'zhheo123' || cleanPassword === 'admin')
      ) {
        try {
          sessionStorage.setItem('sanfun_admin_token', 'fallback_token_' + Date.now());
        } catch (e) {}
        setIsAuthenticated(true);
        setLoginError('');
        showToast('已登录管理控制台（本地离线模式）');
      } else {
        setLoginError('网络或服务端校验异常，请刷新验证码后再试');
        fetchCaptcha();
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sanfun_admin_token');
    sessionStorage.removeItem('zhheo_admin_token');
    setIsAuthenticated(false);
    setLoginPassword('');
    showToast('已退出控制台');
  };

  // Article handlers
  const handleStartNewArticle = () => {
    setEditingArticleId(null);
    setTitle('');
    setCategory(categories[0] || '产品设计');
    setTags('Bento Grid, UI 设计');
    setCoverImage('');
    setCoverBg('from-indigo-600 via-slate-700 to-blue-600');
    setCoverText('SANFUN');
    setMascotIcon('🪵');
    setReadStatus('最新');
    setSummary('');
    setContent('');
    setFeatured(false);
    setIsHeroFeatured(false);
    setIsBannerRecommend(false);
    setIsPaid(false);
    setPrice(10);
    setRequiredLevel(1);
    setPaidContent('');
    setRequireCommentToView(false);
    setAttachments([]);
    setNetdiskLinks([]);
    setMobileSubView('editor');
  };

  const handleEditArticleClick = (art: Article) => {
    setEditingArticleId(art.id);
    setTitle(art.title);
    setCategory(art.category);
    setTags(art.tags.join(', '));
    setCoverImage(art.coverImage || '');
    setCoverBg(art.coverBg || 'from-indigo-600 via-slate-700 to-blue-600');
    setCoverText(art.coverText || art.category || 'SANFUN');
    setMascotIcon(art.mascotIcon || '🪵');
    setReadStatus(art.readStatus || '最新');
    setSummary(art.summary);
    setContent(art.content);
    setFeatured(!!art.featured);
    setIsHeroFeatured(!!art.isHeroFeatured);
    setIsBannerRecommend(!!art.isBannerRecommend);
    setIsPaid(!!art.isPaid);
    setPrice(art.price ?? 10);
    setRequiredLevel(art.requiredLevel ?? 1);
    setPaidContent(art.paidContent || '');
    setRequireCommentToView(!!art.requireCommentToView);
    setAttachments(art.attachments || []);
    setNetdiskLinks(art.netdiskLinks || []);
    setMobileSubView('editor');
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    const articlePayload = {
      title,
      category,
      tags: tagArray,
      coverImage,
      coverBg,
      coverText,
      mascotIcon,
      readStatus,
      summary,
      content,
      featured,
      isHeroFeatured,
      isBannerRecommend,
      isPaid,
      price: Number(price) || 0,
      requiredLevel: Number(requiredLevel) || 1,
      paidContent,
      requireCommentToView,
      attachments,
      netdiskLinks
    };

    try {
      if (editingArticleId) {
        // Update
        const res = await fetch(`/api/articles/${editingArticleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articlePayload)
        });
        const updated = await res.json();
        onArticleUpdated(updated);
        showToast('文章修改成功！');
      } else {
        // Create
        const res = await fetch('/api/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articlePayload)
        });
        const created = await res.json();
        onArticleCreated(created);
        showToast('新文章发布成功！');
      }
      handleStartNewArticle();
    } catch (err) {
      console.error(err);
      alert('保存失败，请检查后端网络连接。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('确定要删除这篇博客文章吗？此操作不可撤销。')) return;
    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      onArticleDeleted(id);
      showToast('文章已彻底删除');
      if (editingArticleId === id) {
        handleStartNewArticle();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAISummary = async () => {
    if (!content.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleTitle: title,
          articleContent: content
        })
      });
      const data = await res.json();
      if (data?.summary) {
        setSummary(data.summary);
        showToast('AI 已成功提炼文章核心摘要！');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiGenerating(false);
    }
  };

  // Category handlers
  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() })
      });
      const data = await res.json();
      if (data?.categories) {
        onCategoriesUpdated(data.categories);
        setCategory(newCatName.trim());
        setNewCatName('');
        showToast(`成功新增分类「${newCatName.trim()}」`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCategory = async (oldName: string) => {
    if (!editingCatNewName.trim() || editingCatNewName.trim() === oldName) {
      setEditingCatOldName(null);
      return;
    }

    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: editingCatNewName.trim() })
      });
      const data = await res.json();
      if (data?.categories) {
        onCategoriesUpdated(data.categories);
        // Refresh local articles category mapping
        articles.forEach(a => {
          if (a.category === oldName) {
            onArticleUpdated({ ...a, category: editingCatNewName.trim() });
          }
        });
        showToast(`分类已重命名为「${editingCatNewName.trim()}」并关联全部文章`);
        setEditingCatOldName(null);
        setEditingCatNewName('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`确认删除分类「${catName}」吗？关联此分类的文章将被移至第一分类。`)) return;
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(catName)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data?.categories) {
        onCategoriesUpdated(data.categories);
        showToast(`分类「${catName}」已被删除`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Equipment handlers
  const handleStartNewEquipment = () => {
    setEditingEqId(null);
    setEqName('');
    setEqCategory('核心硬件');
    setEqDescription('');
    setEqIconName('Laptop');
    setEqRating(5);
    setEqStatus('主力使用');
    setEqImageUrl('');
    setEqLink('');
  };

  const handleEditEquipmentClick = (item: EquipmentItem) => {
    setEditingEqId(item.id);
    setEqName(item.name);
    setEqCategory(item.category);
    setEqDescription(item.description);
    setEqIconName(item.iconName || 'Laptop');
    setEqRating(item.rating || 5);
    setEqStatus(item.status || '主力使用');
    setEqImageUrl(item.imageUrl || '');
    setEqLink(item.link || '');
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqName.trim()) return;

    try {
      if (editingEqId) {
        const res = await fetch(`/api/equipment/${editingEqId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: eqName,
            category: eqCategory,
            description: eqDescription,
            iconName: eqIconName,
            rating: eqRating,
            status: eqStatus,
            imageUrl: eqImageUrl,
            link: eqLink
          })
        });
        const updated = await res.json();
        onEquipmentUpdated(updated);
        showToast(`硬件装备「${eqName}」修改成功！`);
      } else {
        const res = await fetch('/api/equipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: eqName,
            category: eqCategory,
            description: eqDescription,
            iconName: eqIconName,
            rating: eqRating,
            status: eqStatus,
            imageUrl: eqImageUrl,
            link: eqLink
          })
        });
        const created = await res.json();
        onEquipmentCreated(created);
        showToast(`成功添加新装备「${eqName}」！`);
      }
      handleStartNewEquipment();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('确定要删除这项硬件装备吗？')) return;
    try {
      await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
      onEquipmentDeleted(id);
      showToast('装备已彻底删除');
      if (editingEqId === id) handleStartNewEquipment();
    } catch (e) {
      console.error(e);
    }
  };

  // Moment handlers (Publish & Edit)
  const handleSaveMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!momentContent.trim()) return;

    try {
      const tagArray = momentTags.split(',').map(t => t.trim()).filter(Boolean);
      const imageArray = momentImage.trim() ? [momentImage.trim()] : [];

      if (editingMomentId) {
        // Update existing moment
        const res = await fetch(`/api/moments/${editingMomentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: momentContent.trim(),
            tags: tagArray,
            images: imageArray,
            location: momentLocation.trim()
          })
        });
        const updated = await res.json();
        if (onMomentUpdated) onMomentUpdated(updated);
        showToast('即刻/说说动态已成功更新！');
      } else {
        // Create new moment
        const res = await fetch('/api/moments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: momentContent.trim(),
            tags: tagArray,
            images: imageArray,
            location: momentLocation.trim()
          })
        });
        const created = await res.json();
        onMomentCreated(created);
        showToast('即刻/说说动态发布成功！');
      }

      handleCancelMomentEdit();
    } catch (e) {
      console.error(e);
      showToast('操作失败，请重试');
    }
  };

  const handleStartEditMoment = (m: Moment) => {
    setEditingMomentId(m.id);
    setMomentContent(m.content);
    setMomentTags(m.tags ? m.tags.join(', ') : '开发日志');
    setMomentImage(m.images && m.images.length > 0 ? m.images[0] : '');
    setMomentLocation(m.location || '常州 · 钟楼');
  };

  const handleCancelMomentEdit = () => {
    setEditingMomentId(null);
    setMomentContent('');
    setMomentTags('开发日志');
    setMomentImage('');
    setMomentLocation('常州 · 钟楼');
  };

  const handleDeleteMoment = async (id: string) => {
    if (!confirm('确定要删除此条即刻/说说动态吗？')) return;
    try {
      await fetch(`/api/moments/${id}`, { method: 'DELETE' });
      onMomentDeleted(id);
      showToast('动态已删除');
      if (editingMomentId === id) handleCancelMomentEdit();
    } catch (e) {
      console.error(e);
    }
  };

  // Profile handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const profileData = {
        name: profileName,
        avatar: profileAvatar,
        tagline: profileTagline,
        bio: profileBio,
        statusText: profileStatus,
        statusEmoji: profileStatusEmoji,
        location: profileLocation,
        techStack: profileTechStack,
        customLogoType: profileCustomLogoType,
        customLogoUrl: profileCustomLogoUrl,
        customLogoText: profileCustomLogoText,
        customLogoLink: profileCustomLogoLink,
        customLinks: profileCustomLinks,
        sidebarPromos: profileSidebarPromos
      };

      const res = await fetch('/api/author', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      const updated = await res.json();
      onProfileUpdated(updated);

      if (siteConfig) {
        const updatedSiteConfig = {
          ...siteConfig,
          siteTitle: profileCustomLogoText || siteConfig.siteTitle || 'Sanfun',
          logoType: profileCustomLogoType,
          logoImageUrl: profileCustomLogoUrl,
          logoText: profileCustomLogoText,
          icpNumber: profileIcpNumber
        };
        fetch('/api/site-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedSiteConfig)
        }).then(() => {
          if (onSiteConfigUpdated) onSiteConfigUpdated(updatedSiteConfig);
        }).catch(() => {});
      }

      // Save page adaptive and layout config
      fetch('/api/layout-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localLayoutConfig)
      }).then(() => {
        if (onLayoutConfigUpdated) onLayoutConfigUpdated(localLayoutConfig);
        try {
          localStorage.setItem('sanfun_layout_config', JSON.stringify(localLayoutConfig));
        } catch (e) {}
      }).catch(() => {});

      showToast('作者个人资料、页面自适应与全站设置已保存！');
      onClose();
    } catch (err) {
      console.error('Failed to save profile:', err);
      showToast('保存作者资料失败，请重试！');
    }
  };

  const handleAddOrUpdateTechStack = () => {
    if (!techNameInput.trim()) return;

    if (editingTechIndex !== null) {
      const updated = [...profileTechStack];
      updated[editingTechIndex] = {
        name: techNameInput.trim(),
        color: techColorInput || '#3B82F6',
        icon: techIconInput || 'Code2'
      };
      setProfileTechStack(updated);
      showToast(`已更新技术栈「${techNameInput.trim()}」`);
      setEditingTechIndex(null);
    } else {
      const newItem = {
        name: techNameInput.trim(),
        color: techColorInput || '#3B82F6',
        icon: techIconInput || 'Code2'
      };
      setProfileTechStack([...profileTechStack, newItem]);
      showToast(`已新增技术栈「${techNameInput.trim()}」`);
    }

    setTechNameInput('');
    setTechColorInput('#3B82F6');
    setTechIconInput('Code2');
  };

  const handleEditTechStackClick = (index: number) => {
    const item = profileTechStack[index];
    if (!item) return;
    setEditingTechIndex(index);
    setTechNameInput(item.name);
    setTechColorInput(item.color || '#3B82F6');
    setTechIconInput(item.icon || 'Code2');
  };

  const handleDeleteTechStack = (index: number) => {
    const item = profileTechStack[index];
    setProfileTechStack(prev => prev.filter((_, i) => i !== index));
    if (editingTechIndex === index) {
      setEditingTechIndex(null);
      setTechNameInput('');
    }
    showToast(`已删除技术栈「${item?.name || ''}」`);
  };

  if (!isOpen) return null;

  // Minimized state dock floating pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-zinc-900/95 dark:bg-zinc-800/95 text-white border border-zinc-700/80 shadow-2xl rounded-full px-4 py-2.5 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 hover:border-zinc-500 transition-all select-none">
        <div 
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="点击还原控制台"
        >
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold tracking-wide">
            Sanfun 控制台 <span className="text-zinc-400 font-normal hidden sm:inline">(已最小化)</span>
          </span>
        </div>

        <div className="h-4 w-[1px] bg-zinc-700 my-auto" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700/80 transition-colors"
            title="还原窗口"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setIsMinimized(false);
              onClose();
            }}
            className="p-1.5 rounded-full text-zinc-400 hover:text-rose-400 hover:bg-zinc-700/80 transition-colors"
            title="关闭控制台"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md animate-in fade-in duration-200 ${
      isMaximized ? 'p-0 bg-black/85' : 'p-2 sm:p-4 md:p-6 bg-black/75'
    }`}>
      <div className={`bg-white dark:bg-zinc-900 flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden relative transition-all duration-300 ${
        isMaximized 
          ? 'w-full h-full rounded-none border-0' 
          : `rounded-2xl w-full ${localLayoutConfig.enableAdaptiveWidth === false ? 'max-w-6xl' : (localLayoutConfig.adaptiveMaxWidth || 'max-w-[1440px]')} h-[92vh] sm:h-[88vh]`
      }`}>
        
        {/* Floating Toast Alert */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/90 dark:bg-white/90 text-white dark:text-zinc-900 text-xs font-bold px-4 py-2.5 rounded-md shadow-xl backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-top-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Top Header Bar */}
        <div className="p-3 sm:p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-sm select-none">
          <div 
            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
            onDoubleClick={() => setIsMaximized(!isMaximized)}
            title="双击切换全屏 / 还原"
          >
            {/* macOS Style Window Traffic Lights */}
            <div className="flex items-center gap-1.5 mr-1 hidden sm:flex shrink-0">
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                title="关闭" 
                className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors flex items-center justify-center group"
              >
                <X className="w-2 h-2 text-rose-950 opacity-0 group-hover:opacity-100" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }} 
                title="最小化" 
                className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center group"
              >
                <Minus className="w-2 h-2 text-amber-950 opacity-0 group-hover:opacity-100" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }} 
                title={isMaximized ? "还原窗口" : "最大化"} 
                className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center group"
              >
                <Maximize2 className="w-2 h-2 text-emerald-950 opacity-0 group-hover:opacity-100" />
              </button>
            </div>

            <div className={`p-2 rounded-md text-white shrink-0 ${accentClasses.bg}`}>
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
                <span className="truncate">Sanfun 博客控制台</span>
                <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  站长专用
                </span>
                {isMaximized && (
                  <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hidden sm:inline-block">
                    全屏最大化
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden md:block">
                文章发布、分类调整、硬件装备库维护与微动态发布
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors border border-rose-200/60 dark:border-rose-800/60 mr-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">退出登录</span>
              </button>
            )}

            {/* Window Action Controls Group */}
            <div className="flex items-center gap-0.5 bg-zinc-200/60 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-300/60 dark:border-zinc-700/60">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-zinc-700 transition-all"
                title="最小化"
              >
                <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-zinc-700 transition-all"
                title={isMaximized ? "还原窗口" : "最大化"}
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-zinc-700 transition-all"
                title="关闭控制台"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* UNAUTHENTICATED LOGIN SCREEN */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-800/90 p-6 sm:p-8 rounded-lg border border-zinc-200 dark:border-zinc-700 max-w-md w-full shadow-2xl text-center space-y-5 my-auto">
              
              {/* Security Shield Header */}
              <div className="relative inline-block mx-auto">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md">
                  <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-[14px] flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-zinc-800"></span>
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1.5">
                  <span>管理员安全加密登录</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-500 inline" />
                  <span>256-Bit SHA-256 哈希传输 · 动态图形验证码防护</span>
                </p>
              </div>

              <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5 text-left">
                {/* Username */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">用户名</label>
                  <div className="relative mt-1">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 rounded-md text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">登录密码</label>
                  <div className="relative mt-1">
                    <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 rounded-md text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Captcha Section */}
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>图形验证码</span>
                    <span className="text-[10px] text-indigo-500 font-normal">区分大小写</span>
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.toUpperCase())}
                      placeholder="验证码"
                      className="w-1/2 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 rounded-md text-center font-mono font-bold text-sm tracking-wider uppercase text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    
                    {/* Captcha Display & Refresh */}
                    <div className="w-1/2 flex items-center gap-1.5">
                      <div 
                        onClick={fetchCaptcha}
                        title="点击更换验证码"
                        className="flex-1 cursor-pointer overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700 hover:opacity-90 active:scale-95 transition-all shadow-inner flex items-center justify-center bg-slate-900 min-h-[42px]"
                      >
                        {captchaLoading ? (
                          <span className="text-[10px] text-zinc-400 animate-pulse">刷新中...</span>
                        ) : captchaSvg ? (
                          <div dangerouslySetInnerHTML={{ __html: captchaSvg }} className="w-full flex justify-center items-center" />
                        ) : (
                          <span className="text-[10px] text-zinc-400">点击获取</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={fetchCaptcha}
                        disabled={captchaLoading}
                        title="刷新验证码"
                        className="p-2.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${captchaLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {loginError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-md flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-medium leading-tight">{loginError}</span>
                  </div>
                )}

                {/* Quick Credentials Experience Helper */}
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-md border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>快捷体验登录</span>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginUsername('admin');
                        setLoginPassword('sanfun123');
                        showToast('已填入常用凭据，请输入右侧图形验证码！');
                      }}
                      className="text-amber-600 dark:text-amber-400 underline hover:font-black"
                    >
                      点击快速自动填入凭据
                    </button>
                  </div>
                  <p>账号: <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">admin</code> | 密码: <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">sanfun123</code></p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className={`w-full py-3 rounded-md text-xs sm:text-sm font-bold text-white shadow-md transition-all ${accentClasses.bg} disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SHA-256 加密验证中...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>加密验证并登录控制台</span>
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation Row */}
            <div className="px-3 sm:px-6 pt-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-1.5 overflow-x-auto shrink-0">
              <button
                onClick={() => { setActiveTab('articles'); setArticleSubTab('editor'); setMobileSubView('list'); }}
                className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'articles' || (activeTab as string) === 'categories' || (activeTab as string) === 'navMenu'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-t border-x border-zinc-200 dark:border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>文章、分类与菜单管理 ({articles.length}篇 / {categories.length}分类 / {localNavMenu.length}菜单)</span>
              </button>

              <button
                onClick={() => setActiveTab('equipment')}
                className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'equipment'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-t border-x border-zinc-200 dark:border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-purple-500" />
                <span>硬件装备 ({equipment.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('moments'); setMomentSubTab('moments'); }}
                className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'moments' || activeTab === 'music'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-t border-x border-zinc-200 dark:border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>微动态与歌单管理 ({moments.length}动态 / {adminPlaylist.length}曲目)</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-t border-x border-zinc-200 dark:border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>作者资料</span>
              </button>

              <button
                onClick={() => { setActiveTab('members'); setMemberSubTab('members'); }}
                className={`px-3.5 sm:px-4 py-2 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'members' || activeTab === 'tiers' || activeTab === 'messages' || activeTab === 'friendAudit'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-t border-x border-zinc-200 dark:border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <User className="w-3.5 h-3.5 text-indigo-500" />
                <span>会员、特权与互动管理</span>
              </button>
            </div>

            {/* Main Content Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-white dark:bg-zinc-900">
              
              {/* 1. ARTICLES, CATEGORIES & NAV MENU MANAGER TAB */}
              {(activeTab === 'articles' || (activeTab as string) === 'categories' || (activeTab as string) === 'navMenu') && (
                <div className="space-y-4 h-full">
                  {/* Article, Category & Navigation Menu Sub-tab Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                      <button
                        type="button"
                        onClick={() => setArticleSubTab('editor')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                          articleSubTab === 'editor'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>文章撰写与列表 ({articles.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setArticleSubTab('categories')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                          articleSubTab === 'categories'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                        <span>全站分类管理中心 ({categories.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setArticleSubTab('navMenu')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                          articleSubTab === 'navMenu'
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-emerald-500" />
                        <span>顶部菜单栏配置 ({localNavMenu.length})</span>
                      </button>
                    </div>

                    {adminCategoryFilter && articleSubTab === 'editor' && (
                      <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                        <span>已按分类筛选: <strong>{adminCategoryFilter}</strong></span>
                        <button
                          onClick={() => setAdminCategoryFilter(null)}
                          className="text-blue-500 hover:text-blue-700 font-bold underline text-[11px]"
                        >
                          显示全部
                        </button>
                      </div>
                    )}
                  </div>

                  {articleSubTab === 'editor' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                      
                      {/* Mobile Sub-view Toggle Header */}
                      <div className="lg:hidden flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg mb-2 col-span-full">
                        <button
                          onClick={() => setMobileSubView('list')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                            mobileSubView === 'list'
                              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                              : 'text-zinc-500'
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>文章列表</span>
                        </button>
                        <button
                          onClick={() => setMobileSubView('editor')}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                            mobileSubView === 'editor'
                              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                              : 'text-zinc-500'
                          }`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>{editingArticleId ? '修改文章' : '撰写编辑器'}</span>
                        </button>
                      </div>

                      {/* Articles List Column */}
                      <div className={`lg:col-span-4 space-y-3 lg:border-r lg:border-zinc-200/80 lg:dark:border-zinc-800/80 lg:pr-6 ${
                        mobileSubView === 'editor' ? 'hidden lg:block' : 'block'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            已发布文章列表
                          </h3>
                          <button
                            onClick={handleStartNewArticle}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-white ${accentClasses.bg}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>撰写新文章</span>
                          </button>
                        </div>

                        {/* Category Quick Filter Chips - Strictly Equal Width Grid Layout with 3px Gap */}
                        <div className="grid grid-cols-3 gap-[3px] text-[11px] mb-2.5 p-1 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
                          <button
                            type="button"
                            onClick={() => setAdminCategoryFilter(null)}
                            className={`w-full min-w-0 px-1.5 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-0.5 ${
                              !adminCategoryFilter
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-500'
                            }`}
                          >
                            <span className="truncate">全部</span>
                            <span className="text-[10px] opacity-75 shrink-0">({articles.length})</span>
                          </button>
                          {categories.map(cat => {
                            const count = articles.filter(a => a.category === cat).length;
                            const isActive = adminCategoryFilter === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                title={`${cat} (${count})`}
                                onClick={() => setAdminCategoryFilter(isActive ? null : cat)}
                                className={`w-full min-w-0 px-1.5 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-0.5 ${
                                  isActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-700/80 hover:border-blue-400 dark:hover:border-blue-500'
                                }`}
                              >
                                <span className="truncate">{cat}</span>
                                <span className="text-[10px] opacity-75 shrink-0">({count})</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                          {articles
                            .filter(art => !adminCategoryFilter || art.category === adminCategoryFilter)
                            .map((art) => (
                        <div
                          key={art.id}
                          className={`p-3 rounded-lg border transition-all text-left flex items-start justify-between group ${
                            editingArticleId === art.id
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                              : 'border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/40 hover:border-zinc-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2 cursor-pointer flex-1" onClick={() => handleEditArticleClick(art)}>
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {art.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                              <span className="px-1.5 py-0.2 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300 font-mono">
                                {art.category}
                              </span>
                              <span>•</span>
                              <span>{art.date}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                            <button
                              onClick={() => handleEditArticleClick(art)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-blue-500"
                              title="编辑"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(art.id)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-rose-500"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Article Editor Column */}
                  <div className={`lg:col-span-8 ${
                    mobileSubView === 'list' ? 'hidden lg:block' : 'block'
                  }`}>
                    <form onSubmit={handleSaveArticle} className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMobileSubView('list')}
                            className="lg:hidden p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {editingArticleId ? '编辑现有文章' : '草拟新文章'}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewMode(!previewMode)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{previewMode ? '返回编辑' : 'Markdown 预览'}</span>
                          </button>

                          <button
                            type="submit"
                            disabled={submitting}
                            className={`px-3.5 py-1.5 rounded-md text-xs font-bold text-white shadow-sm flex items-center gap-1 ${accentClasses.bg}`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{editingArticleId ? '更新' : '发布'}</span>
                          </button>
                        </div>
                      </div>

                      {previewMode ? (
                        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 min-h-[350px] max-h-[450px] overflow-y-auto prose dark:prose-invert max-w-none text-xs sm:text-sm">
                          <h1>{title || '文章标题预览'}</h1>
                          <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>{content}</Markdown>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-bold text-zinc-400 uppercase">文章标题</label>
                            <input
                              type="text"
                              required
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="如：设计 Sanfun 式 Bento 栅格组件库..."
                              className="w-full bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-md text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-bold"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 items-start">
                            <div>
                              <div className="flex items-center justify-between h-5 mb-1">
                                <label className="text-[11px] font-bold text-zinc-400 uppercase">文章分类</label>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setShowInlineCatAdd(!showInlineCatAdd)}
                                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{showInlineCatAdd ? '取消' : '快速加分类'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setArticleSubTab('categories')}
                                    className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-0.5"
                                  >
                                    <FolderPlus className="w-3 h-3" />
                                    <span>管理全部分类</span>
                                  </button>
                                </div>
                              </div>

                              {showInlineCatAdd ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <input
                                    type="text"
                                    value={inlineCatNameInput}
                                    onChange={(e) => setInlineCatNameInput(e.target.value)}
                                    placeholder="输入新分类名称..."
                                    className="flex-1 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-emerald-500 font-bold focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!inlineCatNameInput.trim()) return;
                                      const catName = inlineCatNameInput.trim();
                                      try {
                                        const res = await fetch('/api/categories', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ name: catName })
                                        });
                                        const data = await res.json();
                                        if (data?.categories) {
                                          onCategoriesUpdated(data.categories);
                                          setCategory(catName);
                                          setInlineCatNameInput('');
                                          setShowInlineCatAdd(false);
                                          showToast(`已新增并自动选中分类「${catName}」`);
                                        }
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shrink-0"
                                  >
                                    添加
                                  </button>
                                </div>
                              ) : (
                                <select
                                  value={category}
                                  onChange={(e) => setCategory(e.target.value)}
                                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 h-10"
                                >
                                  {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                  ))}
                                </select>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center justify-between h-5 mb-1">
                                <label className="text-[11px] font-bold text-zinc-400 uppercase">标签（逗号分隔）</label>
                              </div>
                              <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Bento, React 19, UI"
                                className="w-full bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 h-10"
                              />
                            </div>
                          </div>

                          {/* SANFUN Article Cover Customizer & Live Generator */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                                <Palette className="w-4 h-4 text-indigo-500" />
                                <span>🎨 SANFUN 扁平双色封面生成与裁切控制</span>
                              </label>
                              <span className="text-[10px] font-mono text-zinc-400">实时预览与水印算法</span>
                            </div>

                            {/* Live Cover Card Preview */}
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-zinc-500">封面实时效果预览:</span>
                              <div className={`relative h-36 w-full rounded-2xl overflow-hidden bg-gradient-to-tr ${coverBg || 'from-indigo-600 via-slate-700 to-blue-600'} p-4 flex items-center justify-center select-none shadow-md border border-white/20 transition-all duration-300`}>
                                {/* Watermark Background Text */}
                                <span className="absolute text-4xl sm:text-5xl font-black text-white/20 uppercase tracking-wider font-sans truncate max-w-full pointer-events-none transform -rotate-3 scale-110">
                                  {coverText || category || 'SANFUN'}
                                </span>

                                {/* Center Floating Mascot Icon with Flat Stroke & Colored Shadow */}
                                <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/95 dark:bg-zinc-900/95 shadow-lg shadow-indigo-500/25 border-2 border-white/90 dark:border-zinc-700/90 flex items-center justify-center text-2xl sm:text-3xl overflow-hidden p-1">
                                  {mascotIcon.startsWith('http') || mascotIcon.startsWith('data:') || mascotIcon.startsWith('/') ? (
                                    <img src={mascotIcon} alt="Mascot Icon" className="w-full h-full object-cover rounded-xl" />
                                  ) : (
                                    <span>{mascotIcon || '🪵'}</span>
                                  )}
                                </div>

                                {featured && (
                                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-zinc-950 shadow-sm">
                                    ⭐ 精选
                                  </span>
                                )}

                                <span className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-white/90 bg-black/30 backdrop-blur-md border border-white/20">
                                  {readStatus || '最新'}
                                </span>
                              </div>
                            </div>

                            {/* Gradient Preset Swatches */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">选取封面渐变模板Preset:</span>
                                <span className="text-[10px] text-zinc-400">点击即刻套用</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                {[
                                  { name: '珊瑚落日', bg: 'from-rose-500 to-orange-400' },
                                  { name: '琥珀金辉', bg: 'from-amber-500 to-orange-500' },
                                  { name: '薄荷绿洲', bg: 'from-emerald-400 to-teal-500' },
                                  { name: '海棠蔷薇', bg: 'from-pink-400 to-rose-500' },
                                  { name: '紫罗兰梦', bg: 'from-purple-400 to-indigo-500' },
                                  { name: '晴空湛蓝', bg: 'from-sky-400 to-blue-500' },
                                  { name: '青翠翡翠', bg: 'from-green-400 to-emerald-600' },
                                  { name: '洋红霓虹', bg: 'from-rose-500 to-fuchsia-500' },
                                  { name: '深海碧蓝', bg: 'from-cyan-400 to-blue-600' },
                                  { name: '暖阳柠黄', bg: 'from-amber-400 to-yellow-500' },
                                  { name: '冷钛银灰', bg: 'from-slate-400 to-slate-600' },
                                  { name: '暗夜高奢', bg: 'from-zinc-700 to-zinc-900' },
                                ].map((p) => (
                                  <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => setCoverBg(p.bg)}
                                    className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                                      coverBg === p.bg
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-white dark:bg-zinc-800 font-bold'
                                        : 'border-zinc-200/80 dark:border-zinc-700/80 bg-white/60 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-800'
                                    }`}
                                  >
                                    <span className={`w-4 h-4 rounded-full shrink-0 bg-gradient-to-tr ${p.bg}`} />
                                    <span className="text-[11px] truncate text-zinc-700 dark:text-zinc-300">{p.name}</span>
                                  </button>
                                ))}
                              </div>

                              {/* Custom Gradient Input */}
                              <div className="pt-1">
                                <label className="text-[10px] text-zinc-400 block mb-1">自定义 Tailwind 渐变 Class 类名（或颜色值）:</label>
                                <input
                                  type="text"
                                  value={coverBg}
                                  onChange={(e) => setCoverBg(e.target.value)}
                                  placeholder="from-indigo-600 via-slate-700 to-blue-600"
                                  className="w-full bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                                />
                              </div>
                            </div>

                            {/* Cover Watermark Text & Read Status Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                                  封面背景水印字 (Watermark Text):
                                </label>
                                <input
                                  type="text"
                                  value={coverText}
                                  onChange={(e) => setCoverText(e.target.value)}
                                  placeholder="SANFUN / FRONTEND / AI..."
                                  className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                                />
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                                  封面右下标 (Read Status Pill):
                                </label>
                                <input
                                  type="text"
                                  value={readStatus}
                                  onChange={(e) => setReadStatus(e.target.value)}
                                  placeholder="最新 / 热门 / 重磅..."
                                  className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                                />
                              </div>
                            </div>

                            {/* Mascot Center Icon / Sticker Selection */}
                            <div className="space-y-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  <span>中间封面贴纸图标 (Mascot Icon / Image):</span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCropperTarget('mascotIcon');
                                    setIsCropperOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center gap-1 transition-colors"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>自定义上传图标/图片并裁切</span>
                                </button>
                              </div>

                              {/* Emoji Presets Bar */}
                              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                                {['🪵', '🐧', '🔋', '📰', '🐱', '🤖', '💡', '🚀', '🎨', '📱', '🏆', '💻', '⚡', '🔮', '📜', '🧠', '🛠️', '🎯', '💎', '🌸'].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setMascotIcon(emoji)}
                                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                                      mascotIcon === emoji
                                        ? 'bg-indigo-100 dark:bg-indigo-950/80 border-2 border-indigo-500 scale-110 shadow-xs'
                                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    }`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>

                              {/* Manual Input or Image URL display */}
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={mascotIcon}
                                  onChange={(e) => setMascotIcon(e.target.value)}
                                  placeholder="输入单个 Emoji 表情或图片 URL..."
                                  className="flex-1 bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                                />
                                {mascotIcon.startsWith('http') && (
                                  <button
                                    type="button"
                                    onClick={() => setMascotIcon('🪵')}
                                    className="px-2.5 py-1.5 rounded-lg text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800"
                                  >
                                    恢复 Emoji
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Standard High-Res Cover Image Upload */}
                            <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>高分辨率实景封面图 URL (可选，无渐变时备用展示)</span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setCropperTarget('coverImage');
                                    setIsCropperOpen(true);
                                  }}
                                  className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1"
                                >
                                  <Crop className="w-3 h-3" />
                                  <span>裁切实景大图</span>
                                </button>
                              </div>

                              <input
                                type="url"
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                placeholder="https://images.unsplash.com/... (可选)"
                                className="w-full bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                              />
                            </div>
                          </div>

                            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-2">
                              <label className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>首页全站精选推荐后端控制</span>
                              </label>
                              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isHeroFeatured}
                                    onChange={(e) => setIsHeroFeatured(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="font-bold text-blue-600 dark:text-blue-400">设为首页大图 Banner 推荐</span>
                                </label>

                                <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={isBannerRecommend}
                                    onChange={(e) => setIsBannerRecommend(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">设为全站侧边精选推荐</span>
                                </label>

                                <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-amber-600 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={featured}
                                    onChange={(e) => setFeatured(e.target.checked)}
                                    className="rounded text-amber-600 focus:ring-amber-500"
                                  />
                                  <span>通用精选标志</span>
                                </label>
                              </div>
                            </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-zinc-400 uppercase">内容摘要 / 导读</label>
                              <button
                                type="button"
                                onClick={handleGenerateAISummary}
                                disabled={aiGenerating || !content}
                                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline disabled:opacity-50"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>{aiGenerating ? 'AI 生成中...' : 'AI 智能提炼'}</span>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={summary}
                              onChange={(e) => setSummary(e.target.value)}
                              placeholder="用于搜索及文章卡片展示的简短说明..."
                              className="w-full bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                            />
                          </div>

                          <div className="space-y-2">
                            {/* Header label, View modes switcher & Template launcher button */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="text-[11px] font-bold text-zinc-400 uppercase flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-blue-500" />
                                <span>Markdown 正文编辑器</span>
                                <span className="text-[10px] font-normal text-zinc-500 lowercase">
                                  (支持标准 MD & HTML 各种排版与超链接)
                                </span>
                              </label>

                              <div className="flex items-center gap-2">
                                {/* Editor View Mode Switcher: Edit, Split, Preview */}
                                <div className="p-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center text-xs">
                                  <button
                                    type="button"
                                    onClick={() => setEditorViewMode('edit')}
                                    className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                                      editorViewMode === 'edit'
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                    }`}
                                    title="纯 Markdown 代码编辑"
                                  >
                                    <FileCode className="w-3 h-3 text-blue-500" />
                                    <span className="hidden sm:inline">代码源码</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditorViewMode('visual')}
                                    className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                                      editorViewMode === 'visual'
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                    }`}
                                    title="可视化组件交互与编辑"
                                  >
                                    <Wand2 className="w-3 h-3 text-purple-500" />
                                    <span className="hidden sm:inline">可视化编辑</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditorViewMode('split')}
                                    className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                                      editorViewMode === 'split'
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                    }`}
                                    title="左右分屏对比模式"
                                  >
                                    <Columns className="w-3 h-3 text-indigo-500" />
                                    <span className="hidden sm:inline">双栏分屏</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditorViewMode('preview')}
                                    className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                                      editorViewMode === 'preview'
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                                    }`}
                                    title="全屏沉浸渲染预览模式"
                                  >
                                    <Eye className="w-3 h-3 text-emerald-500" />
                                    <span className="hidden sm:inline">实时预览</span>
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setShowTemplateModal(true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xs hover:opacity-90 transition-opacity shrink-0"
                                >
                                  <LayoutTemplate className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">一键载入文章完整模板</span>
                                  <span className="sm:hidden">文章模板</span>
                                </button>
                              </div>
                            </div>

                            {/* COMPREHENSIVE MARKDOWN TOOLBAR */}
                            <div className="p-2.5 rounded-lg bg-zinc-100/90 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 space-y-2">
                              
                              {/* ROW 1: Basic Formatting Actions (Bold, Italic, Underline, Strikethrough, Code, Color, Headings, Lists, Align, Link) */}
                              <div className="flex flex-wrap items-center gap-1 text-xs">
                                
                                {/* Font Styles Group */}
                                <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-700/60">
                                  <button
                                    type="button"
                                    onClick={() => wrapSelection('**', '**', '加粗文本')}
                                    className="p-1.5 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors font-bold"
                                    title="加粗文本 (Bold **text**)"
                                  >
                                    <Bold className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => wrapSelection('*', '*', '斜体文本')}
                                    className="p-1.5 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors italic"
                                    title="斜体文本 (Italic *text*)"
                                  >
                                    <Italic className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => wrapSelection('<u>', '</u>', '下划线文本')}
                                    className="p-1.5 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors underline"
                                    title="下划线文本 (Underline <u>text</u>)"
                                  >
                                    <Underline className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => wrapSelection('~~', '~~', '删除线文本')}
                                    className="p-1.5 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors line-through"
                                    title="删除线文本 (Strikethrough ~~text~~)"
                                  >
                                    <Strikethrough className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => wrapSelection('`', '`', '行内代码')}
                                    className="p-1.5 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors font-mono"
                                    title="行内代码 (`code`)"
                                  >
                                    <Code className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => wrapSelection('<mark>', '</mark>', '高亮文本')}
                                    className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-600 dark:text-amber-400 transition-colors"
                                    title="文本高亮背景 (<mark>text</mark>)"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-0.5 hidden sm:block" />

                                {/* Headings Group */}
                                <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-700/60">
                                  <button
                                    type="button"
                                    onClick={() => prependLinePrefix('# ')}
                                    className="px-2 py-1 rounded-lg font-black text-[11px] hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors"
                                    title="一级标题 H1 (# Title)"
                                  >
                                    H1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => prependLinePrefix('## ')}
                                    className="px-2 py-1 rounded-lg font-bold text-[11px] hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors"
                                    title="二级标题 H2 (## Title)"
                                  >
                                    H2
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => prependLinePrefix('### ')}
                                    className="px-2 py-1 rounded-lg font-semibold text-[11px] hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors"
                                    title="三级标题 H3 (### Title)"
                                  >
                                    H3
                                  </button>
                                </div>

                                <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-0.5 hidden sm:block" />

                                {/* Font Colors Palette */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="p-1.5 rounded-md bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 transition-colors"
                                    title="选择字体颜色与高亮样式"
                                  >
                                    <Palette className="w-3.5 h-3.5 text-purple-500" />
                                    <span className="text-[11px] font-semibold hidden sm:inline">字体颜色</span>
                                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                                  </button>

                                  {showColorPicker && (
                                    <div className="absolute top-full left-0 mt-1 z-30 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl w-64 space-y-2 animate-in fade-in duration-150">
                                      <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                        <span>快捷应用颜色高亮</span>
                                        <button 
                                          type="button" 
                                          onClick={() => setShowColorPicker(false)}
                                          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                      
                                      <div className="grid grid-cols-3 gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            wrapSelection('<span style="color:#ef4444">', '</span>', '红色文本');
                                            setShowColorPicker(false);
                                          }}
                                          className="px-2 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 hover:scale-105 transition-transform text-center"
                                        >
                                          🔴 红色
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            wrapSelection('<span style="color:#10b981">', '</span>', '绿色文本');
                                            setShowColorPicker(false);
                                          }}
                                          className="px-2 py-1.5 rounded-lg text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 hover:scale-105 transition-transform text-center"
                                        >
                                          🟢 绿色
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            wrapSelection('<span style="color:#3b82f6">', '</span>', '蓝色文本');
                                            setShowColorPicker(false);
                                          }}
                                          className="px-2 py-1.5 rounded-lg text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:scale-105 transition-transform text-center"
                                        >
                                          🔵 蓝色
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            wrapSelection('<span style="color:#f59e0b">', '</span>', '琥珀文本');
                                            setShowColorPicker(false);
                                          }}
                                          className="px-2 py-1.5 rounded-lg text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 hover:scale-105 transition-transform text-center"
                                        >
                                          🟡 琥珀黄
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            wrapSelection('<span style="color:#8b5cf6">', '</span>', '紫色文本');
                                            setShowColorPicker(false);
                                          }}
                                          className="px-2 py-1.5 rounded-lg text-xs font-bold text-purple-500 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 hover:scale-105 transition-transform text-center"
                                        >
                                          🟣 紫色
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            wrapSelection('<span style="color:#ec4899">', '</span>', '粉色文本');
                                            setShowColorPicker(false);
                                          }}
                                          className="px-2 py-1.5 rounded-lg text-xs font-bold text-pink-500 bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/60 hover:scale-105 transition-transform text-center"
                                        >
                                          💖 粉红
                                        </button>
                                      </div>

                                      <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            wrapSelection('<span style="background-color:#dbeafe; color:#1e40af; padding:2px 8px; border-radius:6px; font-weight:bold">', '</span>', '蓝色高亮徽章');
                                            setShowColorPicker(false);
                                          }}
                                          className="w-full text-left px-2 py-1 rounded-lg text-[11px] font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center justify-between"
                                        >
                                          <span>🏷️ 蓝色高亮胶囊徽章</span>
                                          <span className="font-mono text-[9px] opacity-75">span badge</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            wrapSelection('<span style="background-color:#d1fae5; color:#065f46; padding:2px 8px; border-radius:6px; font-weight:bold">', '</span>', '绿色成功徽章');
                                            setShowColorPicker(false);
                                          }}
                                          className="w-full text-left px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors flex items-center justify-between"
                                        >
                                          <span>🏷️ 绿色成功胶囊徽章</span>
                                          <span className="font-mono text-[9px] opacity-75">span badge</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-0.5 hidden sm:block" />

                                {/* Alignments Group */}
                                <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-700/60">
                                  <button
                                    type="button"
                                    onClick={() => wrapSelection('<div align="center">\n\n', '\n\n</div>', '居中对齐段落')}
                                    className="p-1.5 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                                    title="居中对齐 (<div align='center'>)"
                                  >
                                    <AlignCenter className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => wrapSelection('<div align="right">\n\n', '\n\n</div>', '居右对齐段落')}
                                    className="p-1.5 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                                    title="居右对齐 (<div align='right'>)"
                                  >
                                    <AlignRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-0.5 hidden sm:block" />

                                {/* Lists & Link */}
                                <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-white/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-700/60">
                                  <button
                                    type="button"
                                    onClick={() => prependLinePrefix('- ')}
                                    className="p-1.5 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                                    title="无序列表 (- item)"
                                  >
                                    <ListIcon className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => prependLinePrefix('1. ')}
                                    className="p-1.5 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                                    title="有序列表 (1. item)"
                                  >
                                    <ListOrdered className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => prependLinePrefix('- [ ] ')}
                                    className="p-1.5 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                                    title="任务清单 (- [ ] todo)"
                                  >
                                    <CheckSquare className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const url = prompt('请输入跳转超链接 URL:', 'https://');
                                      if (url) {
                                        wrapSelection('[', `](${url})`, '链接标题文本');
                                      }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                                    title="插入超链接 ([title](url))"
                                  >
                                    <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                                  </button>
                                </div>

                              </div>

                              {/* ROW 2: Special Tool Modals (Image Upload, Code Templates, Emoji Selector) */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                                
                                {/* Image Upload & Insertion */}
                                <button
                                  type="button"
                                  onClick={() => setShowImageModal(true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors shadow-2xs"
                                >
                                  <ImagePlus className="w-3.5 h-3.5" />
                                  <span>图片插入 / 本地上传</span>
                                </button>

                                {/* Code Templates */}
                                <button
                                  type="button"
                                  onClick={() => setShowCodeModal(true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60 hover:bg-purple-100 dark:hover:bg-purple-900/80 transition-colors shadow-2xs"
                                >
                                  <Terminal className="w-3.5 h-3.5" />
                                  <span>代码模版库</span>
                                </button>

                                {/* Emoji & Icon Picker */}
                                <button
                                  type="button"
                                  onClick={() => setShowEmojiModal(true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-colors shadow-2xs"
                                >
                                  <Smile className="w-3.5 h-3.5" />
                                  <span>表情与图标库</span>
                                </button>

                                {/* 360° Panorama Viewer */}
                                <button
                                  type="button"
                                  onClick={() => setShowPanoramaModal(true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-colors shadow-2xs"
                                >
                                  <Compass className="w-3.5 h-3.5" />
                                  <span>360° 全景环视</span>
                                </button>

                                {/* 3D Model & 3D PDF */}
                                <button
                                  type="button"
                                  onClick={() => setShow3DModal(true)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors shadow-2xs"
                                >
                                  <Box className="w-3.5 h-3.5" />
                                  <span>3D 模型 & 3D PDF</span>
                                </button>

                              </div>

                              {/* ROW 3: Horizontal Scrollable Quick Typography Snippets */}
                              <div className="pt-1 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400 px-1">
                                  <span className="flex items-center gap-1">
                                    <Wand2 className="w-3 h-3 text-purple-500" />
                                    <span>常用一键排版块 (点击光标处插入富文本卡片)</span>
                                  </span>
                                  <span className="font-mono text-zinc-400 hidden sm:inline">共 {TYPOGRAPHY_SNIPPETS.length} 种预置结构</span>
                                </div>

                                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar">
                                  {TYPOGRAPHY_SNIPPETS.map((snip) => {
                                    const IconComponent = snip.icon;
                                    return (
                                      <button
                                        key={snip.id}
                                        type="button"
                                        onClick={() => handleInsertSnippet(snip.snippet, snip.name)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border shrink-0 transition-transform active:scale-95 hover:scale-105 shadow-2xs ${snip.color}`}
                                        title={`插入 ${snip.name}`}
                                      >
                                        <IconComponent className="w-3 h-3 shrink-0" />
                                        <span>{snip.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>

                            {/* EDITOR / VISUAL / SPLIT PREVIEW / FULL PREVIEW CONTENT AREA */}
                            {editorViewMode === 'edit' && (
                              <textarea
                                ref={contentRef}
                                rows={13}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="在此输入 Markdown 文章正文，支持常规 Markdown 及上方的各种增强排版工具、图片上传、多语言代码等..."
                                className="w-full bg-zinc-50 dark:bg-zinc-800/80 p-4 rounded-lg text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 resize-y leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                              />
                            )}

                            {editorViewMode === 'visual' && (
                              <div className="space-y-3 mt-1">
                                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5 border border-purple-200/60 dark:border-purple-900/40 space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 dark:border-purple-900/30 pb-2">
                                    <div className="flex items-center gap-2">
                                      <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                        可视化交互渲染与排版 (WYSIWYG Interactive Mode)
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-mono">
                                        支持 3D 模型 / 360° 全景图实时轮转
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <button
                                        type="button"
                                        onClick={() => setShowPanoramaModal(true)}
                                        className="px-2.5 py-1 rounded-md font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-1"
                                      >
                                        <Compass className="w-3 h-3" />
                                        <span>+ 360° 全景</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setShow3DModal(true)}
                                        className="px-2.5 py-1 rounded-md font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-colors flex items-center gap-1"
                                      >
                                        <Box className="w-3 h-3" />
                                        <span>+ 3D 模型</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditorViewMode('edit')}
                                        className="px-2.5 py-1 rounded-md font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 transition-colors flex items-center gap-1"
                                      >
                                        <FileCode className="w-3 h-3" />
                                        <span>切回代码源码</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Rendered Live Preview Content */}
                                  <div className="p-5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-y-auto max-h-[360px] prose dark:prose-invert text-xs sm:text-sm leading-relaxed">
                                    <Markdown
                                      remarkPlugins={[remarkGfm]}
                                      rehypePlugins={[rehypeRaw]}
                                      components={markdownComponents}
                                    >
                                      {content || '*（暂无内容，请在此下方输入或载入文章模板）*'}
                                    </Markdown>
                                  </div>

                                  {/* Visual Quick Editor Input */}
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                                      <span>下方同步代码编辑器（修改实时反馈上方渲染效果）：</span>
                                      <span className="font-mono text-[10px] text-purple-600">已启用双向即时同步</span>
                                    </label>
                                    <textarea
                                      ref={contentRef}
                                      rows={6}
                                      value={content}
                                      onChange={(e) => setContent(e.target.value)}
                                      placeholder="直接在此修改 Markdown 源码，上方可视化画布将即时响应..."
                                      className="w-full bg-white dark:bg-zinc-900 p-3 rounded-md text-xs font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 leading-relaxed focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {editorViewMode === 'split' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                                <textarea
                                  ref={contentRef}
                                  rows={14}
                                  value={content}
                                  onChange={(e) => setContent(e.target.value)}
                                  placeholder="Markdown 源码编辑区..."
                                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 p-3.5 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 resize-y leading-relaxed"
                                />
                                <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 overflow-y-auto max-h-[380px] prose dark:prose-invert text-xs sm:text-sm">
                                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 border-b pb-1 flex items-center justify-between">
                                    <span>实时分屏渲染效果 Preview</span>
                                    <span className="font-mono text-[9px] text-blue-500">HTML + MD Active</span>
                                  </div>
                                  <Markdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={markdownComponents}
                                  >
                                    {content || '*（暂无内容，请在左侧编辑器中输入）*'}
                                  </Markdown>
                                </div>
                              </div>
                            )}

                            {editorViewMode === 'preview' && (
                              <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 overflow-y-auto max-h-[420px] prose dark:prose-invert text-sm sm:text-base leading-relaxed space-y-3">
                                <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between">
                                  <span>全屏渲染效果图 Preview</span>
                                  <span className="text-zinc-400 font-normal">正文字数：{content.length} 字</span>
                                </div>
                                <Markdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeRaw]}
                                  components={markdownComponents}
                                >
                                  {content || '*（暂无内容，请切回编辑模式进行撰写）*'}
                                </Markdown>
                              </div>
                            )}

                          </div>

                          {/* ======================================================== */}
                          {/* 1. ARTICLE PAID & VIP MEMBERSHIP LOCK SETTINGS SECTION   */}
                          {/* ======================================================== */}
                          <div className="p-4 sm:p-5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-amber-200/60 dark:border-amber-900/30">
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                  文章付费阅读 & 会员独享专区设置
                                </h4>
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isPaid}
                                  onChange={(e) => setIsPaid(e.target.checked)}
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                  开启付费/会员限制
                                </span>
                              </label>
                            </div>

                            {isPaid && (
                              <div className="space-y-4 pt-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                      解锁所需积分 (0 表示仅等级要求，非 0 扣积分):
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={price}
                                      onChange={(e) => setPrice(Number(e.target.value))}
                                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                      最低会员等级门槛:
                                    </label>
                                    <select
                                      value={requiredLevel}
                                      onChange={(e) => setRequiredLevel(Number(e.target.value))}
                                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700"
                                    >
                                      <option value={1}>Lv.1 普通会员 (全员)</option>
                                      <option value={2}>Lv.2 白银会员</option>
                                      <option value={3}>Lv.3 黄金会员</option>
                                      <option value={4}>Lv.4 钻石会员</option>
                                      <option value={5}>Lv.5 星耀 VIP</option>
                                      <option value={6}>Lv.6 荣耀 SVIP</option>
                                      <option value={7}>Lv.7 冠世至尊 SVIP (创世神级)</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="pt-1">
                                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                    <input
                                      type="checkbox"
                                      checked={requireCommentToView}
                                      onChange={(e) => setRequireCommentToView(e.target.checked)}
                                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>💬 开启【评论回复后即可查看】权限限制 (评论后自动解锁特权)</span>
                                  </label>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                    隐藏的核心干货 / 独家解锁内容 (Markdown 格式，解锁后可见):
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={paidContent}
                                    onChange={(e) => setPaidContent(e.target.value)}
                                    placeholder="填写入群密钥、专属视频链接、提取密码、付费 Markdown 代码片段等..."
                                    className="w-full p-3 bg-white dark:bg-zinc-900 rounded-lg text-xs font-mono border border-zinc-200 dark:border-zinc-700"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ======================================================== */}
                          {/* 2. ATTACHMENT RESOURCE MANAGEMENT SECTION                */}
                          {/* ======================================================== */}
                          <div className="p-4 sm:p-5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-purple-200/60 dark:border-purple-900/30">
                              <div className="flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                  文章附件与源码资源管理 ({attachments.length})
                                </h4>
                              </div>

                              <div className="flex items-center gap-2">
                                <label className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1 shadow-2xs transition-all">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>{uploadingAttachment ? '上传中...' : '上传本地附件'}</span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploadingAttachment(true);
                                      try {
                                        const reader = new FileReader();
                                        reader.onload = async (evt) => {
                                          const fileData = evt.target?.result as string;
                                          const res = await fetch('/api/upload', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              fileName: file.name,
                                              fileType: file.type || '附件',
                                              fileData
                                            })
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            const newAtt: ArticleAttachment = {
                                              id: `att-${Date.now()}`,
                                              name: data.name,
                                              fileUrl: data.fileUrl,
                                              size: data.size,
                                              fileType: file.name.split('.').pop()?.toUpperCase() || 'ZIP',
                                              isPaid: false,
                                              price: 0,
                                              requiredLevel: 1
                                            };
                                            setAttachments(prev => [...prev, newAtt]);
                                          }
                                          setUploadingAttachment(false);
                                        };
                                        reader.readAsDataURL(file);
                                      } catch (err) {
                                        setUploadingAttachment(false);
                                        alert('附件上传失败');
                                      }
                                    }}
                                  />
                                </label>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const newAtt: ArticleAttachment = {
                                      id: `att-${Date.now()}`,
                                      name: '新增源码附件包.zip',
                                      fileUrl: 'https://example.com/download.zip',
                                      size: '15.8 MB',
                                      fileType: 'ZIP',
                                      isPaid: false,
                                      price: 0,
                                      requiredLevel: 1
                                    };
                                    setAttachments(prev => [...prev, newAtt]);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center gap-1 hover:border-purple-400"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>手动添加网络附件</span>
                                </button>
                              </div>
                            </div>

                            {attachments.length === 0 ? (
                              <p className="text-xs text-zinc-400 text-center py-2">
                                暂无关联的附件资源，可点击右上角上传或新增附件项。
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {attachments.map((att, idx) => (
                                  <div key={att.id} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <input
                                        type="text"
                                        value={att.name}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setAttachments(prev => prev.map((a, i) => i === idx ? { ...a, name: val } : a));
                                        }}
                                        className="font-bold text-xs bg-transparent border-b border-zinc-200 dark:border-zinc-700 px-1 py-0.5 flex-1"
                                        placeholder="附件名称"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                                      <input
                                        type="text"
                                        value={att.fileUrl}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setAttachments(prev => prev.map((a, i) => i === idx ? { ...a, fileUrl: val } : a));
                                        }}
                                        placeholder="下载 URL"
                                        className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]"
                                      />
                                      <input
                                        type="text"
                                        value={att.size}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setAttachments(prev => prev.map((a, i) => i === idx ? { ...a, size: val } : a));
                                        }}
                                        placeholder="大小 (如 2.5 MB)"
                                        className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-[11px]"
                                      />
                                      <label className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                                        <input
                                          type="checkbox"
                                          checked={att.isPaid}
                                          onChange={(e) => {
                                            const val = e.target.checked;
                                            setAttachments(prev => prev.map((a, i) => i === idx ? { ...a, isPaid: val } : a));
                                          }}
                                        />
                                        <span className="text-[11px] font-bold">需要积分扣减</span>
                                      </label>
                                      {att.isPaid && (
                                        <>
                                          <input
                                            type="number"
                                            min="1"
                                            value={att.price || 5}
                                            onChange={(e) => {
                                              const val = Number(e.target.value);
                                              setAttachments(prev => prev.map((a, i) => i === idx ? { ...a, price: val } : a));
                                            }}
                                            placeholder="所需积分"
                                            className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-[11px]"
                                          />
                                          <select
                                            value={att.requiredLevel || 1}
                                            onChange={(e) => {
                                              const val = Number(e.target.value);
                                              setAttachments(prev => prev.map((a, i) => i === idx ? { ...a, requiredLevel: val } : a));
                                            }}
                                            className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-[11px]"
                                          >
                                            <option value={1}>Lv.1+ 全员</option>
                                            <option value={2}>Lv.2+ 白银</option>
                                            <option value={3}>Lv.3+ 黄金</option>
                                            <option value={4}>Lv.4+ 钻石</option>
                                            <option value={5}>Lv.5+ 星耀</option>
                                            <option value={6}>Lv.6+ 荣耀</option>
                                            <option value={7}>Lv.7 冠世</option>
                                          </select>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* ======================================================== */}
                          {/* 3. NETDISK LINK SHARING SECTION                           */}
                          {/* ======================================================== */}
                          <div className="p-4 sm:p-5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-blue-200/60 dark:border-blue-900/30">
                              <div className="flex items-center gap-2">
                                <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                  网盘资源分享与链接管理 ({netdiskLinks.length})
                                </h4>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const newNd: NetdiskLink = {
                                    id: `nd-${Date.now()}`,
                                    platform: 'baidu',
                                    title: '文章配套全套网盘资源汇总',
                                    url: 'https://pan.baidu.com/s/sample',
                                    code: '8888',
                                    unzipCode: 'sanfun',
                                    note: '百度网盘提取，包含提取码与解压密码',
                                    isPaid: false,
                                    price: 0,
                                    requiredLevel: 1
                                  };
                                  setNetdiskLinks(prev => [...prev, newNd]);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>添加网盘链接</span>
                              </button>
                            </div>

                            {netdiskLinks.length === 0 ? (
                              <p className="text-xs text-zinc-400 text-center py-2">
                                暂无共享网盘链接，可点击右上角添加百度/夸克/阿里/Google Drive 等链接。
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {netdiskLinks.map((nd, idx) => (
                                  <div key={nd.id} className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <select
                                        value={nd.platform}
                                        onChange={(e) => {
                                          const val = e.target.value as any;
                                          setNetdiskLinks(prev => prev.map((item, i) => i === idx ? { ...item, platform: val } : item));
                                        }}
                                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-bold shrink-0 border border-zinc-200 dark:border-zinc-700"
                                      >
                                        <option value="baidu">百度网盘</option>
                                        <option value="quark">夸克网盘</option>
                                        <option value="aliyun">阿里云盘</option>
                                        <option value="lanzou">蓝奏云盘</option>
                                        <option value="google">Google Drive</option>
                                        <option value="xunlei">迅雷云盘</option>
                                        <option value="115">115 网盘</option>
                                        <option value="other">其他网盘</option>
                                      </select>

                                      <input
                                        type="text"
                                        value={nd.title}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setNetdiskLinks(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                                        }}
                                        placeholder="资源标题描述"
                                        className="font-bold text-xs bg-transparent border-b border-zinc-200 dark:border-zinc-700 px-1 py-0.5 flex-1"
                                      />

                                      <button
                                        type="button"
                                        onClick={() => setNetdiskLinks(prev => prev.filter((_, i) => i !== idx))}
                                        className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                      <input
                                        type="text"
                                        value={nd.url}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setNetdiskLinks(prev => prev.map((item, i) => i === idx ? { ...item, url: val } : item));
                                        }}
                                        placeholder="网盘链接 URL"
                                        className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]"
                                      />
                                      <input
                                        type="text"
                                        value={nd.code || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setNetdiskLinks(prev => prev.map((item, i) => i === idx ? { ...item, code: val } : item));
                                        }}
                                        placeholder="提取码 (如 ab12)"
                                        className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]"
                                      />
                                      <input
                                        type="text"
                                        value={nd.unzipCode || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setNetdiskLinks(prev => prev.map((item, i) => i === idx ? { ...item, unzipCode: val } : item));
                                        }}
                                        placeholder="解压密码 (若有)"
                                        className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                      <input
                                        type="text"
                                        value={nd.note || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setNetdiskLinks(prev => prev.map((item, i) => i === idx ? { ...item, note: val } : item));
                                        }}
                                        placeholder="备注说明 (如：解压密码包含字母大小写)"
                                        className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-[11px]"
                                      />
                                      <label className="flex items-center gap-1.5 px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                                        <input
                                          type="checkbox"
                                          checked={nd.isPaid}
                                          onChange={(e) => {
                                            const val = e.target.checked;
                                            setNetdiskLinks(prev => prev.map((item, i) => i === idx ? { ...item, isPaid: val } : item));
                                          }}
                                        />
                                        <span className="text-[11px] font-bold">需付费/积分解锁</span>
                                      </label>
                                      {nd.isPaid && (
                                        <>
                                          <input
                                            type="number"
                                            min="1"
                                            value={nd.price || 5}
                                            onChange={(e) => {
                                              const val = Number(e.target.value);
                                              setNetdiskLinks(prev => prev.map((item, i) => i === idx ? { ...item, price: val } : item));
                                            }}
                                            placeholder="解锁积分"
                                            className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-[11px]"
                                          />
                                          <select
                                            value={nd.requiredLevel || 1}
                                            onChange={(e) => {
                                              const val = Number(e.target.value);
                                              setNetdiskLinks(prev => prev.map((item, i) => i === idx ? { ...item, requiredLevel: val } : item));
                                            }}
                                            className="px-2 py-1 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-[11px]"
                                          >
                                            <option value={1}>Lv.1+ 全员</option>
                                            <option value={2}>Lv.2+ 白银</option>
                                            <option value={3}>Lv.3+ 黄金</option>
                                            <option value={4}>Lv.4+ 钻石</option>
                                            <option value={5}>Lv.5+ 星耀</option>
                                            <option value={6}>Lv.6+ 荣耀</option>
                                            <option value={7}>Lv.7 冠世</option>
                                          </select>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      )}
                    </form>
                  </div>

                </div>
              )}

              {/* Integrated Category Management Center */}
              {articleSubTab === 'categories' && (
                <div className="space-y-6">
                      {/* Create New Category Header Box */}
                      <div className="p-4 sm:p-5 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <FolderPlus className="w-4 h-4 text-blue-500" />
                            <span>文章分类管理中心</span>
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            自定义全站博客文章的分类体系。重命名分类将自动联动更新该分类下的全部文章。
                          </p>
                        </div>

                        <form onSubmit={handleCreateCategory} className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                          <input
                            type="text"
                            required
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="输入新分类名称..."
                            className="px-3 py-2 bg-white dark:bg-zinc-900 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 w-full sm:w-48"
                          />
                          <button
                            type="submit"
                            className={`px-4 py-2 rounded-md text-xs font-bold text-white shadow-sm shrink-0 whitespace-nowrap ${accentClasses.bg}`}
                          >
                            新增分类
                          </button>
                        </form>
                      </div>

                      {/* Categories Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((catName) => {
                          const articleCount = articles.filter(a => a.category === catName).length;
                          const isEditing = editingCatOldName === catName;

                          return (
                            <div
                              key={catName}
                              className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 flex flex-col justify-between space-y-3 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                            >
                              {isEditing ? (
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-zinc-400 uppercase">重命名分类</label>
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editingCatNewName}
                                    onChange={(e) => setEditingCatNewName(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white dark:bg-zinc-900 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-blue-500 font-bold"
                                  />
                                  <div className="flex items-center justify-end gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingCatOldName(null)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                    >
                                      取消
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCategory(catName)}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${accentClasses.bg}`}
                                    >
                                      保存修改
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                        <FolderPlus className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                          {catName}
                                        </h4>
                                        <span className="text-[10px] font-mono text-zinc-400">
                                          共 {articleCount} 篇文章
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingCatOldName(catName);
                                          setEditingCatNewName(catName);
                                        }}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                        title="修改名称"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCategory(catName)}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                        title="删除分类"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAdminCategoryFilter(catName);
                                        setArticleSubTab('editor');
                                        setMobileSubView('list');
                                      }}
                                      className="text-blue-500 hover:underline font-bold text-[11px] flex items-center gap-1"
                                    >
                                      <span>查看此分类下文章 ({articleCount})</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                                      Active
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {articleSubTab === 'navMenu' && (
                    <div className="space-y-6 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" />
                            <span>菜单栏 & 子菜单可视化编辑</span>
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            自定义顶部导航菜单项、关联页面标签、修改图标、添加下拉子相关联动操作或绑定外部独立链接。
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/nav-menu', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(localNavMenu),
                              });
                              if (res.ok) {
                                if (onNavMenuUpdated) onNavMenuUpdated(localNavMenu);
                                showToast('已成功保存并实时更新菜单栏！');
                              } else {
                                showToast('保存菜单失败');
                              }
                            } catch {
                              showToast('保存菜单出错');
                            }
                          }}
                          className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1.5 shrink-0 ${accentClasses.bg}`}
                        >
                          <Save className="w-4 h-4" />
                          <span>保存菜单设置</span>
                        </button>
                      </div>

                      {/* Nav Items List */}
                      <div className="space-y-4">
                        {localNavMenu.map((item, idx) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-4 shadow-2xs"
                          >
                            {/* Parent Item Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200/60 dark:border-zinc-700/60">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center font-mono">
                                  #{idx + 1}
                                </span>
                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                  主菜单: {item.label}
                                </span>
                                {item.isExternal && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                    🔗 外部链接
                                  </span>
                                )}
                                {item.subItems && item.subItems.length > 0 && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                    📂 包含 {item.subItems.length} 个子相关菜单
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => {
                                    const copy = [...localNavMenu];
                                    const temp = copy[idx];
                                    copy[idx] = copy[idx - 1];
                                    copy[idx - 1] = temp;
                                    setLocalNavMenu(copy);
                                  }}
                                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30"
                                  title="上移位置"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === localNavMenu.length - 1}
                                  onClick={() => {
                                    const copy = [...localNavMenu];
                                    const temp = copy[idx];
                                    copy[idx] = copy[idx + 1];
                                    copy[idx + 1] = temp;
                                    setLocalNavMenu(copy);
                                  }}
                                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30"
                                  title="下移位置"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = localNavMenu.filter((_, i) => i !== idx);
                                    setLocalNavMenu(copy);
                                  }}
                                  className="p-1.5 rounded-md text-zinc-400 hover:text-rose-500"
                                  title="删除菜单项"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Parent Controls Form */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                              <div className="sm:col-span-3">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase">菜单显示文本 (Label)</label>
                                <input
                                  type="text"
                                  value={item.label}
                                  onChange={(e) => {
                                    const copy = [...localNavMenu];
                                    copy[idx].label = e.target.value;
                                    setLocalNavMenu(copy);
                                  }}
                                  className="w-full bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase">图标名称 (Icon Name)</label>
                                <input
                                  type="text"
                                  value={item.icon || 'BookOpen'}
                                  onChange={(e) => {
                                    const copy = [...localNavMenu];
                                    copy[idx].icon = e.target.value;
                                    setLocalNavMenu(copy);
                                  }}
                                  placeholder="Home, BookOpen, Users..."
                                  className="w-full bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                                />
                              </div>

                              <div className="sm:col-span-4">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase">跳转 URL 或 View ID</label>
                                <input
                                  type="text"
                                  value={item.url || ''}
                                  onChange={(e) => {
                                    const copy = [...localNavMenu];
                                    copy[idx].url = e.target.value;
                                    setLocalNavMenu(copy);
                                  }}
                                  placeholder="home, articles, columns 或 https://..."
                                  className="w-full bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-mono"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase">打开目标 (Target)</label>
                                <select
                                  value={item.target || '_self'}
                                  onChange={(e) => {
                                    const copy = [...localNavMenu];
                                    copy[idx].target = e.target.value as '_self' | '_blank';
                                    copy[idx].isExternal = e.target.value === '_blank';
                                    setLocalNavMenu(copy);
                                  }}
                                  className="w-full bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                                >
                                  <option value="_self">本页打开 (_self)</option>
                                  <option value="_blank">新标签页 (_blank)</option>
                                </select>
                              </div>
                            </div>

                            {/* Sub-Items Editor Section */}
                            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                  <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>子相关下拉菜单项配置 (Sub Items)</span>
                                </span>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = [...localNavMenu];
                                    if (!copy[idx].subItems) copy[idx].subItems = [];
                                    copy[idx].subItems!.push({
                                      id: 'sub_' + Date.now(),
                                      label: '新子菜单项',
                                      url: 'articles',
                                      target: '_self'
                                    });
                                    setLocalNavMenu(copy);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>增加子相关菜单</span>
                                </button>
                              </div>

                              {(!item.subItems || item.subItems.length === 0) ? (
                                <p className="text-[11px] text-zinc-400 italic py-1">暂无子相关菜单项，鼠标悬停时直接触发主菜单跳转。</p>
                              ) : (
                                <div className="space-y-2">
                                  {item.subItems.map((sub, sIdx) => (
                                    <div key={sub.id || sIdx} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
                                      <span className="text-[10px] font-mono font-bold text-zinc-400">└</span>
                                      <input
                                        type="text"
                                        value={sub.label}
                                        onChange={(e) => {
                                          const copy = [...localNavMenu];
                                          copy[idx].subItems![sIdx].label = e.target.value;
                                          setLocalNavMenu(copy);
                                        }}
                                        placeholder="子菜单名称"
                                        className="flex-1 min-w-[120px] bg-white dark:bg-zinc-900 px-2 py-1 rounded-md text-xs font-medium border border-zinc-200 dark:border-zinc-700"
                                      />

                                      <input
                                        type="text"
                                        value={sub.url}
                                        onChange={(e) => {
                                          const copy = [...localNavMenu];
                                          copy[idx].subItems![sIdx].url = e.target.value;
                                          setLocalNavMenu(copy);
                                        }}
                                        placeholder="跳转 URL 或 标签名"
                                        className="flex-1 min-w-[160px] bg-white dark:bg-zinc-900 px-2 py-1 rounded-md text-xs font-mono border border-zinc-200 dark:border-zinc-700"
                                      />

                                      <select
                                        value={sub.target || '_self'}
                                        onChange={(e) => {
                                          const copy = [...localNavMenu];
                                          copy[idx].subItems![sIdx].target = e.target.value;
                                          setLocalNavMenu(copy);
                                        }}
                                        className="bg-white dark:bg-zinc-900 px-2 py-1 rounded-md text-xs border border-zinc-200 dark:border-zinc-700"
                                      >
                                        <option value="_self">本页打开</option>
                                        <option value="_blank">新窗口外链</option>
                                      </select>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const copy = [...localNavMenu];
                                          copy[idx].subItems = copy[idx].subItems!.filter((_, i) => i !== sIdx);
                                          setLocalNavMenu(copy);
                                        }}
                                        className="p-1 text-zinc-400 hover:text-rose-500"
                                        title="删除子菜单"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add New Parent Menu Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const newId = 'nav_' + Date.now();
                          setLocalNavMenu([
                            ...localNavMenu,
                            {
                              id: newId,
                              label: '新菜单项',
                              icon: 'BookOpen',
                              url: '#' + newId,
                              target: '_self',
                              isExternal: false,
                              subItems: []
                            }
                          ]);
                        }}
                        className="w-full py-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-blue-500 flex items-center justify-center gap-2 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>新增主菜单项</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. EQUIPMENT MANAGER TAB */}
              {activeTab === 'equipment' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                  {/* Left List Column */}
                  <div className="lg:col-span-5 space-y-3 lg:border-r lg:border-zinc-200/80 lg:dark:border-zinc-800/80 lg:pr-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        硬件装备列表 ({equipment.length})
                      </h3>
                      <button
                        onClick={handleStartNewEquipment}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-white ${accentClasses.bg}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>新增装备</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                      {equipment.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border transition-all flex items-start justify-between group ${
                            editingEqId === item.id
                              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30'
                              : 'border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/40 hover:border-zinc-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2 cursor-pointer flex-1" onClick={() => handleEditEquipmentClick(item)}>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {item.name}
                              </h4>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                                {item.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleEditEquipmentClick(item)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-purple-500"
                              title="编辑"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEquipment(item.id)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-rose-500"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Form Editor Column */}
                  <div className="lg:col-span-7">
                    <form onSubmit={handleSaveEquipment} className="space-y-4 bg-zinc-50 dark:bg-zinc-800/40 p-4 sm:p-5 rounded-md border border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-purple-500" />
                          <span>{editingEqId ? '编辑硬件装备信息' : '添加全新硬件装备'}</span>
                        </h3>

                        <button
                          type="submit"
                          className={`px-4 py-1.5 rounded-md text-xs font-bold text-white shadow-sm ${accentClasses.bg}`}
                        >
                          {editingEqId ? '保存装备更新' : '添加装备到列表'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 uppercase">装备名称</label>
                          <input
                            type="text"
                            required
                            value={eqName}
                            onChange={(e) => setEqName(e.target.value)}
                            placeholder="如：MacBook Pro 16 M3 Max"
                            className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 uppercase">装备分类</label>
                          <input
                            type="text"
                            value={eqCategory}
                            onChange={(e) => setEqCategory(e.target.value)}
                            placeholder="核心硬件, 桌面搭建, 效率软件"
                            className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 uppercase">使用状态</label>
                          <select
                            value={eqStatus}
                            onChange={(e) => setEqStatus(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                          >
                            <option value="主力使用">主力使用</option>
                            <option value="备用硬件">备用硬件</option>
                            <option value="推荐评测">推荐评测</option>
                            <option value="渴望购买">渴望购买</option>
                            <option value="已退役">已退役</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 uppercase">推荐星级 (1-5)</label>
                          <select
                            value={eqRating}
                            onChange={(e) => setEqRating(Number(e.target.value))}
                            className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                          >
                            <option value={5}>★★★★★ (5星 - 极力推荐)</option>
                            <option value={4}>★★★★☆ (4星 - 非常优秀)</option>
                            <option value={3}>★★★☆☆ (3星 - 中规中矩)</option>
                            <option value={2}>★★☆☆☆ (2星 - 一般)</option>
                            <option value={1}>★☆☆☆☆ (1星 - 不推荐)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 uppercase">图标类型</label>
                          <select
                            value={eqIconName}
                            onChange={(e) => setEqIconName(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                          >
                            <option value="Laptop">笔记本 (Laptop)</option>
                            <option value="Monitor">显示器/台式机 (Monitor)</option>
                            <option value="Keyboard">键盘/外设 (Keyboard)</option>
                            <option value="Smartphone">手机/移动端 (Smartphone)</option>
                            <option value="Headphones">耳机/音频 (Headphones)</option>
                            <option value="Camera">相机/摄影 (Camera)</option>
                            <option value="Layout">软件应用 (Layout)</option>
                            <option value="Code">开发工具 (Code)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 uppercase">装备图片 URL (可选)</label>
                        <input
                          type="url"
                          value={eqImageUrl}
                          onChange={(e) => setEqImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 uppercase">一句话评价 / 参数使用体验</label>
                        <textarea
                          rows={3}
                          value={eqDescription}
                          onChange={(e) => setEqDescription(e.target.value)}
                          placeholder="如：64GB 统一内存，极致剪辑与全栈编译体验..."
                          className="w-full bg-white dark:bg-zinc-900 p-3 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 resize-none"
                        />
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 4. MOMENTS & MUSIC PLAYLIST CONSOLIDATED TAB */}
              {(activeTab === 'moments' || activeTab === 'music') && (
                <div className="space-y-4">
                  {/* Subtab Navigation Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 w-fit">
                    <button
                      type="button"
                      onClick={() => setMomentSubTab('moments')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        momentSubTab === 'moments'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>微动态即刻 ({moments.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMomentSubTab('music');
                        fetchAdminPlaylist();
                      }}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        momentSubTab === 'music'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5 text-rose-500" />
                      <span>全站歌单管理 ({adminPlaylist.length})</span>
                    </button>
                  </div>

                  {/* Subtab 1: Moments */}
                  {momentSubTab === 'moments' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-5">
                        <form onSubmit={handleSaveMoment} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 sm:p-5 rounded-md border border-zinc-200 dark:border-zinc-700 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-emerald-500" />
                              <span>{editingMomentId ? '编辑微动态（即刻/说说）' : '发布微动态（即刻/说说）'}</span>
                            </h3>
                            {editingMomentId && (
                              <button
                                type="button"
                                onClick={handleCancelMomentEdit}
                                className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline"
                              >
                                取消编辑
                              </button>
                            )}
                          </div>

                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 uppercase">动态内容 / 短随想</label>
                        <textarea
                          rows={4}
                          required
                          value={momentContent}
                          onChange={(e) => setMomentContent(e.target.value)}
                          placeholder="你现在正在开发什么或思考什么？..."
                          className="w-full bg-white dark:bg-zinc-900 p-3 rounded-lg text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 uppercase">标签 (逗号分隔)</label>
                          <input
                            type="text"
                            value={momentTags}
                            onChange={(e) => setMomentTags(e.target.value)}
                            placeholder="开发日志, BentoUI"
                            className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 uppercase">发布地点</label>
                          <input
                            type="text"
                            value={momentLocation}
                            onChange={(e) => setMomentLocation(e.target.value)}
                            placeholder="常州 · 钟楼"
                            className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 uppercase">附图链接（可选）</label>
                        <input
                          type="url"
                          value={momentImage}
                          onChange={(e) => setMomentImage(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 focus:outline-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className={`flex-1 py-2.5 rounded-md text-xs font-bold text-white shadow-sm transition-all ${accentClasses.bg}`}
                        >
                          {editingMomentId ? '保存动态修改' : '发布新动态'}
                        </button>
                        {editingMomentId && (
                          <button
                            type="button"
                            onClick={handleCancelMomentEdit}
                            className="px-4 py-2.5 rounded-md text-xs font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                          >
                            取消
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="lg:col-span-7 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      历史动态/说说列表 ({moments.length})
                    </h3>

                    <div className="space-y-3 max-h-[480px] overflow-y-auto">
                      {moments.map((m) => (
                        <div
                          key={m.id}
                          className={`p-4 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                            editingMomentId === m.id
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                              : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800/80'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed mb-2 font-medium">
                              "{m.content}"
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-400 font-mono">
                              <span>{m.date}</span>
                              {m.location && <span>• {m.location}</span>}
                              <span>• {m.likes} 点赞</span>
                              {m.tags && m.tags.map(t => (
                                <span key={t} className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleStartEditMoment(m)}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                              title="编辑此动态"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMoment(m.id)}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="删除动态"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Music Playlist Management */}
              {momentSubTab === 'music' && (
                <div className="space-y-6">
                  {/* Top Intro Header */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-indigo-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-md shrink-0">
                        <Music className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <span>全站悬浮音乐播放器与歌单管理</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                            支持各大音乐平台解析
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          解析网易云音乐、QQ音乐、酷狗音乐或直接链接 MP3，编辑并更新全站播放器歌单。
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={fetchAdminPlaylist}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-rose-500 flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>刷新当前歌单</span>
                    </button>
                  </div>

                  {/* Music URL Parser Section */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-rose-500" />
                      <span>智能音乐解析器 (一键提取音乐信息)</span>
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      支持格式：网易云单曲链接 (如 <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">https://music.163.com/#/song?id=186016</code>)、QQ 音乐链接、酷狗链接或标准音轨 MP3 直链。
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="url"
                        value={musicParseUrl}
                        onChange={(e) => setMusicParseUrl(e.target.value)}
                        placeholder="粘贴网易云音乐/QQ音乐/酷狗或音频 MP3 直链..."
                        className="flex-1 w-full bg-white dark:bg-zinc-900 px-3.5 py-2 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                      />
                      <button
                        type="button"
                        disabled={musicParsing || !musicParseUrl.trim()}
                        onClick={handleParseMusicUrl}
                        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
                      >
                        {musicParsing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>云端解析中...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>一键解析填入</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Music Track Form (Add or Edit) */}
                  <form onSubmit={handleSaveMusicTrack} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-700/60">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-rose-500" />
                        <span>{musicEditingTrackId ? '编辑单曲信息' : '手动新增单曲'}</span>
                      </h4>
                      {musicEditingTrackId && (
                        <button
                          type="button"
                          onClick={() => {
                            setMusicEditingTrackId(null);
                            setMusicTitle('');
                            setMusicArtist('');
                            setMusicCover('');
                            setMusicAudioUrl('');
                            setMusicPlatform('custom');
                          }}
                          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline"
                        >
                          取消编辑，改为新增
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">歌曲名称 *</label>
                        <input
                          type="text"
                          required
                          value={musicTitle}
                          onChange={(e) => setMusicTitle(e.target.value)}
                          placeholder="例如: 晴空 Melody"
                          className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">演唱者 / 歌手</label>
                        <input
                          type="text"
                          value={musicArtist}
                          onChange={(e) => setMusicArtist(e.target.value)}
                          placeholder="例如: 独立音乐人"
                          className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">圆形封面图 URL</label>
                        <input
                          type="url"
                          value={musicCover}
                          onChange={(e) => setMusicCover(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">来源平台标识</label>
                        <select
                          value={musicPlatform}
                          onChange={(e) => setMusicPlatform(e.target.value as any)}
                          className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                        >
                          <option value="custom">通用网络 MP3 直联</option>
                          <option value="163">网易云音乐 (NetEase 163)</option>
                          <option value="qq">QQ 音乐 (Tencent QQ)</option>
                          <option value="kugou">酷狗音乐 (KuGou)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">音频播放 URL (MP3 / Audio Stream) *</label>
                      <input
                        type="url"
                        required
                        value={musicAudioUrl}
                        onChange={(e) => setMusicAudioUrl(e.target.value)}
                        placeholder="https://music.163.com/song/media/outer/url?id=xxxx.mp3"
                        className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl text-xs font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity shadow-xs flex items-center gap-2"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{musicEditingTrackId ? '保存更改' : '加入歌单列表中'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Playlist Table / Cards */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <ListIcon className="w-4 h-4 text-indigo-500" />
                        <span>后台播放歌单清单 ({adminPlaylist.length} 首)</span>
                      </h4>
                    </div>

                    {adminPlaylist.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-zinc-400 text-xs space-y-1">
                        <Music className="w-8 h-8 mx-auto opacity-40 text-rose-500" />
                        <p>暂无音轨，请在上方尝试链接解析或手动添加！</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {adminPlaylist.map((track, idx) => (
                          <div
                            key={track.id || idx}
                            className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={track.cover || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200"}
                                alt={track.title}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                    {track.title}
                                  </h5>
                                  {track.platform === '163' && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-mono font-bold border border-rose-200 dark:border-rose-800">
                                      网易云
                                    </span>
                                  )}
                                  {track.platform === 'qq' && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono font-bold border border-emerald-200 dark:border-emerald-800">
                                      QQ音乐
                                    </span>
                                  )}
                                  {track.platform === 'kugou' && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono font-bold border border-blue-200 dark:border-blue-800">
                                      酷狗
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                  {track.artist}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setMusicEditingTrackId(track.id || `track-${idx}`);
                                  setMusicTitle(track.title);
                                  setMusicArtist(track.artist);
                                  setMusicCover(track.cover);
                                  setMusicAudioUrl(track.audioUrl || '');
                                  setMusicPlatform(track.platform || 'custom');
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-indigo-500 hover:text-white transition-colors flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                <span>编辑</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => track.id && handleDeleteMusicTrack(track.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>删除</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

              {/* 5. AUTHOR PROFILE TAB */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="w-full space-y-4 py-2 sm:py-4">
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-500" />
                    <span>作者个人资料与 Bento 头部配置</span>
                  </h3>

                  {/* 1. AUTHOR AVATAR UPLOAD & CROP */}
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
                    <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span>作者形象照 / 头像 (支持本地上传与自由裁切)</span>
                      </span>
                    </label>
                    <div className="flex items-center gap-4">
                      <img
                        src={profileAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"}
                        alt="Profile Avatar"
                        className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md shrink-0"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCropperTarget('avatar');
                              setIsCropperOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>裁切 / 缩放形象照</span>
                          </button>
                          <label className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>上传形象照</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          value={profileAvatar}
                          onChange={(e) => setProfileAvatar(e.target.value)}
                          placeholder="或直接粘贴形象照网络图片 URL"
                          className="w-full bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 uppercase">站长昵称</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 uppercase">一句话介绍 (Tagline)</label>
                      <input
                        type="text"
                        value={profileTagline}
                        onChange={(e) => setProfileTagline(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                      />
                    </div>
                  </div>

                  {/* STATUS TEXT & MOOD EMOJI SELECTOR */}
                  <div className="space-y-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 uppercase">当前实时状态文本</label>
                        <input
                          type="text"
                          value={profileStatus}
                          onChange={(e) => setProfileStatus(e.target.value)}
                          placeholder="如: 坚持是最好的老师"
                          className="w-full bg-white dark:bg-zinc-900 p-2 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-zinc-400 uppercase">所在地 (Location)</label>
                        <input
                          type="text"
                          value={profileLocation}
                          onChange={(e) => setProfileLocation(e.target.value)}
                          placeholder="如: 中国 · 常州"
                          className="w-full bg-white dark:bg-zinc-900 p-2 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                        />
                      </div>
                    </div>

                    {/* MOOD EMOJI SELECTION */}
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 uppercase flex items-center gap-1.5 mb-1.5">
                        <Smile className="w-3.5 h-3.5 text-amber-500" />
                        <span>多种心情 / 状态图标选择 (Mood Emoji)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={profileStatusEmoji}
                          onChange={(e) => setProfileStatusEmoji(e.target.value)}
                          className="w-14 text-center text-xl bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0 font-bold"
                          title="输入自定义表情"
                        />
                        <div className="flex flex-wrap gap-1.5 items-center p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex-1 max-h-28 overflow-y-auto">
                          {['🤩', '⚡', '🚀', '🎨', '☕', '💻', '💡', '🌟', '🌲', '🍀', '🎯', '🔥', '🍋', '🍉', '🌈', '🎸', '🎧', '📚', '🛠️', '🎮', '🧠', '✨', '🍵', '🏖️', '👾'].map(emoji => (
                            <button
                              type="button"
                              key={emoji}
                              onClick={() => setProfileStatusEmoji(emoji)}
                              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                                profileStatusEmoji === emoji ? 'bg-amber-100 dark:bg-amber-950/80 ring-2 ring-amber-400 scale-110' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase">个人简介 (Bio)</label>
                    <textarea
                      rows={3}
                      value={profileBio}
                      onChange={(e) => setProfileBio(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 resize-none"
                    />
                  </div>

                  {/* CONTACT LINKS CUSTOMIZATION SECTION */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-emerald-500" />
                          <span>侧边栏联系方式与社交外链自定义</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          自定义侧边栏作者卡片底部的联系图标列表，支持增加、删除、上移下移排序、常用图标选择及外链接编辑
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomLink}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>添加外链</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {profileCustomLinks.map((link, idx) => (
                        <div
                          key={link.id || idx}
                          className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                        >
                          {/* Reorder & Index */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-mono text-zinc-400 w-4 text-center">{idx + 1}</span>
                            <div className="flex flex-col">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveCustomLink(idx, 'up')}
                                className="p-0.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-20"
                                title="上移"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === profileCustomLinks.length - 1}
                                onClick={() => handleMoveCustomLink(idx, 'down')}
                                className="p-0.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-20"
                                title="下移"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Common Icon Selector */}
                          <div className="shrink-0">
                            <select
                              value={link.icon}
                              onChange={(e) => handleCustomLinkChange(idx, 'icon', e.target.value)}
                              className="bg-white dark:bg-zinc-900 px-2 py-1.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold cursor-pointer"
                            >
                              <option value="Github">GitHub</option>
                              <option value="MessageCircle">微信 (WeChat)</option>
                              <option value="MessageSquare">QQ</option>
                              <option value="Mail">邮箱 (Email)</option>
                              <option value="Twitter">X / Twitter</option>
                              <option value="Bilibili">Bilibili</option>
                              <option value="Heart">小红书</option>
                              <option value="Send">Telegram</option>
                              <option value="Bookmark">知乎 / 掘金</option>
                              <option value="Globe">个人网站</option>
                              <option value="Calendar">归档动态 (Moments)</option>
                              <option value="Video">抖音 / 视频</option>
                              <option value="Flame">RSS 订阅</option>
                              <option value="Link">通用外链</option>
                            </select>
                          </div>

                          {/* Link Name Input */}
                          <input
                            type="text"
                            value={link.name}
                            onChange={(e) => handleCustomLinkChange(idx, 'name', e.target.value)}
                            placeholder="名称 (如: GitHub)"
                            className="w-28 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shrink-0"
                          />

                          {/* Link URL / Action Input */}
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) => handleCustomLinkChange(idx, 'url', e.target.value)}
                            placeholder="外链 URL (https://... 或 action:moments)"
                            className="flex-1 min-w-[140px] bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono"
                          />

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomLink(idx)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shrink-0"
                            title="删除此项"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SIDEBAR PROMO MODULES MANAGER */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Rocket className="w-4 h-4 text-orange-500" />
                          <span>侧边栏推荐/宣传卡片模块管理</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          自定义侧边栏个人名片下方的宣传与推荐模块，支持增加/删除/排序模块、自定义背景渐变与图标预设
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddPromoBlock}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-xs shrink-0 ${accentClasses.bg}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>新增宣传模块</span>
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                      {profileSidebarPromos.map((promo, idx) => (
                        <div
                          key={promo.id || idx}
                          className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-3"
                        >
                          {/* Card Header & Controls */}
                          <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-700/60">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-[11px] font-bold flex items-center justify-center">
                                #{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]">
                                {promo.title || '宣传模块'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMovePromoBlock(idx, 'up')}
                                className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-20"
                                title="上移"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === profileSidebarPromos.length - 1}
                                onClick={() => handleMovePromoBlock(idx, 'down')}
                                className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-20"
                                title="下移"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePromoBlock(idx)}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                                title="删除模块"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inputs: Title, Subtitle, Badge, Link */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">模块主标题 *</label>
                              <input
                                type="text"
                                value={promo.title}
                                onChange={(e) => handleUpdatePromoBlock(idx, 'title', e.target.value)}
                                placeholder="如: 公众号 或 开放 AI 智能体"
                                className="w-full bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">微型角标 (Badge Text)</label>
                              <input
                                type="text"
                                value={promo.badgeText || ''}
                                onChange={(e) => handleUpdatePromoBlock(idx, 'badgeText', e.target.value)}
                                placeholder="如: 微信 / HOT / AI"
                                className="w-full bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">副标题 / 描述说明</label>
                              <input
                                type="text"
                                value={promo.subtitle || ''}
                                onChange={(e) => handleUpdatePromoBlock(idx, 'subtitle', e.target.value)}
                                placeholder="如: 快人一步获取最新文章 ▶"
                                className="w-full bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">点击跳转链接 / 动作</label>
                              <input
                                type="text"
                                value={promo.linkUrl}
                                onChange={(e) => handleUpdatePromoBlock(idx, 'linkUrl', e.target.value)}
                                placeholder="如: https://... 或 action:projects 或 alert:提示"
                                className="w-full bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-mono"
                              />
                            </div>
                          </div>

                          {/* Gradient Presets & Custom Input */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">背景渐变 (Preset Gradients)</span>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                              {[
                                { name: '翡翠绿洲', bg: 'from-emerald-500 via-teal-500 to-green-600' },
                                { name: '烈焰活力', bg: 'from-orange-500 via-rose-500 to-red-500' },
                                { name: '珊瑚落日', bg: 'from-rose-500 to-orange-400' },
                                { name: '琥珀金辉', bg: 'from-amber-500 to-orange-500' },
                                { name: '薄荷绿洲', bg: 'from-emerald-400 to-teal-500' },
                                { name: '海棠蔷薇', bg: 'from-pink-400 to-rose-500' },
                                { name: '紫罗兰梦', bg: 'from-purple-500 via-indigo-500 to-purple-600' },
                                { name: '晴空湛蓝', bg: 'from-sky-400 via-blue-500 to-indigo-600' },
                                { name: '青翠翡翠', bg: 'from-green-400 to-emerald-600' },
                                { name: '洋红霓虹', bg: 'from-rose-500 to-fuchsia-500' },
                                { name: '深海碧蓝', bg: 'from-cyan-500 to-blue-600' },
                                { name: '暗夜高奢', bg: 'from-zinc-700 via-zinc-800 to-zinc-900' },
                              ].map((p) => (
                                <button
                                  key={p.name}
                                  type="button"
                                  onClick={() => handleUpdatePromoBlock(idx, 'bgGradient', p.bg)}
                                  className={`p-1 rounded-lg text-left border flex items-center gap-1.5 transition-all ${
                                    promo.bgGradient === p.bg
                                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-white dark:bg-zinc-900'
                                      : 'border-zinc-200 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60'
                                  }`}
                                >
                                  <span className={`w-3 h-3 rounded-full shrink-0 bg-gradient-to-tr ${p.bg}`} />
                                  <span className="text-[9px] truncate text-zinc-700 dark:text-zinc-300">{p.name}</span>
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={promo.bgGradient}
                              onChange={(e) => handleUpdatePromoBlock(idx, 'bgGradient', e.target.value)}
                              placeholder="自定义 Tailwind 渐变, 如: from-indigo-500 via-purple-500 to-pink-500"
                              className="w-full bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                            />
                          </div>

                          {/* Icon Selection & Upload */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase">图标 / 表情贴纸</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPromoIndexForCrop(idx);
                                  setCropperTarget('promoIcon');
                                  setIsCropperOpen(true);
                                }}
                                className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <Upload className="w-3 h-3" />
                                <span>上传/裁切图片图标</span>
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-1">
                              {['💬', '🐱', '🚀', '⚡', '🤖', '💡', '🎉', '📱', '🌐', '📦', '🎨', '🔥', '💫', '💎', '🌟', '📌', '✉️', '📢'].map((e) => (
                                <button
                                  key={e}
                                  type="button"
                                  onClick={() => handleUpdatePromoBlock(idx, 'icon', e)}
                                  className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center border transition-transform hover:scale-110 ${
                                    promo.icon === e
                                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50'
                                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                                  }`}
                                >
                                  {e}
                                </button>
                              ))}
                            </div>

                            <input
                              type="text"
                              value={promo.icon}
                              onChange={(e) => handleUpdatePromoBlock(idx, 'icon', e.target.value)}
                              placeholder="自定义 Emoji 或图片 URL"
                              className="w-full bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                            />
                          </div>

                          {/* Live Card Preview */}
                          <div className="pt-2">
                            <span className="text-[10px] text-zinc-400 block mb-1">实时卡片效果预览:</span>
                            <div
                              className={`bg-gradient-to-r ${promo.bgGradient || 'from-emerald-500 via-teal-500 to-green-600'} text-white rounded-lg p-3.5 shadow-sm flex items-center justify-between`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-md bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0 overflow-hidden">
                                  {promo.icon && (promo.icon.startsWith('http') || promo.icon.startsWith('data:') || promo.icon.startsWith('/')) ? (
                                    <img src={promo.icon} alt={promo.title} className="w-full h-full object-cover rounded-md" />
                                  ) : (
                                    <span>{promo.icon || '📌'}</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold flex items-center gap-1">
                                    <span className="truncate">{promo.title || '标题'}</span>
                                    {promo.badgeText && (
                                      <span className="px-1.5 py-0.2 text-[9px] bg-white/20 rounded-xs font-mono shrink-0">
                                        {promo.badgeText}
                                      </span>
                                    )}
                                  </h4>
                                  {promo.subtitle && (
                                    <p className="text-[11px] text-white/90 font-medium mt-0.5 truncate">
                                      {promo.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/70 shrink-0 ml-2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FRONT-END LOGO CUSTOMIZATION SECTION */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-blue-500" />
                          <span>前端 Logo 自定义控制与外链</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          自定义顶部 Navigation 栏中的品牌 Logo 样式、图片源、文字名称及点击跳转外链地址
                        </p>
                      </div>
                    </div>

                    {/* Logo Type Selector */}
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1.5">Logo 显示模式</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { type: 'image', label: '图片 Logo', desc: '自定义上传/网络图片' },
                          { type: 'text', label: '纯文本 Logo', desc: '仅显示品牌名称' },
                          { type: 'icon', label: '经典 Icon 布局', desc: '九宫格像素点卡片' },
                        ].map(item => (
                          <button
                            type="button"
                            key={item.type}
                            onClick={() => setProfileCustomLogoType(item.type as any)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              profileCustomLogoType === item.type
                                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/30 font-bold text-blue-600 dark:text-blue-400'
                                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span className="text-xs block font-bold">{item.label}</span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">{item.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo Text */}
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 uppercase">Logo 品牌文本 / 标题</label>
                      <input
                        type="text"
                        value={profileCustomLogoText}
                        onChange={(e) => setProfileCustomLogoText(e.target.value)}
                        placeholder="如: Sanfun, 我的个人数字花园"
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-semibold"
                      />
                    </div>

                    {/* Logo Image URL & Upload */}
                    {profileCustomLogoType === 'image' && (
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
                        <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                          <span>自定义 Logo 图片 (支持网络外链 URL 或 本地文件上传)</span>
                        </label>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={profileCustomLogoUrl}
                            onChange={(e) => setProfileCustomLogoUrl(e.target.value)}
                            placeholder="输入 Logo 图片外链 URL (https://... 或 data:image/...)"
                            className="flex-1 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 font-mono"
                          />

                          <label className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>本地上传 Logo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Image Preview */}
                        {profileCustomLogoUrl ? (
                          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700">
                            <img
                              src={profileCustomLogoUrl}
                              alt="Logo Preview"
                              className="w-10 h-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs shrink-0"
                            />
                            <div className="flex-1 min-w-0 text-[11px]">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate">Logo 实时渲染预览</span>
                              <span className="text-zinc-400 block truncate font-mono text-[10px]">{profileCustomLogoUrl.slice(0, 45)}...</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProfileCustomLogoUrl('')}
                              className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-500 text-[10px] font-bold hover:bg-rose-100 transition-colors"
                            >
                              清除图片
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-zinc-400 italic">
                            💡 提示：您尚未配置 Logo 图片，请填入图片外链或点击右侧按钮上传本地 Logo 图片。
                          </div>
                        )}
                      </div>
                    )}

                    {/* Logo External Link */}
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Logo 点击跳转外链 / 页面链接</span>
                      </label>
                      <input
                        type="text"
                        value={profileCustomLogoLink}
                        onChange={(e) => setProfileCustomLogoLink(e.target.value)}
                        placeholder="留空默认回到博客首页 (例如: https://sanfun.cn 或 #home)"
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-mono"
                      />
                      <span className="text-[10px] text-zinc-400 mt-1 block">
                        设置后，访问者在前端 Header 顶部点击 Logo 时将自动跳转至您指定的外链或内部页面。
                      </span>
                    </div>
                  </div>

                  {/* TECH STACK SECTION */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Code className="w-4 h-4 text-purple-500" />
                          <span>核心技术栈与工具管理</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          管理首页 Bento 头部“核心技术栈与工具”卡片中展示的技术项目
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        共 {profileTechStack.length} 项
                      </span>
                    </div>

                    {/* Tech Stack List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {profileTechStack.map((tech, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2.5 rounded-md border transition-all ${
                            editingTechIndex === idx
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                              : 'border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: tech.color || '#3B82F6' }}
                            />
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                              {tech.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditTechStackClick(idx)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60"
                              title="编辑"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTechStack(idx)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tech Stack Add / Edit Form Box */}
                    <div className="p-3.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                          {editingTechIndex !== null ? `编辑技术栈项目 #${editingTechIndex + 1}` : '新增核心技术栈项目'}
                        </span>
                        {editingTechIndex !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTechIndex(null);
                              setTechNameInput('');
                            }}
                            className="text-[10px] text-blue-500 hover:underline font-semibold"
                          >
                            取消编辑
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">技术/工具名称</label>
                          <input
                            type="text"
                            value={techNameInput}
                            onChange={(e) => setTechNameInput(e.target.value)}
                            placeholder="如: React 19, Vue 3, Docker"
                            className="w-full bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">标识颜色 (HEX)</label>
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="color"
                              value={techColorInput}
                              onChange={(e) => setTechColorInput(e.target.value)}
                              className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0 bg-transparent shrink-0"
                            />
                            <input
                              type="text"
                              value={techColorInput}
                              onChange={(e) => setTechColorInput(e.target.value)}
                              placeholder="#3B82F6"
                              className="w-full bg-white dark:bg-zinc-900 px-2 py-1.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">图标名称</label>
                          <input
                            type="text"
                            value={techIconInput}
                            onChange={(e) => setTechIconInput(e.target.value)}
                            placeholder="Code2, Zap, Palette"
                            className="w-full bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-mono"
                          />
                        </div>
                      </div>

                      {/* Quick Color Presets */}
                      <div>
                        <span className="text-[10px] text-zinc-400 block mb-1">推荐颜色预设：</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { name: 'React 蓝', color: '#61DAFB' },
                            { name: 'TS 蓝', color: '#3178C6' },
                            { name: 'Tailwind 青', color: '#06B6D4' },
                            { name: 'Vite 紫', color: '#646CFF' },
                            { name: 'Gemini 紫', color: '#8E54E9' },
                            { name: 'Vue 绿', color: '#10B981' },
                            { name: 'Node 绿', color: '#68A063' },
                            { name: 'Figma 红', color: '#F24E1E' },
                            { name: '琥珀黄', color: '#F59E0B' },
                            { name: '玫瑰粉', color: '#EC4899' },
                          ].map(preset => (
                            <button
                              type="button"
                              key={preset.name}
                              onClick={() => setTechColorInput(preset.color)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:scale-105 transition-transform"
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.color }} />
                              <span className="text-zinc-600 dark:text-zinc-400">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddOrUpdateTechStack}
                        disabled={!techNameInput.trim()}
                        className={`w-full py-2 rounded-md text-xs font-bold text-white transition-all shadow-xs ${accentClasses.bg} disabled:opacity-50`}
                      >
                        {editingTechIndex !== null ? '更新此项技术栈' : '新增此项技术栈'}
                      </button>
                    </div>
                  </div>

                  {/* PAGE ADAPTIVE & LAYOUT RESPONSIVENESS CONFIGURATION */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-purple-500" />
                        <span>全站页面自适应与多端响应式布局配置</span>
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        控制全站视口自适应流布局、最大宽度限制、移动端侧栏自动折叠与多端卡片列数自适应规则
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-4">
                      {/* 1. Viewport & Width Adaptation */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                              <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                              <span>开启全屏/宽屏流式页面自适应 (Fluid Viewport Adaptation)</span>
                            </label>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              开启后页面在 2K/4K 屏幕上自动扩展居中，适配各种大屏与移动端屏宽
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={localLayoutConfig.enableAdaptiveWidth !== false}
                            onChange={(e) => setLocalLayoutConfig(prev => ({ ...prev, enableAdaptiveWidth: e.target.checked }))}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 cursor-pointer"
                          />
                        </div>

                        {localLayoutConfig.enableAdaptiveWidth !== false && (
                          <div className="pt-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">全站自适应容器最大宽度限制</label>
                            <select
                              value={localLayoutConfig.adaptiveMaxWidth || 'max-w-[1440px]'}
                              onChange={(e) => setLocalLayoutConfig(prev => ({ ...prev, adaptiveMaxWidth: e.target.value as any }))}
                              className="w-full bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 mt-1 cursor-pointer font-mono"
                            >
                              <option value="max-w-5xl">max-w-5xl (1024px 紧凑阅读流自适应)</option>
                              <option value="max-w-6xl">max-w-6xl (1152px 标准沉浸自适应)</option>
                              <option value="max-w-7xl">max-w-7xl (1280px 经典宽屏自适应)</option>
                              <option value="max-w-[1440px]">max-w-[1440px] (1440px 极致高清自适应 - 推荐)</option>
                              <option value="max-w-[1600px]">max-w-[1600px] (1600px 巨幕超宽自适应)</option>
                              <option value="max-w-full">max-w-full (100% 页面边缘无缝铺满自适应)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-zinc-200/60 dark:bg-zinc-700/60" />

                      {/* 2. Responsive Multi-device Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">移动端侧栏自动收起折叠</span>
                            <input
                              type="checkbox"
                              checked={localLayoutConfig.adaptiveSidebarMobile !== false}
                              onChange={(e) => setLocalLayoutConfig(prev => ({ ...prev, adaptiveSidebarMobile: e.target.checked }))}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 cursor-pointer"
                            />
                          </div>
                          <p className="text-[10px] text-zinc-400">
                            在手机/窄屏下自动智能隐藏右侧名片栏，保障阅读主体视口宽度
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">全站右侧边栏全局显示</span>
                            <input
                              type="checkbox"
                              checked={localLayoutConfig.showSidebar !== false}
                              onChange={(e) => setLocalLayoutConfig(prev => ({ ...prev, showSidebar: e.target.checked }))}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 cursor-pointer"
                            />
                          </div>
                          <p className="text-[10px] text-zinc-400">
                            控制全站文章列表页是否分栏展示个人名片与宣传卡片
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">智能多端卡片列数自适应</span>
                            <input
                              type="checkbox"
                              checked={localLayoutConfig.adaptiveGridAutoColumns !== false}
                              onChange={(e) => setLocalLayoutConfig(prev => ({ ...prev, adaptiveGridAutoColumns: e.target.checked }))}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 cursor-pointer"
                            />
                          </div>
                          <p className="text-[10px] text-zinc-400">
                            根据客户端屏宽自动响应单列/双列/三列卡片展示
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Bento 头部视口自适应</span>
                            <input
                              type="checkbox"
                              checked={localLayoutConfig.showBentoHeader !== false}
                              onChange={(e) => setLocalLayoutConfig(prev => ({ ...prev, showBentoHeader: e.target.checked }))}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 cursor-pointer"
                            />
                          </div>
                          <p className="text-[10px] text-zinc-400">
                            在首页展示自适应名片、极简动效与常用统计网格
                          </p>
                        </div>
                      </div>

                      <div className="h-px bg-zinc-200/60 dark:bg-zinc-700/60" />

                      {/* 3. Grid Columns & Density Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">文章网格默认列数 (Grid Columns)</label>
                          <select
                            value={localLayoutConfig.gridColumns || 3}
                            onChange={(e) => setLocalLayoutConfig(prev => ({ ...prev, gridColumns: Number(e.target.value) as any }))}
                            className="w-full bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 mt-1 cursor-pointer"
                          >
                            <option value={2}>双列网格自适应 (2 Columns)</option>
                            <option value={3}>三列网格自适应 (3 Columns - 推荐)</option>
                            <option value={4}>四列网格自适应 (4 Columns)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase">卡片圆角自适应风格 (Card Shape)</label>
                          <select
                            value={localLayoutConfig.cardShape || 'rounded-2xl'}
                            onChange={(e) => setLocalLayoutConfig(prev => ({ ...prev, cardShape: e.target.value as any }))}
                            className="w-full bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 mt-1 cursor-pointer font-mono"
                          >
                            <option value="rounded-2xl">rounded-2xl (16px 大圆角自适应)</option>
                            <option value="rounded-xl">rounded-xl (12px 标准圆角自适应)</option>
                            <option value="rounded-lg">rounded-lg (8px 紧凑圆角自适应)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FOOTER ICP FILING NUMBER EDITOR */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>页脚 ICP 备案号修改 (Footer ICP Filing)</span>
                    </label>
                    <input
                      type="text"
                      value={profileIcpNumber}
                      onChange={(e) => setProfileIcpNumber(e.target.value)}
                      placeholder="例如: 粤ICP备2021000000号-1"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 font-mono font-semibold"
                    />
                    <p className="text-[10px] text-zinc-400">
                      保存后，博客全站底部 Footer 区域将实时同步展示您修改后的 ICP 备案号。
                    </p>
                  </div>

                  {/* ADMIN USERNAME & PASSWORD MANAGER */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-indigo-500" />
                          <span>后台管理员账号及密码修改</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          修改控制台登录账号与密码。出于安全防护，修改时需校验当前原密码。
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                        <div>
                          <label className="h-5 text-[11px] font-bold text-zinc-400 uppercase flex items-center">
                            <span>后台管理员用户名 (Username)</span>
                          </label>
                          <input
                            type="text"
                            value={adminUsername}
                            onChange={(e) => setAdminUsername(e.target.value)}
                            placeholder="如: admin"
                            className="w-full bg-white dark:bg-zinc-900 p-2 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-mono font-semibold"
                          />
                        </div>

                        <div>
                          <label className="h-5 text-[11px] font-bold text-rose-500 uppercase flex items-center gap-1">
                            <span>当前原密码 (验证身份) *</span>
                          </label>
                          <input
                            type="password"
                            value={currentAdminPassword}
                            onChange={(e) => setCurrentAdminPassword(e.target.value)}
                            placeholder="输入当前原密码"
                            className="w-full bg-white dark:bg-zinc-900 p-2 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-rose-300 dark:border-rose-800 mt-1 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                        <div>
                          <label className="h-5 text-[11px] font-bold text-zinc-400 uppercase flex items-center">
                            <span>新登录密码 (New Password)</span>
                          </label>
                          <input
                            type="password"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder="如需重置密码请填写新密码"
                            className="w-full bg-white dark:bg-zinc-900 p-2 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-mono"
                          />
                        </div>

                        <div>
                          <label className="h-5 text-[11px] font-bold text-zinc-400 uppercase flex items-center">
                            <span>确认新密码 (Confirm New Password)</span>
                          </label>
                          <input
                            type="password"
                            value={confirmAdminPassword}
                            onChange={(e) => setConfirmAdminPassword(e.target.value)}
                            placeholder="再次输入新密码"
                            className="w-full bg-white dark:bg-zinc-900 p-2 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={handleUpdateAdminCredentials}
                          disabled={isUpdatingCredentials || !currentAdminPassword}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isUpdatingCredentials ? '提交凭据更新中...' : '更新管理员凭据'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className={`w-full sm:w-auto px-6 py-2.5 rounded-md text-xs font-bold text-white shadow-sm ${accentClasses.bg}`}
                    >
                      保存个人资料与全站配置修改
                    </button>
                  </div>
                </form>
              )}


              {/* MEMBERS, TIERS, MESSAGES & FRIEND AUDIT CONSOLIDATED TAB */}
              {(activeTab === 'members' || activeTab === 'tiers' || activeTab === 'messages' || activeTab === 'friendAudit') && (
                <div className="space-y-4">
                  {/* Subtab Navigation Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 w-fit">
                    <button
                      type="button"
                      onClick={() => setMemberSubTab('members')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        memberSubTab === 'members'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>会员与黑名单</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMemberSubTab('tiers')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        memberSubTab === 'tiers'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>等级与特权</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMemberSubTab('messages')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        memberSubTab === 'messages'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                      <span>私信答复中心</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMemberSubTab('friendAudit')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        memberSubTab === 'friendAudit'
                          ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>友链审核</span>
                    </button>
                  </div>

                  {/* Subtab Contents */}
                  {memberSubTab === 'members' && (
                    <AdminMembersManager onShowToast={showToast} />
                  )}

                  {memberSubTab === 'tiers' && (
                    <AdminTiersManager onShowToast={showToast} />
                  )}

                  {memberSubTab === 'messages' && (
                    <AdminMessagesManager onShowToast={showToast} />
                  )}

                  {memberSubTab === 'friendAudit' && (
                    <AdminFriendAuditManager onShowToast={showToast} />
                  )}
                </div>
              )}

            </div>
          </>
        )}

        {/* FULL ARTICLE TEMPLATES SELECTION MODAL */}
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-md max-w-3xl w-full max-h-[85vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xs">
                    <LayoutTemplate className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      一键载入常用文章排版模版库
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      选择预置的最佳排版组合，一键生成结构清晰、带有 Bento 视效的高质量文章
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Template Cards Grid */}
              <div className="p-5 overflow-y-auto space-y-4 max-h-[calc(85vh-130px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FULL_TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className="p-4 rounded-lg bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                            {tmpl.category}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {tmpl.tags}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {tmpl.title}
                        </h4>

                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {tmpl.desc}
                        </p>
                      </div>

                      {/* Mini Render Preview Box */}
                      <div className="p-3 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 max-h-28 overflow-y-auto font-sans leading-relaxed">
                        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
                          {tmpl.content.substring(0, 180) + '...'}
                        </Markdown>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLoadFullTemplate(tmpl.content, tmpl.title, tmpl.category, tmpl.tags, tmpl.summary)}
                        className="w-full py-2.5 rounded-md text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>载入此排版模版</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200/80 dark:border-zinc-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 rounded-md text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  关闭
                </button>
              </div>

            </div>
          </div>
        )}

        {/* --- IMAGE INSERTION & LOCAL UPLOAD MODAL --- */}
        {showImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md max-w-lg w-full overflow-hidden shadow-2xl space-y-4">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      插入文章图片与图注
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      支持网络图片外链、本地文件拖拽上传及极客预置精选图
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-5 flex items-center gap-2 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <button
                  type="button"
                  onClick={() => setImageModalTab('url')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                    imageModalTab === 'url'
                      ? 'bg-blue-500 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  网络外链 URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageModalTab('upload')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                    imageModalTab === 'upload'
                      ? 'bg-blue-500 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  本地图片上传
                </button>
                <button
                  type="button"
                  onClick={() => setImageModalTab('presets')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                    imageModalTab === 'presets'
                      ? 'bg-blue-500 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  精选配图
                </button>
              </div>

              {/* Tab Content */}
              <div className="px-5 space-y-3">
                {imageModalTab === 'url' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-400 uppercase">图片网络地址 (URL)</label>
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-zinc-50 dark:bg-zinc-800/80 p-2.5 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                      />
                    </div>
                  </div>
                )}

                {imageModalTab === 'upload' && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase">选择本地图片上传 (自动转为 Base64 或可挂载链接)</label>
                    <div className="p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-center bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLocalImageUpload}
                        className="hidden"
                        id="modal-image-upload-input"
                      />
                      <label htmlFor="modal-image-upload-input" className="cursor-pointer space-y-2 block">
                        <Upload className="w-8 h-8 text-blue-500 mx-auto" />
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          点击或拖拽本地图片文件至此处
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          支持 PNG, JPG, WEBP, GIF (单个文件 &lt; 8MB)
                        </p>
                      </label>
                    </div>

                    {imageUploadPreview && (
                      <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
                        <img src={imageUploadPreview} alt="Upload preview" className="w-14 h-14 object-cover rounded-lg" />
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">✓ 图片读取解析成功</p>
                          <p className="text-[10px] text-zinc-400">准备插入至 Markdown 正文</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {imageModalTab === 'presets' && (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    <p className="text-xs text-zinc-500">点击以下预置高质量全景图片直接填充：</p>
                    <div className="grid grid-cols-2 gap-2">
                      {UNSPLASH_PRESETS.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setImageUrlInput(preset.url);
                            setImageAltInput(preset.name);
                            setImageModalTab('url');
                          }}
                          className="p-2 rounded-md border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 cursor-pointer flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 transition-colors"
                        >
                          <img src={preset.url} alt={preset.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{preset.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Inputs: Alt text & Caption */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">图片替代文本 (Alt)</label>
                    <input
                      type="text"
                      value={imageAltInput}
                      onChange={(e) => setImageAltInput(e.target.value)}
                      placeholder="例: Bento 网格布局架构图"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 p-2 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase">底部说明图注 (Caption，可选)</label>
                    <input
                      type="text"
                      value={imageCaptionInput}
                      onChange={(e) => setImageCaptionInput(e.target.value)}
                      placeholder="例: 图 1-1 全栈模块解耦结构"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 p-2 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 rounded-md text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInsertImage}
                  className="px-5 py-2 rounded-md text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs"
                >
                  确认插入文章
                </button>
              </div>

            </div>
          </div>
        )}

        {/* --- CODE TEMPLATES MODAL --- */}
        {showCodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md max-w-2xl w-full overflow-hidden shadow-2xl space-y-4">
              
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      常用编程语言代码块模版
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      内置常用全栈、AI 接口、数据库与脚本模版，带正确 Markdown 语法高亮
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Left: Code Snippet Selector */}
                <div className="space-y-1 md:col-span-1 max-h-64 overflow-y-auto pr-1">
                  {CODE_TEMPLATES.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedCodeIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-md text-xs font-semibold border transition-all ${
                        selectedCodeIndex === idx
                          ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shrink-0 ml-1">
                          {item.lang}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Right: Code Preview */}
                <div className="md:col-span-2 p-3 rounded-lg bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto max-h-64 border border-zinc-800 leading-relaxed">
                  <div className="text-[10px] font-bold text-zinc-500 mb-2 border-b border-zinc-800 pb-1 flex items-center justify-between">
                    <span>语法: {CODE_TEMPLATES[selectedCodeIndex].lang}</span>
                    <span className="text-purple-400">``` {CODE_TEMPLATES[selectedCodeIndex].lang}</span>
                  </div>
                  <pre className="whitespace-pre">
                    {CODE_TEMPLATES[selectedCodeIndex].code}
                  </pre>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                  className="px-4 py-2 rounded-md text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const current = CODE_TEMPLATES[selectedCodeIndex];
                    const codeMd = `\`\`\`${current.lang}\n${current.code}\n\`\`\`\n`;
                    handleInsertSnippet(codeMd, current.title);
                    setShowCodeModal(false);
                  }}
                  className="px-5 py-2 rounded-md text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-xs flex items-center gap-1.5"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>插入此代码块至编辑器</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* --- EMOJI & ICON PICKER MODAL --- */}
        {showEmojiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md max-w-md w-full overflow-hidden shadow-2xl space-y-3">
              
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smile className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    选择表情与图标 (点击插入光标位置)
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEmojiModal(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 space-y-4 max-h-72 overflow-y-auto">
                {EMOJI_GROUPS.map((group, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase">{group.title}</p>
                    <div className="grid grid-cols-7 gap-1.5">
                      {group.list.map((emoji, eIdx) => (
                        <button
                          key={eIdx}
                          type="button"
                          onClick={() => insertAtCursor(emoji, emoji)}
                          className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-800/60 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-zinc-200/60 dark:border-zinc-700/60 text-lg hover:scale-125 transition-transform flex items-center justify-center"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEmojiModal(false)}
                  className="px-4 py-1.5 rounded-md text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300"
                >
                  完成
                </button>
              </div>

            </div>
          </div>
        )}

        {/* --- 360° PANORAMA INSERTION MODAL --- */}
        {showPanoramaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md max-w-lg w-full overflow-hidden shadow-2xl space-y-4">
              
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      360° 全景图配置与插入
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      支持矩形等距等角 360° 全景贴图在线渲染
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPanoramaModal(false)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4 text-xs">
                
                {/* Presets Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>选择 360° 全景预设模版：</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPanoramaUrlInput('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=2000');
                        setPanoramaCaptionInput('赛博朋克极客工作站 360° 全景体验');
                      }}
                      className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 transition-all text-left space-y-1"
                    >
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate">💻 赛博极客站</span>
                      <span className="text-[10px] text-zinc-400 block truncate">工作站室内全景</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPanoramaUrlInput('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2000');
                        setPanoramaCaptionInput('现代艺术美术馆 360° 沉浸展厅');
                      }}
                      className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 transition-all text-left space-y-1"
                    >
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate">🏛️ 艺术展览馆</span>
                      <span className="text-[10px] text-zinc-400 block truncate">现代画廊展厅</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPanoramaUrlInput('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=2000');
                        setPanoramaCaptionInput('极简山顶露天广场 360° 户外全景');
                      }}
                      className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 transition-all text-left space-y-1"
                    >
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate">🌄 户外自然广角</span>
                      <span className="text-[10px] text-zinc-400 block truncate">山顶自然全景</span>
                    </button>
                  </div>
                </div>

                {/* Panorama URL */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">
                    全景图片 URL 地址 (支持 2:1 宽高比全景图):
                  </label>
                  <input
                    type="url"
                    value={panoramaUrlInput}
                    onChange={(e) => setPanoramaUrlInput(e.target.value)}
                    placeholder="https://example.com/360-panorama.jpg"
                    className="w-full px-3.5 py-2 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>或直接选择本地文件模拟上传:</span>
                    <label className="text-emerald-500 font-bold hover:underline cursor-pointer">
                      上传本地全景图
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setPanoramaUrlInput(ev.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Panorama Caption */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">
                    全景图展示标题 / 描述语:
                  </label>
                  <input
                    type="text"
                    value={panoramaCaptionInput}
                    onChange={(e) => setPanoramaCaptionInput(e.target.value)}
                    placeholder="360° 交互式全景环视体验"
                    className="w-full px-3.5 py-2 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-mono">
                  组件将自动插入到 Markdown 正文
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const embedHtml = `<div data-type="panorama" data-src="${panoramaUrlInput}" data-caption="${panoramaCaptionInput}"></div>\n\n`;
                    insertAtCursor(embedHtml, '360° 全景环视组件');
                    setShowPanoramaModal(false);
                  }}
                  className="px-5 py-2 rounded-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>插入 360° 全景环视组件</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* --- 3D MODEL & 3D PDF INSERTION MODAL --- */}
        {show3DModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md max-w-lg w-full overflow-hidden shadow-2xl space-y-4">
              
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-500 border border-indigo-500/30">
                    <Box className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      3D 交互模型 & 3D PDF 在线体验插入
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      支持 WebGL 三维渲染模型、3D PDF 矢量规格图纸与 CAD 网页嵌入
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShow3DModal(false)}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4 text-xs">
                
                {/* Mode Selector */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">
                    选择 3D 渲染与支持类型:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setThreeDFormatInput('procedural')}
                      className={`p-3 rounded-lg border text-left space-y-1 transition-all ${
                        threeDFormatInput === 'procedural'
                          ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Box className="w-4 h-4 text-indigo-500" />
                        <span>3D 实时交互渲染</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-normal">
                        包含 360° 轨道旋转、线框模式与多预设
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThreeDFormatInput('3dpdf')}
                      className={`p-3 rounded-lg border text-left space-y-1 transition-all ${
                        threeDFormatInput === '3dpdf'
                          ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-purple-500" />
                        <span>3D PDF 矢量手册</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-normal">
                        解析 3D PDF 图纸与 CAD 规格注解
                      </p>
                    </button>
                  </div>
                </div>

                {/* 3D Title */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">
                    3D 控件展示标题:
                  </label>
                  <input
                    type="text"
                    value={threeDTitleInput}
                    onChange={(e) => setThreeDTitleInput(e.target.value)}
                    placeholder="智能工业机器人 3D 模型与 3D PDF 规格说明"
                    className="w-full px-3.5 py-2 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* 3D Model / PDF Link */}
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">
                    外部 3D 模型 (.glb / .gltf) 或 3D PDF 文件链接 (可选):
                  </label>
                  <input
                    type="url"
                    value={threeDUrlInput}
                    onChange={(e) => setThreeDUrlInput(e.target.value)}
                    placeholder="https://example.com/model.pdf 或 https://example.com/robot.glb"
                    className="w-full px-3.5 py-2 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-mono">
                  组件将自动插入到 Markdown 正文
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const embedHtml = `<div data-type="3d-model" data-title="${threeDTitleInput}" data-format="${threeDFormatInput}" ${threeDUrlInput ? `data-src="${threeDUrlInput}"` : ''}></div>\n\n`;
                    insertAtCursor(embedHtml, '3D 模型 & 3D PDF 组件');
                    setShow3DModal(false);
                  }}
                  className="px-5 py-2 rounded-md text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xs flex items-center gap-1.5"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>插入 3D 交互组件</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Image Cropper & Optimization Modal */}
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => setIsCropperOpen(false)}
          initialImageUrl={
            cropperTarget === 'mascotIcon'
              ? (mascotIcon.startsWith('http') || mascotIcon.startsWith('data:') ? mascotIcon : '')
              : cropperTarget === 'avatar'
              ? (profileAvatar.startsWith('http') || profileAvatar.startsWith('data:') ? profileAvatar : '')
              : cropperTarget === 'customLogo'
              ? (profileCustomLogoUrl.startsWith('http') || profileCustomLogoUrl.startsWith('data:') ? profileCustomLogoUrl : '')
              : cropperTarget === 'promoIcon'
              ? (profileSidebarPromos[editingPromoIndexForCrop]?.icon && (profileSidebarPromos[editingPromoIndexForCrop].icon.startsWith('http') || profileSidebarPromos[editingPromoIndexForCrop].icon.startsWith('data:')) ? profileSidebarPromos[editingPromoIndexForCrop].icon : '')
              : coverImage
          }
          onCropComplete={(croppedUrl) => {
            if (cropperTarget === 'mascotIcon') {
              setMascotIcon(croppedUrl);
              showToast('已裁切并应用中间封面贴纸图标！');
            } else if (cropperTarget === 'avatar') {
              setProfileAvatar(croppedUrl);
              showToast('已裁切并应用作者形象照！');
            } else if (cropperTarget === 'customLogo') {
              setProfileCustomLogoUrl(croppedUrl);
              setProfileCustomLogoType('image');
              showToast('已裁切并应用 Logo 图片！');
            } else if (cropperTarget === 'promoIcon') {
              handleUpdatePromoBlock(editingPromoIndexForCrop, 'icon', croppedUrl);
              showToast('已裁切并应用宣传卡片图标！');
            } else {
              setCoverImage(croppedUrl);
              showToast('已裁切并应用封面大图！');
            }
          }}
        />

      </div>
    </div>
  );
};
