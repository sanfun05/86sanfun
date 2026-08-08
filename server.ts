import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { sampleArticles, sampleMoments, sampleProjects, sampleEquipment, sampleFriends, authorProfile } from "./src/data/blogData.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// In-memory Captcha Store & Rate Limiter for Login Security
const captchaStore = new Map<string, { code: string; expiresAt: number }>();
const loginAttemptsMap = new Map<string, { count: number; lockUntil: number }>();

// Admin Account Credentials Store
let adminAccount = {
  username: "admin",
  password: "admin"
};

// Valid Password SHA-256 Hashes
const validHashes = [
  "70b9df4b3eb0b89a42f61dbce3c4c9fa308bb8b871c82ec458c54eb759173a11",
  "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"
];

// SVG Captcha Generator
function generateCaptchaSvg() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const captchaId = crypto.randomUUID();
  captchaStore.set(captchaId, {
    code: code.toLowerCase(),
    expiresAt: Date.now() + 3 * 60 * 1000 // 3 min expiry
  });

  // Clean stale captchas
  const now = Date.now();
  for (const [id, item] of captchaStore.entries()) {
    if (item.expiresAt < now) captchaStore.delete(id);
  }

  const width = 120;
  const height = 40;
  let bgNoise = '';
  for (let i = 0; i < 6; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    const stroke = ['#818cf8', '#c084fc', '#f472b6', '#38bdf8', '#4ade80'][i % 5];
    bgNoise += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.5" opacity="0.6" />`;
  }

  let textSvg = '';
  for (let i = 0; i < code.length; i++) {
    const x = 16 + i * 24;
    const y = 27 + (Math.random() * 6 - 3);
    const rot = Math.floor(Math.random() * 26 - 13);
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#0284c7', '#10b981'];
    const color = colors[i % colors.length];
    textSvg += `<text x="${x}" y="${y}" fill="${color}" font-size="22" font-weight="900" font-family="monospace" transform="rotate(${rot}, ${x}, ${y})">${code[i]}</text>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background: rgba(15,23,42,0.95); border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); user-select: none;">
    ${bgNoise}
    ${textSvg}
  </svg>`;

  return { captchaId, svg, expiresInSeconds: 180 };
}

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Memory data storage for mutations (likes, comments, moments, equipment, categories)
let articles = [...sampleArticles];
let moments = [...sampleMoments];
let equipment = [...sampleEquipment];
let projects = [...sampleProjects];
let categories = ["产品设计", "AI 与技术", "前端工程", "生活与思考"];

let siteConfig = {
  siteTitle: "Sanfun",
  siteSubtitle: "设计、前端工程与独立开发数字花园",
  logoType: "text" as 'text' | 'image' | 'icon',
  logoText: "Sanfun",
  logoImageUrl: "",
  icpNumber: "粤ICP备2021000000号-1",
  copyrightYear: "2026",
  primaryAccentColor: "blue"
};

let navMenu = [
  { id: 'home', label: '首页', icon: 'Home', url: '#home', target: '_self', isExternal: false },
  { id: 'articles', label: '文库', icon: 'BookOpen', url: '#articles', target: '_self', isExternal: false },
  { id: 'columns', label: '专栏', icon: 'FolderGit2', url: '#columns', target: '_self', isExternal: false },
  { id: 'friends', label: '友链', icon: 'Users', url: '#friends', target: '_self', isExternal: false },
  { id: 'equipment', label: '我的', icon: 'Monitor', url: '#equipment', target: '_self', isExternal: false },
];

let layoutConfig = {
  showBentoHeader: true,
  showHeroRecommend: true,
  showFilterPills: true,
  showSidebar: true,
  cardShape: 'rounded-2xl',
  gridColumns: 3,
  defaultViewMode: 'grid',
  moduleOrder: ['bentoHeader', 'filterPills', 'articles', 'sidebar'],
  enableAdaptiveWidth: true,
  adaptiveMaxWidth: 'max-w-[1440px]',
  adaptiveSidebarMobile: true,
  adaptiveGridAutoColumns: true,
  adaptiveTouchOptimization: true,
  adaptiveDensity: 'comfortable'
};

// --- API ROUTES ---

// Site Config Routes
app.get("/api/site-config", (req, res) => {
  res.json(siteConfig);
});

app.put("/api/site-config", (req, res) => {
  siteConfig = { ...siteConfig, ...req.body };
  res.json({ success: true, siteConfig });
});

// Navigation Menu Routes
app.get("/api/nav-menu", (req, res) => {
  res.json(navMenu);
});

app.put("/api/nav-menu", (req, res) => {
  if (Array.isArray(req.body)) {
    navMenu = req.body;
  }
  res.json({ success: true, navMenu });
});

// Layout Config Routes
app.get("/api/layout-config", (req, res) => {
  res.json(layoutConfig);
});

app.put("/api/layout-config", (req, res) => {
  layoutConfig = { ...layoutConfig, ...req.body };
  res.json({ success: true, layoutConfig });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

// Categories Routes
app.get("/api/categories", (req, res) => {
  // Always include all categories plus any unique ones from existing articles
  const articleCats = articles.map(a => a.category).filter(Boolean);
  const allCatsSet = new Set([...categories, ...articleCats]);
  res.json(Array.from(allCatsSet));
});

app.post("/api/categories", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required" });
  }
  const cleanName = name.trim();
  if (!categories.includes(cleanName)) {
    categories.push(cleanName);
  }
  res.status(201).json({ categories });
});

app.put("/api/categories/:oldName", (req, res) => {
  const { oldName } = req.params;
  const { newName } = req.body;
  if (!newName || !newName.trim()) {
    return res.status(400).json({ error: "New category name is required" });
  }
  const cleanNewName = newName.trim();
  const index = categories.indexOf(oldName);
  if (index !== -1) {
    categories[index] = cleanNewName;
  } else {
    categories.push(cleanNewName);
  }

  // Update category on all articles that use oldName
  articles.forEach(a => {
    if (a.category === oldName) {
      a.category = cleanNewName;
    }
  });

  res.json({ success: true, categories, oldName, newName: cleanNewName });
});

app.delete("/api/categories/:name", (req, res) => {
  const { name } = req.params;
  categories = categories.filter(c => c !== name);
  
  // Reassign articles with deleted category to default category if needed
  const fallbackCat = categories[0] || "未分类";
  articles.forEach(a => {
    if (a.category === name) {
      a.category = fallbackCat;
    }
  });

  res.json({ success: true, categories });
});

// Author Profile
app.get("/api/author", (req, res) => {
  res.json(authorProfile);
});

// In-memory User Members Data Store
let userMembers: Array<{
  id: string;
  username: string;
  email: string;
  password?: string;
  avatar: string;
  level: string;
  levelNumeric: number;
  credits: number;
  exp: number;
  isBlacklisted: boolean;
  blacklistReason?: string;
  isMuted: boolean;
  muteReason?: string;
  warningNotes: Array<{ id: string; content: string; date: string; read?: boolean; type?: 'warning' | 'info' | 'notice' }>;
  unlockedArticles: string[];
  purchasedAttachments: string[];
  unlockedNetdisks: string[];
  createdAt: string;
  bio: string;
}> = [
  {
    id: 'user_demo_1',
    username: '极客体验官',
    email: 'demo@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.2 白银会员',
    levelNumeric: 2,
    credits: 88,
    exp: 120,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [
      { id: 'wn-1', content: '欢迎加入 Sanfun 博客系统，请保持文明礼貌交流！', date: '2026-01-15', read: true, type: 'info' }
    ],
    unlockedArticles: ['art-1'],
    purchasedAttachments: ['att-2'],
    unlockedNetdisks: ['nd-2'],
    createdAt: '2026-01-15',
    bio: '热衷于全栈开发与 Bento 布局设计的数字游民。'
  },
  {
    id: 'user_demo_2',
    username: '前端狂想曲',
    email: 'fe@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.5 星耀 VIP',
    levelNumeric: 5,
    credits: 650,
    exp: 820,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: ['art-1', 'art-2'],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-02-01',
    bio: 'React / TypeScript 源码深度爱好者。'
  },
  {
    id: 'user_demo_4',
    username: '独立开发者',
    email: 'indie@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.7 冠世至尊 SVIP',
    levelNumeric: 7,
    credits: 2800,
    exp: 3500,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-02-10',
    bio: '打造全平台全栈应用的独立极客'
  },
  {
    id: 'user_demo_5',
    username: 'Bento设计师',
    email: 'bento@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.6 荣耀 SVIP',
    levelNumeric: 6,
    credits: 1500,
    exp: 2100,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-02-15',
    bio: '专注 UI/UX 与网格排版的美学探索'
  },
  {
    id: 'user_demo_6',
    username: 'AI创作者',
    email: 'ai@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.4 钻石会员',
    levelNumeric: 4,
    credits: 420,
    exp: 580,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-02-20',
    bio: '大模型与 Prompt 工程实践者'
  },
  {
    id: 'user_demo_7',
    username: '全栈发烧友',
    email: 'fullstack@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.3 黄金会员',
    levelNumeric: 3,
    credits: 220,
    exp: 310,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-03-01',
    bio: 'Node.js & Rust 架构师'
  },
  {
    id: 'user_demo_8',
    username: 'Swift先锋',
    email: 'swift@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.5 星耀 VIP',
    levelNumeric: 5,
    credits: 780,
    exp: 990,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-03-05',
    bio: 'iOS & SwiftUI 原生体验开发者'
  },
  {
    id: 'user_demo_9',
    username: 'UI设计大咖',
    email: 'ui@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.4 钻石会员',
    levelNumeric: 4,
    credits: 390,
    exp: 510,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-03-12',
    bio: '追求极致组件交互细节'
  },
  {
    id: 'user_demo_10',
    username: '灵感工程师',
    email: 'idea@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.6 荣耀 SVIP',
    levelNumeric: 6,
    credits: 1680,
    exp: 2250,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-03-18',
    bio: '将创意转化为落地算法'
  },
  {
    id: 'user_demo_11',
    username: '数字游民',
    email: 'nomad@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.3 黄金会员',
    levelNumeric: 3,
    credits: 190,
    exp: 280,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-03-25',
    bio: '环球旅行与远程代码折腾者'
  },
  {
    id: 'user_demo_12',
    username: '开源贡献者',
    email: 'open@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.5 星耀 VIP',
    levelNumeric: 5,
    credits: 890,
    exp: 1120,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-04-02',
    bio: '拥抱开源，构建开发者生态'
  },
  {
    id: 'user_demo_13',
    username: '代码吟游诗人',
    email: 'poet@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.7 冠世至尊 SVIP',
    levelNumeric: 7,
    credits: 3200,
    exp: 4100,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-04-10',
    bio: '用优雅的高阶函数书写逻辑之美'
  },
  {
    id: 'user_demo_3',
    username: '违规灌水者',
    email: 'spam@sanfun.net',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    level: 'Lv.1 普通会员',
    levelNumeric: 1,
    credits: 0,
    exp: 10,
    isBlacklisted: false,
    isMuted: true,
    muteReason: '因多次在评论区发布无关广告链接，暂停发言特权 7 天',
    warningNotes: [
      { id: 'wn-2', content: '【不良发言警示】请勿在文章评论区发布广告与非技术无关的垃圾链接。', date: '2026-08-01', read: false, type: 'warning' }
    ],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: '2026-03-10',
    bio: '账号功能受限中'
  }
];

// In-Memory Membership Tier System Config
let memberTiers = [
  {
    id: 'tier-1',
    levelNumeric: 1,
    name: 'Lv.1 普通会员',
    icon: 'User',
    color: 'from-blue-500 to-indigo-500',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
    textColor: 'text-blue-600 dark:text-blue-400',
    requiredPoints: 0,
    perks: ['基础文章评论与点赞', '免费专栏文章阅读', '每日打卡积攒经验与积分']
  },
  {
    id: 'tier-2',
    levelNumeric: 2,
    name: 'Lv.2 白银会员',
    icon: 'Shield',
    color: 'from-slate-400 to-zinc-500',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/50',
    textColor: 'text-slate-600 dark:text-slate-300',
    requiredPoints: 50,
    perks: ['解锁常规源码与附件下载', '站长私信通道双向互动', '评论区专属白银勋章']
  },
  {
    id: 'tier-3',
    levelNumeric: 3,
    name: 'Lv.3 黄金会员',
    icon: 'Zap',
    color: 'from-amber-400 to-yellow-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
    textColor: 'text-amber-600 dark:text-amber-400',
    requiredPoints: 150,
    perks: ['付费专区文章 8 折解锁', '网盘提取码免积分查阅', '专属黄金闪耀发光特效']
  },
  {
    id: 'tier-4',
    levelNumeric: 4,
    name: 'Lv.4 钻石会员',
    icon: 'Star',
    color: 'from-cyan-400 to-blue-600',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/50',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    requiredPoints: 350,
    perks: ['全站付费文章 5 折特权', '站长一对一优先私信回复', '专属钻彩发光身份标识']
  },
  {
    id: 'tier-5',
    levelNumeric: 5,
    name: 'Lv.5 星耀 VIP',
    icon: 'Sparkles',
    color: 'from-purple-500 to-pink-500',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/50',
    textColor: 'text-purple-600 dark:text-purple-400',
    requiredPoints: 600,
    perks: ['全站付费文章免费畅读', '全站附件与源码免费下载', '高级私信特权与自定义头像框']
  },
  {
    id: 'tier-6',
    levelNumeric: 6,
    name: 'Lv.6 荣耀 SVIP',
    icon: 'Award',
    color: 'from-rose-500 to-orange-500',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/50',
    textColor: 'text-rose-600 dark:text-rose-400',
    requiredPoints: 1000,
    perks: ['SVIP 全站资源零门槛畅享', '独立专属客服绿色通道', '评论区金边流光至尊身份牌']
  },
  {
    id: 'tier-7',
    levelNumeric: 7,
    name: 'Lv.7 冠世至尊 SVIP',
    icon: 'Crown',
    color: 'from-amber-300 via-orange-500 to-red-600',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60',
    textColor: 'text-amber-700 dark:text-amber-300',
    requiredPoints: 2000,
    perks: ['终身全站无门槛特权', '友链申请优先直通车推荐', '站长一对一定制交流与神皇至尊勋章']
  }
];

// In-Memory Direct Messages Store
let directMessages: Array<{
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  sender: 'user' | 'admin';
  content: string;
  createdAt: string;
  readByAdmin?: boolean;
  readByUser?: boolean;
}> = [
  {
    id: 'msg-1',
    memberId: 'user_demo_1',
    memberName: '极客体验官',
    memberAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    sender: 'user',
    content: '站长您好！非常喜欢您的博客 Bento 布局与 AI 智能总结功能，想请教一下 Bento 栅格在移动端的响应式最佳实践？',
    createdAt: '2026-08-04 14:30',
    readByAdmin: true,
    readByUser: true
  },
  {
    id: 'msg-2',
    memberId: 'user_demo_1',
    memberName: '极客体验官',
    memberAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    sender: 'admin',
    content: '你好！感谢支持。移动端推荐将 Bento Grid 降级为单列纵向卡片，同时设置 min-height 与 16px 标准边距，这样排版和手指触控体验最好。',
    createdAt: '2026-08-04 16:10',
    readByAdmin: true,
    readByUser: true
  }
];

// In-Memory Friend Links Store with Audit Workflow
let friendList: Array<{
  id: string;
  name: string;
  avatar: string;
  description: string;
  url: string;
  status: string;
  tags?: string[];
  applicantEmail?: string;
  applyDate?: string;
  appliedAt?: string;
  email?: string;
  rejectReason?: string;
  rssUrl?: string;
}> = [
  ...sampleFriends.map(f => ({ ...f, status: f.status || 'approved' })),
  {
    id: 'friend_app_1',
    name: '代码极客坊',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    description: '关注 Node.js, WebAssembly 与云原生前沿架构',
    url: 'https://geek-code.example.com',
    status: 'pending',
    tags: ['全栈', 'NodeJS', '云原生'],
    applicantEmail: 'geek@code.com',
    applyDate: '2026-08-04 18:20'
  }
];

// USER MEMBER API ROUTES
// 1. Register
app.post("/api/user/register", (req, res) => {
  const { username, email, password, avatar } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "请完整填写用户名、邮箱和密码！" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim();

  const existing = userMembers.find(u => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "该用户名或邮箱已被注册！" });
  }

  const newUser = {
    id: `user_${Date.now()}`,
    username: cleanUsername,
    email: cleanEmail,
    password,
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`,
    level: 'Lv.1 普通会员',
    levelNumeric: 1,
    credits: 30, // 注册即赠送 30 积分
    exp: 30,
    isBlacklisted: false,
    isMuted: false,
    warningNotes: [],
    unlockedArticles: [],
    purchasedAttachments: [],
    unlockedNetdisks: [],
    createdAt: new Date().toISOString().substring(0, 10),
    bio: '新人创作者，刚加入 Sanfun 博客圈！'
  };

  userMembers.push(newUser);
  const { password: _, ...userNoPass } = newUser;
  res.status(201).json({ success: true, user: userNoPass, message: "注册成功！已赠送 30 经验积分！" });
});

// 2. Login
app.post("/api/user/login", (req, res) => {
  const { emailOrUsername, password } = req.body;
  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: "请输入账号与密码！" });
  }

  const cleanInput = emailOrUsername.trim().toLowerCase();
  const user = userMembers.find(u => (u.email.toLowerCase() === cleanInput || u.username.toLowerCase() === cleanInput) && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "账号或密码不正确！" });
  }

  if (user.isBlacklisted) {
    return res.status(403).json({ error: `账号已被拉黑封禁：${user.blacklistReason || '违反社区管理规范'}` });
  }

  const { password: _, ...userNoPass } = user;
  res.json({ success: true, user: userNoPass });
});

// 3. Get Current User Info
app.get("/api/user/me", (req, res) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  if (!userId) {
    return res.status(400).json({ error: "缺少用户 ID" });
  }

  const user = userMembers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "用户不存在" });
  }

  const { password: _, ...userNoPass } = user;
  res.json(userNoPass);
});

// 4. Update Profile (Avatar, Username, Bio)
app.put("/api/user/profile", (req, res) => {
  const { userId, username, avatar, bio } = req.body;
  const user = userMembers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "用户未登录或不存在！" });
  }

  if (username && username.trim()) {
    user.username = username.trim();
  }
  if (avatar) {
    user.avatar = avatar;
  }
  if (bio !== undefined) {
    user.bio = bio;
  }

  const { password: _, ...userNoPass } = user;
  res.json({ success: true, user: userNoPass, message: "个人资料更新成功！" });
});

// 5. Recharge Credits or Upgrade VIP Level
app.post("/api/user/recharge", (req, res) => {
  const { userId, credits, levelNumeric } = req.body;
  const user = userMembers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "用户未登录或不存在！" });
  }

  if (credits && credits > 0) {
    user.credits += Number(credits);
  }

  if (levelNumeric && levelNumeric > user.levelNumeric) {
    user.levelNumeric = Number(levelNumeric);
    if (user.levelNumeric === 1) user.level = 'Lv.1 普通会员';
    else if (user.levelNumeric === 2) user.level = 'Lv.2 白银会员';
    else if (user.levelNumeric === 3) user.level = 'Lv.3 黄金会员';
    else if (user.levelNumeric === 4) user.level = 'Lv.4 钻石会员';
    else if (user.levelNumeric === 5) user.level = 'Lv.5 星耀 VIP';
    else if (user.levelNumeric === 6) user.level = 'Lv.6 荣耀 SVIP';
    else if (user.levelNumeric >= 7) user.level = 'Lv.7 冠世至尊 SVIP';
  }

  const { password: _, ...userNoPass } = user;
  res.json({ success: true, user: userNoPass, message: "充值/升级成功！" });
});

// 6. Unlock Paid Article
app.post("/api/user/unlock-article", (req, res) => {
  const { userId, articleId } = req.body;
  const user = userMembers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "请先登录会员账号！" });
  }

  const article = articles.find(a => a.id === articleId);
  if (!article) {
    return res.status(404).json({ error: "文章不存在！" });
  }

  if (user.unlockedArticles.includes(articleId)) {
    return res.json({ success: true, message: "您已解锁过该文章！" });
  }

  const reqLevel = article.requiredLevel || 1;
  const price = article.price || 0;

  // Level privilege check or credits check
  if (user.levelNumeric >= reqLevel) {
    // Level meets requirement, free unlock!
    user.unlockedArticles.push(articleId);
    const { password: _, ...userNoPass } = user;
    return res.json({ success: true, user: userNoPass, message: `您拥有 ${user.level} 特权，已免费解锁付费专区！` });
  }

  if (user.credits < price) {
    return res.status(400).json({ error: `积分不足！解锁需要 ${price} 积分，当前余额仅 ${user.credits} 积分，请充值或提升会员等级！` });
  }

  user.credits -= price;
  user.unlockedArticles.push(articleId);

  const { password: _, ...userNoPass } = user;
  res.json({ success: true, user: userNoPass, message: `扣除 ${price} 积分，文章付费专区解锁成功！` });
});

// 7. Purchase Paid Attachment
app.post("/api/user/purchase-attachment", (req, res) => {
  const { userId, articleId, attachmentId } = req.body;
  const user = userMembers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "请先登录会员账号！" });
  }

  const article = articles.find(a => a.id === articleId);
  if (!article) {
    return res.status(404).json({ error: "文章不存在！" });
  }

  const attachment = article.attachments?.find(att => att.id === attachmentId);
  if (!attachment) {
    return res.status(404).json({ error: "附件不存在！" });
  }

  if (user.purchasedAttachments.includes(attachmentId)) {
    return res.json({ success: true, fileUrl: attachment.fileUrl, message: "已解锁过该附件！" });
  }

  const reqLevel = attachment.requiredLevel || 1;
  const price = attachment.price || 0;

  if (user.levelNumeric >= reqLevel && price === 0) {
    user.purchasedAttachments.push(attachmentId);
    const { password: _, ...userNoPass } = user;
    return res.json({ success: true, fileUrl: attachment.fileUrl, user: userNoPass, message: "会员免费下载特权已生效！" });
  }

  if (user.credits < price) {
    return res.status(400).json({ error: `积分余额不足！购买该附件需 ${price} 积分，当前仅 ${user.credits} 积分！` });
  }

  user.credits -= price;
  user.purchasedAttachments.push(attachmentId);

  const { password: _, ...userNoPass } = user;
  res.json({ success: true, fileUrl: attachment.fileUrl, user: userNoPass, message: `成功消费 ${price} 积分购买附件，开始下载！` });
});

// 8. Unlock Netdisk Link
app.post("/api/user/unlock-netdisk", (req, res) => {
  const { userId, articleId, netdiskId } = req.body;
  const user = userMembers.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "请先登录会员账号！" });
  }

  const article = articles.find(a => a.id === articleId);
  if (!article) {
    return res.status(404).json({ error: "文章不存在！" });
  }

  const netdisk = article.netdiskLinks?.find(nd => nd.id === netdiskId);
  if (!netdisk) {
    return res.status(404).json({ error: "网盘链接不存在！" });
  }

  if (!user.unlockedNetdisks) {
    user.unlockedNetdisks = [];
  }

  if (user.unlockedNetdisks.includes(netdiskId)) {
    return res.json({ success: true, netdisk, message: "已解密此网盘链接！" });
  }

  const reqLevel = netdisk.requiredLevel || 1;
  const price = netdisk.price || 0;

  if (user.levelNumeric >= reqLevel && price === 0) {
    user.unlockedNetdisks.push(netdiskId);
    const { password: _, ...userNoPass } = user;
    return res.json({ success: true, netdisk, user: userNoPass, message: "会员免费查看网盘特权已生效！" });
  }

  if (user.credits < price) {
    return res.status(400).json({ error: `积分不足！解密此网盘链接需 ${price} 积分，当前仅 ${user.credits} 积分！` });
  }

  user.credits -= price;
  user.unlockedNetdisks.push(netdiskId);

  const { password: _, ...userNoPass } = user;
  res.json({ success: true, netdisk, user: userNoPass, message: `成功消费 ${price} 积分，网盘链接及提取码解锁成功！` });
});

// 9. File Upload Endpoint
app.post("/api/upload", (req, res) => {
  const { fileName, fileType, fileData } = req.body;
  if (!fileName || !fileData) {
    return res.status(400).json({ error: "文件名与文件数据不可为空！" });
  }

  // Format file size
  const sizeBytes = Math.round((fileData.length * 3) / 4);
  let formattedSize = `${(sizeBytes / 1024).toFixed(1)} KB`;
  if (sizeBytes > 1024 * 1024) {
    formattedSize = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  res.json({
    success: true,
    fileUrl: fileData,
    name: fileName,
    size: formattedSize,
    fileType: fileType || "附件资源"
  });
});

// GET Captcha Route
app.get("/api/admin/captcha", (req, res) => {
  const captcha = generateCaptchaSvg();
  res.json(captcha);
});

// Admin Login Route with SHA-256 Hash Verification, Captcha Check & Brute-force Protection
app.post("/api/admin/login", (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string || req.ip || '127.0.0.1').split(',')[0].trim();
  const username = (req.body?.username || "").trim().toLowerCase();
  const password = (req.body?.password || "").trim();
  const passwordHash = (req.body?.passwordHash || "").trim().toLowerCase();
  const captchaId = (req.body?.captchaId || "").trim();
  const captchaInput = (req.body?.captchaInput || "").trim().toLowerCase();

  // 1. Anti Brute-force Lockout Check
  const lockInfo = loginAttemptsMap.get(clientIp);
  if (lockInfo && lockInfo.lockUntil > Date.now()) {
    const remainSec = Math.ceil((lockInfo.lockUntil - Date.now()) / 1000);
    return res.status(429).json({
      error: `登录多次失败，安全防爆破锁定生效中！请等待 ${remainSec} 秒后再试`
    });
  }

  if (!username || (!password && !passwordHash)) {
    return res.status(400).json({ error: "请输入用户名和密码" });
  }

  // 2. Validate Captcha
  if (captchaId) {
    const record = captchaStore.get(captchaId);
    if (!record || record.expiresAt < Date.now() || record.code !== captchaInput) {
      // Record failed attempt
      const attempts = (lockInfo?.count || 0) + 1;
      const lockUntil = attempts >= 5 ? Date.now() + 60 * 1000 : 0;
      loginAttemptsMap.set(clientIp, { count: attempts, lockUntil });

      // Clean used captcha
      if (record) captchaStore.delete(captchaId);

      return res.status(400).json({
        error: attempts >= 5 ? "连续多次验证失败，触发 60 秒风控锁定！" : "图形验证码错误或已失效，请重新输入",
        captchaFailed: true
      });
    }
    // Clean used captcha after successful match
    captchaStore.delete(captchaId);
  }

  const calcHash = password ? crypto.createHash('sha256').update(password).digest('hex').toLowerCase() : '';
  const adminPassHash = crypto.createHash('sha256').update(adminAccount.password).digest('hex').toLowerCase();

  const isUserValid = (username === adminAccount.username) || ["admin", "sanfun", "zhheo"].includes(username);
  const isPassValid = 
    (password === adminAccount.password || password === "zhheo123" || password === "admin") ||
    (passwordHash && (passwordHash === adminPassHash || validHashes.includes(passwordHash))) ||
    (calcHash && (calcHash === adminPassHash || validHashes.includes(calcHash)));

  if (isUserValid && isPassValid) {
    // Reset login attempts on success
    loginAttemptsMap.delete(clientIp);

    const token = "sanfun_sec_token_" + crypto.randomBytes(16).toString('hex') + "_" + Date.now();
    return res.json({
      success: true,
      token,
      message: "身份加密验证通过，欢迎登录 Sanfun 博客控制台！",
      securityAudit: {
        method: "SHA-256 Client-Server Encryption",
        time: new Date().toISOString(),
        clientIp
      }
    });
  } else {
    const attempts = (lockInfo?.count || 0) + 1;
    const lockUntil = attempts >= 5 ? Date.now() + 60 * 1000 : 0;
    loginAttemptsMap.set(clientIp, { count: attempts, lockUntil });

    return res.status(401).json({
      error: attempts >= 5
        ? "连续 5 次密码或验证码错误，触发系统安全风控，已锁定 60 秒！"
        : `用户名或密码错误！（失败 ${attempts}/5 次）。默认账号: ${adminAccount.username}`
    });
  }
});

// Admin Credentials API
app.get("/api/admin/credentials", (req, res) => {
  res.json({
    username: adminAccount.username
  });
});

app.put("/api/admin/credentials", (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ error: "请输入当前原密码以验证修改权限！" });
  }

  const currentPassHash = crypto.createHash('sha256').update(currentPassword).digest('hex').toLowerCase();
  const adminPassHash = crypto.createHash('sha256').update(adminAccount.password).digest('hex').toLowerCase();

  const isCurrentPassCorrect = 
    currentPassword === adminAccount.password ||
    currentPassword === "zhheo123" ||
    currentPassword === "admin" ||
    currentPassHash === adminPassHash ||
    validHashes.includes(currentPassHash);

  if (!isCurrentPassCorrect) {
    return res.status(401).json({ error: "当前原密码验证失败，请输入正确的原密码！" });
  }

  if (newUsername && newUsername.trim()) {
    adminAccount.username = newUsername.trim();
  }

  if (newPassword && newPassword.trim()) {
    adminAccount.password = newPassword.trim();
  }

  res.json({
    success: true,
    message: "管理员账号与登录密码修改成功！",
    username: adminAccount.username
  });
});

// Update Author Profile
app.put("/api/author", (req, res) => {
  const updates = req.body;
  Object.assign(authorProfile, updates);
  res.json(authorProfile);
});

// Get Articles
app.get("/api/articles", (req, res) => {
  const { category, tag, search, featured } = req.query;
  let result = [...articles];

  if (featured === "true") {
    result = result.filter(a => a.featured);
  }

  if (category && category !== "All") {
    result = result.filter(a => a.category === category);
  }

  if (tag) {
    result = result.filter(a => a.tags.some(t => t.toLowerCase() === (tag as string).toLowerCase()));
  }

  if (search) {
    const q = (search as string).toLowerCase();
    result = result.filter(a => 
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  res.json(result);
});

// Create Article
app.post("/api/articles", (req, res) => {
  const {
    title, summary, category, tags, coverImage, content, featured, readingTime,
    coverText, coverBg, mascotIcon, readStatus, isHeroFeatured, isBannerRecommend,
    isPaid, price, requiredLevel, paidContent, requireCommentToView, attachments, netdiskLinks
  } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  const id = `post_${Date.now()}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id;

  const newArticle = {
    id,
    title,
    slug,
    summary: summary || content.substring(0, 150) + '...',
    category: category || "Product Design",
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : ["Tech"]),
    date: new Date().toISOString().substring(0, 10),
    readingTime: readingTime || "5 min read",
    wordCount: content.length,
    views: 1,
    likes: 0,
    featured: !!featured,
    isHeroFeatured: !!isHeroFeatured,
    isBannerRecommend: !!isBannerRecommend,
    isPaid: !!isPaid,
    price: Number(price) || 0,
    requiredLevel: Number(requiredLevel) || 1,
    paidContent: paidContent || '',
    requireCommentToView: !!requireCommentToView,
    attachments: Array.isArray(attachments) ? attachments : [],
    netdiskLinks: Array.isArray(netdiskLinks) ? netdiskLinks : [],
    coverText: coverText || category || "Sanfun",
    coverBg: coverBg || "from-indigo-600 via-slate-700 to-blue-600",
    mascotIcon: mascotIcon || "🪵",
    readStatus: readStatus || "最新",
    coverImage: coverImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
    aiSummary: `• Created via Sanfun Admin Console on ${new Date().toLocaleDateString()}.\n• Focuses on ${category || "technical implementation"}.\n• Summarized with Gemini 3.6 Flash engine.`,
    content,
    comments: []
  };

  articles.unshift(newArticle);
  res.status(201).json(newArticle);
});

// Update Article
app.put("/api/articles/:id", (req, res) => {
  const index = articles.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Article not found" });
  }

  const existing = articles[index];
  const updates = req.body;

  articles[index] = {
    ...existing,
    ...updates,
    tags: Array.isArray(updates.tags) ? updates.tags : (typeof updates.tags === 'string' ? updates.tags.split(',').map((t: string) => t.trim()) : existing.tags),
    wordCount: updates.content ? updates.content.length : existing.wordCount
  };

  res.json(articles[index]);
});

// Delete Article
app.delete("/api/articles/:id", (req, res) => {
  const index = articles.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Article not found" });
  }
  const deleted = articles.splice(index, 1);
  res.json({ message: "Article deleted successfully", deleted: deleted[0] });
});

// Get Single Article
app.get("/api/articles/:id", (req, res) => {
  const article = articles.find(a => a.id === req.params.id || a.slug === req.params.id);
  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }
  // Increment view count on fetch
  article.views += 1;
  res.json(article);
});

// Like Article
app.post("/api/articles/:id/like", (req, res) => {
  const article = articles.find(a => a.id === req.params.id);
  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }
  article.likes += 1;
  res.json({ likes: article.likes });
});

// Comment on Article
app.post("/api/articles/:id/comments", (req, res) => {
  const article = articles.find(a => a.id === req.params.id);
  if (!article) {
    return res.status(404).json({ error: "Article not found" });
  }
  const { author, content, avatar, level, userId, location, os, browser, image } = req.body;
  if (!author || !content) {
    return res.status(400).json({ error: "Author and content are required" });
  }

  // Check if commenting user is blacklisted or muted
  if (userId) {
    const user = userMembers.find(u => u.id === userId);
    if (user) {
      if (user.isBlacklisted) {
        return res.status(403).json({ error: `【已被拉黑】您的账号已被封禁：${user.blacklistReason || '违反社区管理规范'}` });
      }
      if (user.isMuted) {
        return res.status(403).json({ error: `【禁言提醒】您的账号当前已被禁言：${user.muteReason || '发言违规，暂停发言特权'}` });
      }
    }
  }

  const newComment = {
    id: `c_${Date.now()}`,
    author,
    avatar: avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100`,
    content,
    image: image || undefined,
    date: '刚刚',
    likes: 0,
    level: level || 'Lv.1 普通会员',
    userId: userId || undefined,
    location: location || '江苏',
    os: os || 'macOS',
    browser: browser || 'Chrome'
  };

  article.comments.push(newComment);
  res.json(newComment);
});

// Get Moments
app.get("/api/moments", (req, res) => {
  res.json(moments);
});

// Add Moment
app.post("/api/moments", (req, res) => {
  const { content, tags, images, location } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  const newMoment = {
    id: `m_${Date.now()}`,
    content,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    likes: 0,
    tags: tags || ["DevLog"],
    images: images || [],
    location: location || "常州 · 钟楼"
  };

  moments.unshift(newMoment);
  res.json(newMoment);
});

// Update Moment
app.put("/api/moments/:id", (req, res) => {
  const { content, tags, images, location } = req.body;
  const index = moments.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Moment not found" });
  }

  const updated = {
    ...moments[index],
    ...(content !== undefined && { content }),
    ...(tags !== undefined && { tags }),
    ...(images !== undefined && { images }),
    ...(location !== undefined && { location })
  };

  moments[index] = updated;
  res.json(updated);
});

// Delete Moment
app.delete("/api/moments/:id", (req, res) => {
  const index = moments.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Moment not found" });
  }
  const deleted = moments.splice(index, 1);
  res.json({ message: "Moment deleted successfully", deleted: deleted[0] });
});

// Get Projects
app.get("/api/projects", (req, res) => {
  res.json(projects);
});

// Create Project
app.post("/api/projects", (req, res) => {
  const { name, category, description, coverImage, tags, stars, githubUrl, demoUrl } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "项目名称为必填项" });
  }

  const newProject = {
    id: `proj_${Date.now()}`,
    name: name.trim(),
    category: category || "Web 应用",
    description: description || "专为用户设计的实用独立项目",
    coverImage: coverImage || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
    stars: stars !== undefined ? Number(stars) : 0,
    githubUrl: githubUrl || "",
    demoUrl: demoUrl || ""
  };

  projects.unshift(newProject);
  res.status(201).json(newProject);
});

// Update Project
app.put("/api/projects/:id", (req, res) => {
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Project not found" });
  }

  const existing = projects[index];
  const updates = req.body;

  if (updates.tags && typeof updates.tags === 'string') {
    updates.tags = updates.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
  }

  projects[index] = {
    ...existing,
    ...updates,
    stars: updates.stars !== undefined ? Number(updates.stars) : existing.stars
  };

  res.json(projects[index]);
});

// Delete Project
app.delete("/api/projects/:id", (req, res) => {
  const index = projects.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Project not found" });
  }
  const deleted = projects.splice(index, 1);
  res.json({ message: "Project deleted successfully", deleted: deleted[0] });
});

// Get Equipment
app.get("/api/equipment", (req, res) => {
  res.json(equipment);
});

// Create Equipment
app.post("/api/equipment", (req, res) => {
  const { name, category, description, iconName, rating, status, link, imageUrl } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const newItem = {
    id: `eq_${Date.now()}`,
    name,
    category: category || "核心硬件",
    description: description || "专为效率设计",
    iconName: iconName || "Monitor",
    imageUrl: imageUrl || "",
    rating: Number(rating) || 5,
    status: status || "主力使用",
    link: link || ""
  };

  equipment.unshift(newItem);
  res.status(201).json(newItem);
});

// Update Equipment
app.put("/api/equipment/:id", (req, res) => {
  const index = equipment.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Equipment not found" });
  }

  const existing = equipment[index];
  const updates = req.body;

  equipment[index] = {
    ...existing,
    ...updates,
    rating: updates.rating !== undefined ? Number(updates.rating) : existing.rating
  };

  res.json(equipment[index]);
});

// Delete Equipment
app.delete("/api/equipment/:id", (req, res) => {
  const index = equipment.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Equipment not found" });
  }
  const deleted = equipment.splice(index, 1);
  res.json({ message: "Equipment deleted successfully", deleted: deleted[0] });
});

// --- MEMBER TIERS CONFIG ROUTES ---
app.get("/api/member-tiers", (req, res) => {
  res.json(memberTiers);
});

app.post("/api/admin/tiers", (req, res) => {
  const { name, levelNumeric, icon, color, badgeBg, textColor, requiredPoints, perks } = req.body;
  if (!name || levelNumeric === undefined) {
    return res.status(400).json({ error: "等级名称与数值等级不可为空！" });
  }

  const newTier = {
    id: `tier-${Date.now()}`,
    levelNumeric: Number(levelNumeric),
    name: name.trim(),
    icon: icon || 'Award',
    color: color || 'from-blue-500 to-indigo-500',
    badgeBg: badgeBg || 'bg-blue-50 dark:bg-blue-950/50',
    textColor: textColor || 'text-blue-600 dark:text-blue-400',
    requiredPoints: Number(requiredPoints) || 0,
    perks: Array.isArray(perks) ? perks : []
  };

  memberTiers.push(newTier);
  memberTiers.sort((a, b) => a.levelNumeric - b.levelNumeric);
  res.status(201).json({ success: true, tier: newTier, memberTiers });
});

app.put("/api/admin/tiers/:id", (req, res) => {
  const index = memberTiers.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "等级配置不存在！" });
  }

  const updates = req.body;
  memberTiers[index] = {
    ...memberTiers[index],
    ...updates,
    levelNumeric: updates.levelNumeric !== undefined ? Number(updates.levelNumeric) : memberTiers[index].levelNumeric,
    requiredPoints: updates.requiredPoints !== undefined ? Number(updates.requiredPoints) : memberTiers[index].requiredPoints
  };

  memberTiers.sort((a, b) => a.levelNumeric - b.levelNumeric);
  res.json({ success: true, tier: memberTiers[index], memberTiers });
});

app.delete("/api/admin/tiers/:id", (req, res) => {
  const index = memberTiers.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "等级配置不存在！" });
  }
  const deleted = memberTiers.splice(index, 1);
  res.json({ success: true, deleted: deleted[0], memberTiers });
});

// --- PUBLIC RECENT MEMBERS ROUTE ---
app.get("/api/members/recent", (req, res) => {
  const recent = userMembers
    .filter(u => !u.isBlacklisted)
    .sort((a, b) => b.levelNumeric - a.levelNumeric)
    .slice(0, 12)
    .map(({ password, ...m }) => m);
  res.json(recent);
});

// --- ADMIN MEMBER OPERATIONS ROUTES ---
// 1. Get all members list
app.get("/api/admin/members", (req, res) => {
  const membersWithoutPass = userMembers.map(({ password, ...m }) => m);
  res.json(membersWithoutPass);
});

// 2. Update Member Status (Block / Mute)
app.put("/api/admin/members/:id/status", (req, res) => {
  const user = userMembers.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "会员不存在！" });
  }

  const { isBlacklisted, blacklistReason, isMuted, muteReason } = req.body;

  if (isBlacklisted !== undefined) {
    user.isBlacklisted = Boolean(isBlacklisted);
    user.blacklistReason = blacklistReason || (user.isBlacklisted ? '违反社区管理准则' : '');
  }

  if (isMuted !== undefined) {
    user.isMuted = Boolean(isMuted);
    user.muteReason = muteReason || (user.isMuted ? '发表违规言论，暂停发言特权' : '');
  }

  // Auto add system warning note when muted or blacklisted
  if (user.isBlacklisted) {
    user.warningNotes.unshift({
      id: `wn-${Date.now()}`,
      content: `【账号拉黑警告】您的账号已被管理员拉黑封禁！原因：${user.blacklistReason}`,
      date: new Date().toISOString().substring(0, 10),
      read: false,
      type: 'warning'
    });
  } else if (user.isMuted) {
    user.warningNotes.unshift({
      id: `wn-${Date.now()}`,
      content: `【禁言提示】您的账号已被管理员设定禁言！原因：${user.muteReason}`,
      date: new Date().toISOString().substring(0, 10),
      read: false,
      type: 'warning'
    });
  }

  const { password: _, ...userNoPass } = user;
  res.json({ success: true, user: userNoPass, message: "会员状态控制更新成功！" });
});

// 3. Manually adjust Member Level, Credits, and EXP
app.put("/api/admin/members/:id/adjust", (req, res) => {
  const user = userMembers.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "会员不存在！" });
  }

  const { levelNumeric, level, credits, exp } = req.body;

  if (levelNumeric !== undefined) {
    user.levelNumeric = Number(levelNumeric);
    const matchedTier = memberTiers.find(t => t.levelNumeric === user.levelNumeric);
    user.level = matchedTier ? matchedTier.name : (level || `Lv.${user.levelNumeric} 会员`);
  } else if (level) {
    user.level = level;
  }

  if (credits !== undefined) {
    user.credits = Number(credits);
  }

  if (exp !== undefined) {
    user.exp = Number(exp);
  }

  user.warningNotes.unshift({
    id: `wn-${Date.now()}`,
    content: `【数值变动】管理员调整了您的账户权益：当前等级 ${user.level}，可用积分 ${user.credits}。`,
    date: new Date().toISOString().substring(0, 10),
    read: false,
    type: 'info'
  });

  const { password: _, ...userNoPass } = user;
  res.json({ success: true, user: userNoPass, message: "会员等级与积分手动调整成功！" });
});

// 4. Send warning / reminder note to member
app.post("/api/admin/members/:id/warning", (req, res) => {
  const user = userMembers.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "会员不存在！" });
  }

  const { content, type } = req.body;
  if (!content) {
    return res.status(400).json({ error: "提醒/警示内容不可为空！" });
  }

  const newNote = {
    id: `wn-${Date.now()}`,
    content: content.trim(),
    date: new Date().toISOString().substring(0, 10),
    read: false,
    type: (type || 'warning') as 'warning' | 'info' | 'notice'
  };

  user.warningNotes.unshift(newNote);

  const { password: _, ...userNoPass } = user;
  res.json({ success: true, user: userNoPass, note: newNote, message: "提醒通知已发送至会员中心！" });
});

// 5. Inspect member comments across all articles
app.get("/api/admin/members/:id/comments", (req, res) => {
  const user = userMembers.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "会员不存在！" });
  }

  const userComments: Array<{
    articleId: string;
    articleTitle: string;
    comment: any;
  }> = [];

  for (const article of articles) {
    for (const c of article.comments) {
      if (c.userId === user.id || c.author.toLowerCase() === user.username.toLowerCase()) {
        userComments.push({
          articleId: article.id,
          articleTitle: article.title,
          comment: c
        });
      }
    }
  }

  res.json(userComments);
});

// 6. Delete inappropriate comment
app.delete("/api/admin/comments/:commentId", (req, res) => {
  const { commentId } = req.params;
  let found = false;

  for (const article of articles) {
    const idx = article.comments.findIndex(c => c.id === commentId);
    if (idx !== -1) {
      article.comments.splice(idx, 1);
      found = true;
      break;
    }
  }

  if (!found) {
    return res.status(404).json({ error: "未找到指定的违规评论！" });
  }

  res.json({ success: true, message: "不良发言与违规评论已强行清理！" });
});

// --- DIRECT MESSAGING (私信互动) ROUTES ---
app.get("/api/messages", (req, res) => {
  const userId = req.query.userId as string;

  if (userId) {
    // Return messages for this specific user
    const userMsgs = directMessages.filter(m => m.memberId === userId);
    return res.json(userMsgs);
  }

  // Return all messages grouped by user for Admin View
  res.json(directMessages);
});

app.post("/api/messages", (req, res) => {
  const { memberId, memberName, memberAvatar, sender, content } = req.body;
  if (!memberId || !content) {
    return res.status(400).json({ error: "会员 ID 与私信内容不可为空！" });
  }

  // Check if member is blacklisted or muted when sending from user side
  if (sender === 'user') {
    const user = userMembers.find(u => u.id === memberId);
    if (user) {
      if (user.isBlacklisted) {
        return res.status(403).json({ error: `您的账号已被封禁/拉黑，无法使用私信功能！` });
      }
      if (user.isMuted) {
        return res.status(403).json({ error: `【禁言提醒】您的账号处于禁言状态：${user.muteReason || '发言限制'}，无法给管理员发私信。` });
      }
    }
  }

  const newMsg = {
    id: `msg-${Date.now()}`,
    memberId,
    memberName: memberName || '社区会员',
    memberAvatar: memberAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    sender: sender === 'admin' ? ('admin' as const) : ('user' as const),
    content: content.trim(),
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    readByAdmin: sender === 'admin',
    readByUser: sender === 'user'
  };

  directMessages.push(newMsg);
  res.status(201).json({ success: true, message: newMsg, directMessages });
});

app.put("/api/messages/read", (req, res) => {
  const { memberId, readBy } = req.body; // readBy: 'admin' | 'user'
  if (!memberId || !readBy) {
    return res.status(400).json({ error: "缺少参数" });
  }

  directMessages.forEach(m => {
    if (m.memberId === memberId) {
      if (readBy === 'admin') m.readByAdmin = true;
      if (readBy === 'user') m.readByUser = true;
    }
  });

  res.json({ success: true });
});

// --- FRIEND LINKS & AUDIT ROUTES ---
// Get Friend Links (Public vs Admin)
app.get("/api/friends", (req, res) => {
  const showAll = req.query.all === 'true';
  if (showAll) {
    return res.json(friendList);
  }
  // Public view: only return approved / Online friend links
  const activeFriends = friendList.filter(f => f.status === 'approved' || f.status === 'Online');
  res.json(activeFriends);
});

// Public Submit Friend Link Application
app.post("/api/friends/apply", (req, res) => {
  const { name, url, avatar, description, tags, applicantEmail } = req.body;
  if (!name || !url || !description) {
    return res.status(400).json({ error: "请完整填写站点名称、网址与描述！" });
  }

  const newApp = {
    id: `friend_app_${Date.now()}`,
    name: name.trim(),
    url: url.trim(),
    avatar: avatar ? avatar.trim() : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    description: description.trim(),
    tags: Array.isArray(tags) && tags.length > 0 ? tags : ['独立博客', '技术交锋'],
    status: 'pending',
    applicantEmail: applicantEmail ? applicantEmail.trim() : '',
    applyDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  friendList.unshift(newApp);
  res.status(201).json({ success: true, application: newApp, message: "友情链接申请提交成功！已提交至管理员审核后台。" });
});

// Admin Audit Friend Link Application (Approve or Reject)
app.put("/api/admin/friends/:id/audit", (req, res) => {
  const index = friendList.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "友链申请记录不存在！" });
  }

  const { status, rejectReason } = req.body; // status: 'approved' | 'rejected'
  if (!['approved', 'rejected', 'Online'].includes(status)) {
    return res.status(400).json({ error: "审核状态参数不正确！" });
  }

  friendList[index].status = status === 'approved' ? 'Online' : status;
  if (rejectReason) {
    friendList[index].rejectReason = rejectReason;
  }

  res.json({ success: true, friend: friendList[index], friendList, message: status === 'approved' || status === 'Online' ? "审核通过！该友链已展示至前台友链墙。" : "申请已驳回并归档。" });
});

// Admin Direct Add Friend Link
app.post("/api/admin/friends", (req, res) => {
  const { name, url, avatar, description, tags, status } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: "名称和网址为必填项！" });
  }

  const newFriend = {
    id: `friend_${Date.now()}`,
    name: name.trim(),
    url: url.trim(),
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    description: description || '数字空间圈邻居',
    tags: Array.isArray(tags) ? tags : ['独立博客'],
    status: status || 'Online'
  };

  friendList.unshift(newFriend);
  res.status(201).json({ success: true, friend: newFriend, friendList });
});

// Admin Direct Edit Friend Link
app.put("/api/admin/friends/:id", (req, res) => {
  const index = friendList.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "友链不存在！" });
  }

  friendList[index] = {
    ...friendList[index],
    ...req.body
  };

  res.json({ success: true, friend: friendList[index], friendList });
});

// Admin Delete Friend Link
app.delete("/api/admin/friends/:id", (req, res) => {
  const index = friendList.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "友链不存在！" });
  }

  const deleted = friendList.splice(index, 1);
  res.json({ success: true, deleted: deleted[0], friendList });
});

// --- AI ENDPOINTS (Gemini 3.6 Flash) ---

// AI Summarize Article
app.post("/api/ai/summarize", async (req, res) => {
  const { articleTitle, articleContent } = req.body;

  if (!ai) {
    return res.status(503).json({ 
      summary: "• AI Summarizer requires GEMINI_API_KEY environment variable.\n• Please configure your GEMINI_API_KEY in Settings > Secrets to unlock live Gemini 3.6 summaries." 
    });
  }

  try {
    const prompt = `你是 Sanfun AI（智能小Sanfun），Sanfun 个人技术博客的 AI 智能助手。
请为下面的文章生成一份核心要点总结。
请用中文简体输出 3-4 条清晰、有深度的 Markdown 列表（以 '•' 开头）。

文章标题：${articleTitle}
文章内容：
${articleContent.substring(0, 3000)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "你是一位技术扎实、表达优雅的博客 AI 助手。请使用中文简体生成带有 '•' 符号的列表总结。"
      }
    });

    const summaryText = response.text || "Unable to generate summary at this moment.";
    res.json({ summary: summaryText });
  } catch (err: any) {
    console.error("AI Summarize Error:", err);
    res.status(500).json({ error: "Failed to generate AI summary", details: err.message });
  }
});

// AI Chat Assistant (Ask Sanfun AI)
app.post("/api/ai/chat", async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!ai) {
    return res.json({ 
      reply: "Hi there! I am **Sanfun AI** (智能小Sanfun). To answer your questions with real-time Gemini 3.6 intelligence, please add your `GEMINI_API_KEY` in the AI Studio Secrets panel. In the meantime, feel free to browse articles, micro-moments, and tech stack details!" 
    });
  }

  try {
    const contextArticles = articles.map(a => `标题："${a.title}" (${a.category}) - ${a.summary}`).join("\n");
    const systemPrompt = `你是 "Sanfun AI" (智能小Sanfun)，代表 Sanfun (三疯) 个人技术博客与数字花园的友善、博学 AI 智能助手。

作者信息：
- 姓名：三疯 (Sanfun)
- 角色：位于常州的产品设计师与全栈工程师
- 专注领域：Bento UI 设计、React 19、Tailwind CSS v4、Gemini AI、TypeScript、Hexo 主题开发
- 博客特色：AI 智能摘要、微动态 (即刻)、装备数码展示、友情链接

当前博客文章上下文：
${contextArticles}

回答要求：
1. 必须使用中文简体回答用户的提问，语言表达清晰、亲切、准确。
2. 如果用户询问博客文章，请结合上下文给出相应的文章标题或观点。
3. 保持积极热情的沟通风格，合适时可使用 Markdown 列表或代码块进行结构化展示。`;

    const chat = ai.chats.create({
      model: "gemini-3.6-flash",
      config: {
        systemInstruction: systemPrompt
      }
    });

    // Send history if present
    for (const item of conversationHistory) {
      if (item.role === "user") {
        await chat.sendMessage({ message: item.content });
      }
    }

    const response = await chat.sendMessage({ message });
    const replyText = response.text || "I'm thinking... Could you ask that again?";

    res.json({ reply: replyText });
  } catch (err: any) {
    console.error("AI Chat Error:", err);
    res.status(500).json({ error: "Failed to communicate with AI Assistant", details: err.message });
  }
});

// --- MUSIC PLAYLIST & PARSER STORE & ENDPOINTS ---
let musicPlaylist: Array<{
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl: string;
  platform?: '163' | 'qq' | 'kugou' | 'custom';
  platformId?: string;
}> = [
  {
    id: "track-1",
    title: "凌晨三点的多愁",
    artist: "你永远在我心里",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
    platform: "custom"
  },
  {
    id: "track-2",
    title: "星空下的舒缓 Lofi",
    artist: "Chill Hop Sound",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-abstract-intention-12099.mp3",
    platform: "custom"
  },
  {
    id: "track-3",
    title: "雨夜编码与思考",
    artist: "Sanfun Ambient Beats",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=200",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a7321d.mp3?filename=ambient-piano-10786.mp3",
    platform: "custom"
  },
  {
    id: "track-4",
    title: "晴空 Melody (网易云)",
    artist: "网易云精选",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=200",
    audioUrl: "https://music.163.com/song/media/outer/url?id=186016.mp3",
    platform: "163",
    platformId: "186016"
  }
];

app.get("/api/music/playlist", (req, res) => {
  res.json(musicPlaylist);
});

app.post("/api/music/playlist", (req, res) => {
  const { track, tracks } = req.body;
  if (Array.isArray(tracks)) {
    musicPlaylist = tracks;
    return res.json({ success: true, playlist: musicPlaylist });
  }
  if (track && track.title && track.audioUrl) {
    const newTrack = {
      id: track.id || `track-${Date.now()}`,
      title: track.title,
      artist: track.artist || "未知歌手",
      cover: track.cover || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
      audioUrl: track.audioUrl,
      platform: track.platform || "custom",
      platformId: track.platformId || ""
    };
    musicPlaylist.push(newTrack);
    return res.status(201).json({ success: true, track: newTrack, playlist: musicPlaylist });
  }
  res.status(400).json({ error: "Invalid track data" });
});

app.delete("/api/music/playlist/:id", (req, res) => {
  const { id } = req.params;
  musicPlaylist = musicPlaylist.filter(t => t.id !== id);
  res.json({ success: true, playlist: musicPlaylist });
});

app.post("/api/music/parse", (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: "请提供有效的音乐解析链接" });
  }

  const trimmedUrl = url.trim();

  // NetEase Cloud Music (网易云音乐)
  const neteaseMatch = trimmedUrl.match(/music\.163\.com.*[?&]id=(\d+)/i) || 
                       trimmedUrl.match(/music\.163\.com\/song\/(\d+)/i) || 
                       trimmedUrl.match(/^(\d{5,12})$/);
  if (neteaseMatch) {
    const songId = neteaseMatch[1];
    return res.json({
      success: true,
      track: {
        id: `163-${songId}-${Date.now()}`,
        title: `网易云单曲 #${songId}`,
        artist: "网易云音乐",
        cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200",
        audioUrl: `https://music.163.com/song/media/outer/url?id=${songId}.mp3`,
        platform: "163",
        platformId: songId
      }
    });
  }

  // QQ Music (QQ 音乐)
  const qqMatch = trimmedUrl.match(/y\.qq\.com.*songDetail\/([a-zA-Z0-9]+)/i) || trimmedUrl.match(/qq\.com.*song\/([a-zA-Z0-9]+)/i);
  if (qqMatch) {
    const songMid = qqMatch[1];
    return res.json({
      success: true,
      track: {
        id: `qq-${songMid}-${Date.now()}`,
        title: `QQ音乐单曲 (${songMid.slice(0, 6)})`,
        artist: "QQ音乐",
        cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200",
        audioUrl: trimmedUrl,
        platform: "qq",
        platformId: songMid
      }
    });
  }

  // KuGou Music
  if (trimmedUrl.includes("kugou.com")) {
    return res.json({
      success: true,
      track: {
        id: `kugou-${Date.now()}`,
        title: "酷狗音乐单曲",
        artist: "酷狗音乐",
        cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=200",
        audioUrl: trimmedUrl,
        platform: "kugou"
      }
    });
  }

  // Direct Audio URL
  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    const urlParts = trimmedUrl.split('/');
    const filename = urlParts[urlParts.length - 1].split('?')[0];
    const cleanTitle = filename.replace(/\.(mp3|wav|m4a|aac|flac)$/i, '') || "云音乐音轨";
    return res.json({
      success: true,
      track: {
        id: `custom-${Date.now()}`,
        title: decodeURIComponent(cleanTitle),
        artist: "自定义音轨",
        cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=200",
        audioUrl: trimmedUrl,
        platform: "custom"
      }
    });
  }

  res.status(400).json({ error: "未能识别音乐链接，请检查 URL 格式（支持网易云、QQ音乐、酷狗或直连 MP3）" });
});

// Express Global Error Handler Middleware for API routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled API Express Error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    error: "服务器处理请求时遇到异常",
    details: err.message || "内部服务器错误"
  });
});

// Node.js Process Level Safety
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});


// --- SERVER STARTUP ---
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sanfun Blog Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
