export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  url?: string;
  target?: '_self' | '_blank';
  isExternal?: boolean;
  subItems?: { id: string; label: string; url: string; target?: string }[];
}

export interface SiteConfig {
  siteTitle: string;
  siteSubtitle: string;
  logoType: 'text' | 'image' | 'icon';
  logoText: string;
  logoImageUrl: string;
  icpNumber: string;
  copyrightYear: string;
  primaryAccentColor: string;
}

export interface ModuleLayoutConfig {
  showBentoHeader: boolean;
  showHeroRecommend: boolean;
  showFilterPills: boolean;
  showSidebar: boolean;
  cardShape: 'rounded-2xl' | 'rounded-xl' | 'rounded-lg';
  gridColumns: 2 | 3 | 4;
  defaultViewMode: 'grid' | 'list';
  moduleOrder: string[];
  // 页面自适应与多端响应式配置
  enableAdaptiveWidth?: boolean;
  adaptiveMaxWidth?: 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-[1440px]' | 'max-w-[1600px]' | 'max-w-full';
  adaptiveSidebarMobile?: boolean;
  adaptiveGridAutoColumns?: boolean;
  adaptiveTouchOptimization?: boolean;
  adaptiveDensity?: 'compact' | 'comfortable' | 'spacious';
}

export interface CoverPreset {
  id: string;
  name: string;
  bgGradient: string;
  textColor: string;
  iconBg: string;
}

export interface HeroRecommendItem {
  id: string;
  title: string;
  subtitle: string;
  iconUrl?: string;
  bannerBg: string;
  tag: string;
  mascotIcon?: string;
  url?: string;
  articleId?: string;
  article?: Article;
}

export interface MusicTrackInfo {
  id?: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl?: string;
  platform?: '163' | 'qq' | 'kugou' | 'custom';
  platformId?: string;
}

export interface ArticleAttachment {
  id: string;
  name: string;
  size: string;
  fileType: string;
  fileUrl: string;
  isPaid: boolean;
  price: number; // Required credits to download if not free
  requiredLevel: number; // 1=Lv.1普通, 2=Lv.2白银, 3=Lv.3黄金, 4=Lv.4钻石, 5=Lv.5星耀VIP, 6=Lv.6荣耀SVIP, 7=Lv.7冠世至尊SVIP
}

export interface NetdiskLink {
  id: string;
  platform: 'baidu' | 'quark' | 'aliyun' | 'lanzou' | 'google' | 'xunlei' | '115' | 'other';
  title: string;
  url: string;
  code?: string; // 提取码 / 访问码
  unzipCode?: string; // 解压密码
  note?: string; // 备注说明
  isPaid?: boolean; // 是否需付费/限制
  price?: number; // 解锁此网盘链接所需积分
  requiredLevel?: number; // 最低等级要求 1=Lv.1, 2=Lv.2, 3=Lv.3, 4=Lv.4, 5=Lv.5, 6=Lv.6, 7=Lv.7
}

export interface MemberTier {
  id: string;
  levelNumeric: number;
  name: string;
  icon: string; // e.g., 'User', 'Shield', 'Zap', 'Star', 'Crown', 'Sparkles', 'Award', 'Flame'
  color: string; // Gradient or color class e.g. 'from-blue-500 to-indigo-500'
  badgeBg: string;
  textColor: string;
  requiredPoints: number;
  perks: string[];
}

export interface WarningNote {
  id: string;
  content: string;
  date: string;
  read?: boolean;
  type?: 'warning' | 'info' | 'notice';
}

export interface UserMember {
  id: string;
  username: string;
  email: string;
  avatar: string;
  level: string; // e.g., 'Lv.1 普通会员', 'Lv.2 白银会员', 'Lv.3 黄金会员', 'Lv.4 钻石会员', 'Lv.5 星耀 VIP', 'Lv.6 荣耀 SVIP', 'Lv.7 冠世至尊 SVIP'
  levelNumeric: number; // 1 ~ 7
  credits: number; // 用户积分 / 余额
  exp?: number; // 累计经验值
  isBlacklisted?: boolean; // 是否拉黑/封禁
  blacklistReason?: string; // 封禁原因
  isMuted?: boolean; // 是否禁言
  muteReason?: string; // 禁言原因
  warningNotes?: WarningNote[]; // 系统提醒/警告消息列表
  unlockedArticles: string[]; // 已购买/解锁文章 ID
  purchasedAttachments: string[]; // 已付费购买附件 ID
  unlockedNetdisks?: string[]; // 已解锁网盘链接 ID
  createdAt: string;
  bio?: string;
}

export interface DirectMessage {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  sender: 'user' | 'admin';
  content: string;
  createdAt: string;
  readByAdmin?: boolean;
  readByUser?: boolean;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  date: string;
  readingTime: string;
  wordCount?: number;
  views: number;
  likes: number;
  featured?: boolean;
  isHeroFeatured?: boolean;
  isBannerRecommend?: boolean;
  aiSummary?: string;
  comments: ArticleComment[];
  // Sanfun Specific Card Cover Fields
  coverText?: string;
  coverBg?: string;
  mascotIcon?: string;
  readStatus?: string;
  // Paid Reading & VIP Membership Locks
  isPaid?: boolean;
  price?: number; // 购买/解锁本文所需积分
  requiredLevel?: number; // 要求的最低会员等级 (1=Lv.1+, 2=Lv.2+, 3=Lv.3+, 4=Lv.4+, 5=Lv.5)
  paidContent?: string; // 隐藏的高阶/独家计费内容 (解锁后显示)
  requireCommentToView?: boolean; // 评论后才可以查看核心隐藏内容开关
  attachments?: ArticleAttachment[]; // 关联资源与附件下载
  netdiskLinks?: NetdiskLink[]; // 关联网盘链接分享
}

export interface ArticleComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  date: string;
  likes: number;
  image?: string; // 评论附带图片 URL
  level?: string;
  location?: string;
  os?: string;
  browser?: string;
  isAuthor?: boolean;
  userId?: string;
  replies?: ArticleComment[];
}

export interface Moment {
  id: string;
  content: string;
  date: string;
  images?: string[];
  likes: number;
  tags?: string[];
  location?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  tags: string[];
  demoUrl?: string;
  githubUrl?: string;
  stars?: number;
  featured?: boolean;
  category: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  iconName: string;
  imageUrl?: string;
  rating: number;
  link?: string;
  status: string;
}

export interface FriendLink {
  id: string;
  name: string;
  avatar: string;
  description: string;
  url: string;
  status?: string;
  tags?: string[];
  applicantEmail?: string;
  applyDate?: string;
  appliedAt?: string;
  email?: string;
  rejectReason?: string;
  rssUrl?: string;
}

export interface SidebarPromoBlock {
  id: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  icon: string;
  bgGradient: string;
  linkUrl: string;
  target?: '_self' | '_blank';
}

export interface AuthorProfile {
  name: string;
  handle: string;
  avatar: string;
  tagline: string;
  bio: string;
  location: string;
  statusText: string;
  statusEmoji: string;
  siteDomain?: string;
  customLogoType?: 'image' | 'text' | 'icon';
  customLogoUrl?: string;
  customLogoText?: string;
  customLogoLink?: string;
  socials: {
    github?: string;
    twitter?: string;
    email?: string;
    bilibili?: string;
    wechat?: string;
    qq?: string;
    xiaohongshu?: string;
    telegram?: string;
    zhihu?: string;
    juejin?: string;
  };
  customLinks?: { id: string; name: string; icon: string; url: string; color?: string }[];
  sidebarPromos?: SidebarPromoBlock[];
  techStack: { name: string; icon: string; color: string }[];
}
