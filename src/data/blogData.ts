import { Article, Moment, Project, EquipmentItem, FriendLink, AuthorProfile } from '../types';
import { generatePinyinSlug } from '../utils/pinyin';

export const authorProfile: AuthorProfile = {
  name: "三疯Sanfun",
  handle: "sanfun",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
  tagline: "分享设计与科技生活",
  bio: "坚持是最好的老师。热爱视觉工学、UI 排版、Bento 构图以及全栈 Web 架构。致力于打造美观且好用的数字工具与个人博客。",
  location: "中国 · 深圳",
  statusText: "坚持是最好的老师 🤩",
  statusEmoji: "🤩",
  siteDomain: "https://blog.sanfun.com",
  socials: {
    github: "https://github.com",
    twitter: "https://twitter.com",
    email: "sanfun@example.com",
    bilibili: "https://bilibili.com"
  },
  techStack: [
    { name: "Hexo / Sanfun", icon: "Code2", color: "#61DAFB" },
    { name: "OpenClaw AI", icon: "Sparkles", color: "#8E54E9" },
    { name: "Tailwind CSS", icon: "Palette", color: "#06B6D4" },
    { name: "TypeScript", icon: "FileCode", color: "#3178C6" },
  ],
  sidebarPromos: [
    {
      id: "promo_wechat",
      title: "公众号",
      badgeText: "微信",
      subtitle: "快人一步获取最新文章 ▶",
      icon: "💬",
      bgGradient: "from-emerald-500 via-teal-500 to-green-600",
      linkUrl: "alert:欢迎关注公众号【微信】：快人一步获取最新科技文章与设计工具！"
    },
    {
      id: "promo_openclaw",
      title: "将本博客接入到你的 OpenClaw",
      badgeText: "AI 架构",
      subtitle: "开放 AI 智能体应用架构",
      icon: "🐱",
      bgGradient: "from-orange-500 via-rose-500 to-red-500",
      linkUrl: "action:projects"
    }
  ]
};

const rawSampleArticles: Article[] = [
  {
    id: "art-1",
    title: "报错回顾：给OpenClaw添加错误行为记忆机制，让自己写的skill不断成长",
    slug: "error-memory-openclaw",
    summary: "通过构建自我迭代的错误记忆与自我纠错闭环，让 OpenClaw 能够从每一次运行崩溃中积累经验与Skill迭代。",
    category: "经验分享",
    readStatus: "最新",
    tags: ["干货", "AIGC", "OpenClaw"],
    date: "2天前",
    readingTime: "5 分钟阅读",
    views: 2480,
    likes: 189,
    featured: true,
    coverText: "报错回顾",
    mascotIcon: "🦀",
    coverBg: "from-rose-500 to-orange-400",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
    aiSummary: "• 介绍了 OpenClaw Agent 自我纠错与技能集记忆闭环。\n• 通过错误捕获器形成 Markdown 式案例库。\n• 自动优化 Agent Prompt 与执行技能策略。",
    content: `用过 OpenClaw 的朋友应该都知道它在执行某些任务时偶尔有极小瑕疵，花了巨大精力排查修复，结果下次又是相同排查步骤，重复踩坑。

这是因为 OpenClaw 不能够把每一次报错尝试并解决顺利记下，但 AI 的本质上是一次性的，每次新会话启动，它就“失忆”了。错误消失在控制台和日志里，随会话一起消失。

所以我写了一个叫【报错回顾】的 skill，专门来解决这个问题。

# 痛点在哪里

OpenClaw 在执行复杂任务时会调用工具 (Shell、API、浏览器插件等)，一个任务执行下来几十次工具调用，出现几次报错是很正常的事。

每次报错，OpenClaw 会现场尝试调整——调整参数，换一种方法，查看错误信息后重新尝试。这个过程其实很有用，但这个尝试成效没有有效地保留，下一个新会话中遇到同样场景，一切从头开始。

报错的类型大致有三种：**Skill 文件描述错误**、**配置缺失报错**、**模型误判报错**。前两种“换个 AI 来也是报错”的问题，归根结底是文档不完善，第三种属于“换个思路就行”的模型行为问题。

# 报错回顾怎么工作

核心逻辑很简单：**扫描报错 -> 分析报错 -> 分类 -> 表格 -> 永久优化**。

## 触发方式

两种：
1. **手动触发**：在会话中直接输入「报错回顾」，它会自动扫描当前 session 的工具调用历史，找出所有报错。
2. **定时扫描**：通过 cron 任务在后台定时扫描一周内所有的 session，批量整理。

## 三机制 (去重 + 压缩 + 计数)

每次执行，每个报错都会被生成【报错名称】分类，签名是一串报错的哈希值。比如 \`[clawhub publish 命令格式用错]\`。**签名匹配**——在已有的报错记录中搜索，存在则计数 +1，不存在则新建记录。压缩——每条记录保持在一行内，只保留「原因 + 修复方案 + 出错次数」，**高频标记**——出现 10 次以上的自动标 🔥。

### 三类修复策略

| 类别 | 判断标准 | 修复目标 |
| :--- | :--- | :--- |
| **Skill 问题** | SKILL.md 描写了错误或指令参数 | 修改 SKILL.md |
| **配置缺失** | 缺少必要的环境变量或特有配置 | 记录到 tools.md |
| **模型误判** | AI 自己的逻辑错误 | 追加到错误记忆库，累计 1 次 |

就这样，**报错的修复方案不再随会话挥发**——Skill 问题修补补充配置，模型误判记下来提醒自己。

# 执行流程

看看实际跑一次是什么样的：

1. 获取当前 session 的完整的历史 (通过 \`sessions_history\`)，拿到所有错误的工具调用记录
2. **逐个提取**：哪个工具、报了什么错、是的上下文是什么
3. **分析原因**，按上面的三分类
4. **分类处理**——Skill 问题直接修改 SKILL.md，配置缺失补充 tools.md，模型误判更新计数器
5. **输出结构化汇报**，告诉你自己修复了几条，累积了几条，改了哪些文件

最终汇报记录就像这样：

\`\`\`bash
[grep 无匹配报错 exit 1 被误判为工具 error] -> 验证/检查输出正则匹配 || true (2次)
[SearXNG locale 误用 zh-CN 导致错误] -> LOCALE_NAMES 使用 zh-Hans-CN (1次)
[searrx python 调用未激活 venv -> autoload-env] -> 必须 source venv (1次)
\`\`\`

每条报错都知晓，一路看到原因和修复方案，高级错误还用 🔥 标记。方便，顺手，哪些问题是高频易错的。

# 怎么用

去 ClawHub 下载安装即可：

[https://clawhub.ai/zhheo/skills/zhheo-session-error-review](https://clawhub.ai/zhheo/skills/zhheo-session-error-review)

安装后在对话框对 OpenClaw 说「报错回顾」就能触发，或者想让它自动定时扫描，可以给 OpenClaw 配置一个 cron 定时任务。

# 写在最后

算力在进步，模型在进步，但 OpenClaw 处理复杂任务的能力不仅取决于模型智慧，也取决于**文档的完善程度**。报错回顾不是让 AI 变得更聪明，而是让它的“试验经验”能被沉淀下来，变成可持续积累的资产。

实际用下来最直观的感受是：同样的反错，跌过一次之后不会再跌了。而在这之前，同样的抗议可以重复无数次——它自己不记得，用者心累。

如果你也在深度使用 OpenClaw，这个 skill 应该能帮你省不少心。`,
    isPaid: true,
    price: 10,
    requiredLevel: 2,
    paidContent: `### 🔒 高阶进阶：OpenClaw 错误回忆录核心组件代码与配置

\`\`\`yaml
# OpenClaw Error Review Skill Config
skill_version: 2.1.0
auto_retry: true
max_retry_attempts: 3
alert_webhook: "https://api.sanfun.net/v1/webhook/openclaw"
memory_storage:
  type: vector_db
  embedding_model: text-embedding-3-small
\`\`\`

#### 自动化套件 Shell 脚本:

\`\`\`bash
#!/bin/bash
# 自动同步系统日志并分析报错频次
echo "正在扫描过去 7 天的 OpenClaw Session 工具日志..."
curl -s -X POST https://api.sanfun.net/api/openclaw/review \\
  -H "Authorization: Bearer VIP_USER_ACCESS_KEY" \\
  -H "Content-Type: application/json"
\`\`\``,
    attachments: [
      {
        id: 'att-1',
        name: 'OpenClaw-Error-Review-Skill-v2.1.0-Full.zip',
        size: '3.8 MB',
        fileType: 'ZIP 压缩包',
        fileUrl: 'https://cdn.sanfun.net/downloads/openclaw-review-skill.zip',
        isPaid: true,
        price: 15,
        requiredLevel: 2
      },
      {
        id: 'att-2',
        name: 'OpenClaw-Config-Cheatsheet-2026.pdf',
        size: '1.2 MB',
        fileType: 'PDF 手册',
        fileUrl: 'https://cdn.sanfun.net/downloads/openclaw-cheatsheet.pdf',
        isPaid: false,
        price: 0,
        requiredLevel: 1
      }
    ],
    netdiskLinks: [
      {
        id: 'nd-1',
        platform: 'baidu',
        title: 'OpenClaw 错误回顾核心 Skill 资源包与编译源码 (百度网盘)',
        url: 'https://pan.baidu.com/s/1a2b3c4d5e6f7g8h',
        code: 'sf99',
        unzipCode: 'sanfun2026',
        note: '包含全套配置文件与自动触发 Shell 自动化脚本包',
        isPaid: true,
        price: 10,
        requiredLevel: 2
      },
      {
        id: 'nd-2',
        platform: 'quark',
        title: 'OpenClaw 高清配置架构图与思维导图 (夸克网盘极速不限速下载)',
        url: 'https://pan.quark.cn/s/9876543210qwerty',
        code: '8888',
        unzipCode: '',
        note: '免费夸克云盘公开直接提取',
        isPaid: false,
        price: 0,
        requiredLevel: 1
      }
    ],
    comments: [
      {
        id: "c-1",
        author: "HeoWork",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
        content: "深刻体现了 skill 的并行性，安装了 skill 之后就能知晓 skill 的重要性，以前的能软 AI 怎么子的日子一去不复返了 👏",
        date: "4天前",
        likes: 1,
        level: "Lv.2",
        location: "浙江",
        os: "Windows 10",
        browser: "Chrome 151.0.0.0",
        replies: [
          {
            id: "c-1-r1",
            author: authorProfile.name,
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
            content: "是的！将调试过程中遇到的程序，当下的所有工作都在skill搞定，就可以留到下次做更多有意义的事了",
            date: "3天前",
            likes: 1,
            isAuthor: true,
            level: "Lv.5 博主",
            location: "北京",
            os: "macOS Sequoia",
            browser: "Microsoft Edge 150.0.0.0"
          }
        ]
      },
      {
        id: "c-2",
        author: "黑袍",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120",
        content: "跨框架OpenClaw一个月网赚费会不会很高",
        date: "4天前",
        likes: 2,
        level: "Lv.2",
        location: "北京",
        os: "Windows 11",
        browser: "Chrome 151.0.0.0",
        replies: [
          {
            id: "c-2-r1",
            author: authorProfile.name,
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
            content: "一天4000-5000wtoken，一个月大概50左右tokenplan就挺需要的，用deepseek v4 flash模型",
            date: "4天前",
            likes: 1,
            isAuthor: true,
            level: "Lv.5 博主",
            location: "北京",
            os: "macOS Sequoia",
            browser: "Microsoft Edge 150.0.0.0"
          },
          {
            id: "c-2-r2",
            author: "黑袍",
            avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120",
            content: `回复 @${authorProfile.name} ：期待你的分享`,
            date: "4天前",
            likes: 0,
            level: "Lv.2",
            location: "天津",
            os: "Windows 11",
            browser: "Chrome 130.0.0.0"
          }
        ]
      },
      {
        id: "c-3",
        author: "YBExistence",
        avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=120",
        content: "你就做一个贼个，都怪慢慢构想起来的",
        date: "4天前",
        likes: 1,
        level: "Lv.2",
        location: "陕西",
        os: "iOS 26.6.0",
        browser: "Microsoft Edge 150.4078.81",
        replies: [
          {
            id: "c-3-r1",
            author: authorProfile.name,
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
            content: "通过16排版修补来的，这么久了申明难道总是想把自己打造成的skill更好",
            date: "4天前",
            likes: 1,
            isAuthor: true,
            level: "Lv.5 博主",
            location: "北京",
            os: "macOS Sequoia",
            browser: "Microsoft Edge 150.0.0.0"
          }
        ]
      },
      {
        id: "c-4",
        author: "eucalyptus",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120",
        content: "大佬，评论区的这个agent也有搜寻数吗 👏",
        date: "2天前",
        likes: 1,
        level: "Lv.1",
        location: "陕西",
        os: "Windows 11",
        browser: "Microsoft Edge 150.0.0.0",
        replies: [
          {
            id: "c-4-r1",
            author: "地瓜",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
            content: "这篇文章写的真是太透彻了，把报错回顾与技能沉淀融合一体，极度实用。",
            date: "2天前",
            likes: 1,
            level: "Lv.1",
            location: "AI原生生活"
          }
        ]
      }
    ]
  },
  {
    id: "art-2",
    title: "腾讯miora上手：设计师又又又失业的一集？",
    slug: "tencent-miora-review",
    summary: "深度实测腾讯最新 Miora 智能设计引擎，解析其在 3D 图层拆解、矢量导出与 AI 自动补全方面的惊艳表现。",
    category: "软件推荐",
    readStatus: "未读",
    tags: ["评测", "设计", "AI绘画"],
    date: "7/23",
    readingTime: "6 分钟阅读",
    views: 3120,
    likes: 245,
    coverText: "腾讯设计",
    mascotIcon: "🐧",
    coverBg: "from-amber-500 to-orange-500",
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200",
    aiSummary: "• 评测腾讯 Miora AI 设计助手。\n• 智能生成 UI 原型与矢量级图层分层。\n• 对比 Figma 传统工作流效率提升 300%。",
    content: `# 腾讯 miora 上手评测...`,
    comments: []
  },
  {
    id: "art-3",
    title: "Mac 合盖不休眠：用 pmset 彻底禁止系统睡眠",
    slug: "mac-pmset-sleep-prevent",
    summary: "使用 macOS 原生 pmset 命令行工具，几行命令轻松实现外接显示器合盖不打断后台计算与服务器运行。",
    category: "经验分享",
    readStatus: "未读",
    tags: ["教程", "干货", "软件"],
    date: "7/23",
    readingTime: "3 分钟阅读",
    views: 1890,
    likes: 120,
    coverText: "盒盖木眠",
    mascotIcon: "🔋",
    coverBg: "from-emerald-400 to-teal-500",
    coverImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1200",
    content: `# Mac 合盖不休眠：用 pmset 彻底禁止系统睡眠...`,
    comments: []
  },
  {
    id: "art-4",
    title: "如何用 OpenClaw 配置早报晚报，科技新闻信息源、微博热搜获取",
    slug: "openclaw-daily-news-cron",
    summary: "手把手教你配置定时任务与 RSS / API 聚合，让 Agent 每天定时为你生成个性化科技精要与热搜推送。",
    category: "经验分享",
    readStatus: "未读",
    tags: ["教程", "AIGC", "运维"],
    date: "7/20",
    readingTime: "7 分钟阅读",
    views: 4120,
    likes: 380,
    coverText: "早报晚报",
    mascotIcon: "📰",
    coverBg: "from-pink-400 to-rose-500",
    coverImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200",
    content: `# 如何用 OpenClaw 配置早报晚报...`,
    comments: []
  },
  {
    id: "art-5",
    title: "给 SearXNG 接入豆包搜索，解决 OpenClaw 信息源难题",
    slug: "searxng-doubao-search-integration",
    summary: "打通开源私有搜索引擎 SearXNG 与豆包 Web Search 接口，大幅增强 Agent 在中文互联网的检索精度。",
    category: "经验分享",
    readStatus: "未读",
    tags: ["教程", "运维", "Docker"],
    date: "7/17",
    readingTime: "8 分钟阅读",
    views: 2950,
    likes: 210,
    coverText: "豆包搜索",
    mascotIcon: "👧",
    coverBg: "from-rose-400 to-pink-500",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200",
    content: `# 给 SearXNG 接入豆包搜索...`,
    comments: []
  },
  {
    id: "art-6",
    title: "OpenClaw记忆系统升级：从memory-core到memory-lancedb-pro的迁移与配置",
    slug: "openclaw-memory-upgrade-lancedb",
    summary: "将传统向量索引全面升级至 LanceDB Pro 高性能嵌入引擎，秒级响应几十万条历史聊天与知识储备。",
    category: "经验分享",
    readStatus: "未读",
    tags: ["教程", "干货", "AIGC"],
    date: "7/16",
    readingTime: "9 分钟阅读",
    views: 3410,
    likes: 290,
    coverText: "记忆系统",
    mascotIcon: "🧠",
    coverBg: "from-purple-400 to-indigo-500",
    coverImage: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=1200",
    content: `# OpenClaw记忆系统升级...`,
    comments: []
  },
  {
    id: "art-7",
    title: "screenpipe：开源本地的 AI 记忆引擎，让电脑更懂你",
    slug: "screenpipe-local-ai-memory-engine",
    summary: "探索纯本地运行的屏幕与音频全天候上下文捕获引擎，打造安全无隐患的真正 Second Brain。",
    category: "软件推荐",
    readStatus: "未读",
    tags: ["软件", "开发", "OpenClaw"],
    date: "7/16",
    readingTime: "5 分钟阅读",
    views: 1980,
    likes: 165,
    coverText: "工单系统",
    mascotIcon: "💻",
    coverBg: "from-slate-400 to-slate-600",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200",
    content: `# screenpipe：开源本地的 AI 记忆引擎...`,
    comments: []
  },
  {
    id: "art-8",
    title: "混元hu3模型上手：腾讯云函数免费6个月，怎么才能用上",
    slug: "hunyuan-hu3-cloud-function",
    summary: "白嫖腾讯云 Serverless 云函数福利，零成本部署属于你自己的混元大模型 API 转发与微调能力。",
    category: "软件推荐",
    readStatus: "未读",
    tags: ["日常", "评测", "软件"],
    date: "7/8",
    readingTime: "4 分钟阅读",
    views: 5210,
    likes: 420,
    coverText: "混元模型",
    mascotIcon: "🌀",
    coverBg: "from-sky-400 via-blue-500 to-indigo-600",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
    content: `# 混元hu3模型上手...`,
    comments: []
  },
  {
    id: "art-9",
    title: "给OpenClaw加上rm删除保护：防止AI误删你的整个电脑",
    slug: "prevent-ai-accidental-rm-rf",
    summary: "在 Agent Shell 工具沙箱层注入 rm 拦截器与废纸篓安全暂存机制，避免代码运行逻辑失控导致的数据灾难。",
    category: "经验分享",
    readStatus: "未读",
    tags: ["教程", "Mac", "运维"],
    date: "7/7",
    readingTime: "5 分钟阅读",
    views: 2890,
    likes: 230,
    coverText: "文件保护",
    mascotIcon: "🛡️",
    coverBg: "from-red-500 to-rose-500",
    coverImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1200",
    content: `# 给OpenClaw加上rm删除保护...`,
    comments: []
  },
  {
    id: "art-10",
    title: "豆包国语Skill发布：让AI学会豆包的毒舌说话风格",
    slug: "doubao-mandarin-skill-release",
    summary: "通过精调人格 Prompt 与 Prompt Injections，打造极具个性与幽默感的多伦交互对话 AI 人格。",
    category: "软件推荐",
    readStatus: "未读",
    tags: ["软件", "AIGC", "OpenClaw"],
    date: "7/2",
    readingTime: "4 分钟阅读",
    views: 3820,
    likes: 310,
    coverText: "豆包国语",
    mascotIcon: "👧",
    coverBg: "from-purple-400 to-fuchsia-500",
    coverImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200",
    content: `# 豆包国语Skill发布...`,
    comments: []
  },
  {
    id: "art-11",
    title: "美团longcat上手：缓存免费，主打便宜，就是速度太慢，思考时间loooong",
    slug: "meituan-longcat-evaluation",
    summary: "评测美团 Longcat 长文本推理模型，极佳的价格性价比与长文本理解，但流式响应延迟仍有改进空间。",
    category: "软件推荐",
    readStatus: "未读",
    tags: ["评测", "软件", "AIGC"],
    date: "7/2",
    readingTime: "6 分钟阅读",
    views: 2100,
    likes: 175,
    coverText: "美团模型",
    mascotIcon: "🐱",
    coverBg: "from-green-400 to-emerald-600",
    coverImage: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200",
    content: `# 美团longcat上手...`,
    comments: []
  },
  {
    id: "art-12",
    title: "OpenClaw Workboard 功能上手：让 Agent 自己干活，你只管盯进度",
    slug: "openclaw-workboard-kanban",
    summary: "全自动 Kanban 看板协作流，让多智能体团队自行创建任务、分发 Task 并自动打包 Build 代码。",
    category: "经验分享",
    readStatus: "未读",
    tags: ["教程", "AIGC", "OpenClaw"],
    date: "7/1",
    readingTime: "7 分钟阅读",
    views: 4500,
    likes: 390,
    coverText: "龙虾看板",
    mascotIcon: "🦞",
    coverBg: "from-orange-500 via-red-500 to-rose-600",
    coverImage: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1200",
    content: `# OpenClaw Workboard 功能上手...`,
    comments: []
  },
  {
    id: "art-13",
    title: "小米平板8Pro上手：便宜且流畅的好平板，安卓平板的高效令人印象深刻",
    slug: "xiaomi-pad-8pro-hands-on",
    summary: "体验小米最新旗舰平板，超强续航与高刷屏幕，搭配桌面模式成为出差写博客与看论文的生产力工具。",
    category: "好物推荐",
    readStatus: "未读",
    tags: ["评测", "软件", "产品"],
    date: "6/29",
    readingTime: "6 分钟阅读",
    views: 6200,
    likes: 540,
    coverText: "小米平板",
    mascotIcon: "📱",
    coverBg: "from-teal-400 to-emerald-500",
    coverImage: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=1200",
    content: `# 小米平板8Pro上手...`,
    comments: []
  },
  {
    id: "art-14",
    title: "三疯动图发布：将视频转换为帧图或者GIF并且限制只有5MB，APNG、WEBP动图生成工具",
    slug: "sanfun-gif-generator-tool",
    summary: "纯前端 Canvas 快速视频转 GIF/WEBP 动图压缩小工具，无后台文件上传，瞬间生成高质感动图。",
    category: "我的项目",
    readStatus: "未读",
    tags: ["视频", "软件", "AIGC"],
    date: "6/25",
    readingTime: "4 分钟阅读",
    views: 3100,
    likes: 280,
    coverText: "三疯动图",
    mascotIcon: "🎬",
    coverBg: "from-rose-500 to-fuchsia-500",
    coverImage: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=1200",
    content: `# 三疯动图发布...`,
    comments: []
  },
  {
    id: "art-15",
    title: "AI支付置上手：内容全靠编，出问题甩锅给商家，付款快捷款难",
    slug: "ai-payment-trap-analysis",
    summary: "剖析近期各类无人值守 AI 自动下单与代付工具的安全风险与隐患，提醒开发者注意风控隔离。",
    category: "软件推荐",
    readStatus: "未读",
    tags: ["评测", "软件", "闲聊杂谈"],
    date: "6/18",
    readingTime: "5 分钟阅读",
    views: 2780,
    likes: 195,
    coverText: "智能支付",
    mascotIcon: "💳",
    coverBg: "from-cyan-400 to-blue-600",
    coverImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=1200",
    content: `# AI支付置上手...`,
    comments: []
  },
  {
    id: "art-16",
    title: "重要照片一定要备份，手机弄成照片备份的好习惯",
    slug: "important-photos-backup-guide",
    summary: "分享私有云 NAS + iCloud 双重加密同步策略，确保家庭照片与工作创作资产永不丢失。",
    category: "经验分享",
    readStatus: "未读",
    tags: ["教程", "干货", "Mac"],
    date: "6/17",
    readingTime: "5 分钟阅读",
    views: 3900,
    likes: 340,
    coverText: "照片备份",
    mascotIcon: "🖼️",
    coverBg: "from-amber-400 via-yellow-500 to-orange-500",
    coverImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1200",
    content: `# 重要照片一定要备份...`,
    comments: []
  },
  {
    id: "art-17",
    title: "我应该怎么设计我的博客？如何搭建一个体验好的博客？",
    slug: "how-to-design-my-blog",
    summary: "分享个人博客搭建经验与排版考量，从卡片式 Bento 布局到动效体验细节，打造有温度的个人知识库。",
    category: "经验分享",
    readStatus: "未读",
    tags: ["必看", "网页前端", "Hexo", "设计报告"],
    date: "2022/7/17",
    readingTime: "12 分钟阅读",
    views: 8900,
    likes: 720,
    featured: true,
    coverText: "设计博客",
    mascotIcon: "🔴",
    coverBg: "from-rose-500 to-orange-400",
    content: `# 我应该怎么设计我的博客？...`,
    comments: []
  },
  {
    id: "art-18",
    title: "如何让用户同意APP授权？提升权限授权率方法",
    slug: "how-to-improve-app-permission-grant-rate",
    summary: "从心理学与交互链路出发，拆解前置引导卡片、场景触发与权限转化的核心原则与设计范式。",
    category: "设计报告",
    readStatus: "未读",
    tags: ["干货", "产品", "设计报告"],
    date: "2022/2/10",
    readingTime: "8 分钟阅读",
    views: 4500,
    likes: 380,
    coverText: "权限转化",
    mascotIcon: "🖥️",
    coverBg: "from-sky-400 via-blue-500 to-indigo-600",
    content: `# 如何让用户同意APP授权...`,
    comments: []
  },
  {
    id: "art-19",
    title: "适老化设计的看法，app如何进行适老化设计",
    slug: "perspectives-on-aging-friendly-app-design",
    summary: "针对老龄化用户的关怀模式设计，探讨字体字阶、色彩对比度、误触容错与关怀大字版的实践思路。",
    category: "设计报告",
    readStatus: "未读",
    tags: ["干货", "产品", "设计报告"],
    date: "2021/11/29",
    readingTime: "7 分钟阅读",
    views: 3200,
    likes: 290,
    coverText: "关怀模式",
    mascotIcon: "🤝",
    coverBg: "from-slate-500 to-zinc-700",
    content: `# 适老化设计的看法...`,
    comments: []
  },
  {
    id: "art-20",
    title: "产品需求应该怎么定，什么需求是紧急需求？",
    slug: "how-to-define-product-requirements-priority",
    summary: "以版本号 1.0.1 与 1.0.2 的迭代节奏为例，厘清紧急需求、重要需求与假需求的边界判定标准。",
    category: "设计报告",
    readStatus: "未读",
    tags: ["干货", "产品", "设计报告"],
    date: "2021/2/20",
    readingTime: "9 分钟阅读",
    views: 5100,
    likes: 410,
    coverText: "1.0.1 1.0.2",
    mascotIcon: "⚙️",
    coverBg: "from-lime-400 to-emerald-500",
    content: `# 产品需求应该怎么定...`,
    comments: []
  },
  {
    id: "art-21",
    title: "外卖差异化定价？我对于产品的动态定价的一点看法",
    slug: "thoughts-on-differentiated-pricing-in-products",
    summary: "讨论外卖与 SaaS 产品的千人千面定价策略、感知公平性与用户信任感维系平衡。",
    category: "设计报告",
    readStatus: "未读",
    tags: ["干货", "产品", "设计报告"],
    date: "2020/12/21",
    readingTime: "6 分钟阅读",
    views: 2900,
    likes: 210,
    coverText: "差异化定价",
    mascotIcon: "🛵",
    coverBg: "from-amber-400 via-yellow-500 to-orange-500",
    content: `# 外卖差异化定价...`,
    comments: []
  },
  {
    id: "art-22",
    title: "深色模式的设计注意事项：为什么不是定制一个灰色模式？",
    slug: "dark-mode-design-considerations",
    summary: "深入剖析 Dark Mode 与纯灰模式在 OLED 物理发光、视网膜疲劳与界面层级发光色温上的本质区别。",
    category: "设计报告",
    readStatus: "未读",
    tags: ["必看", "设计", "设计报告"],
    date: "2020/12/17",
    readingTime: "10 分钟阅读",
    views: 6800,
    likes: 590,
    coverText: "深色模式",
    mascotIcon: "🔮",
    coverBg: "from-indigo-500 to-purple-600",
    content: `# 深色模式的设计注意事项...`,
    comments: []
  },
  {
    id: "art-23",
    title: "Sanfun产品设计报告06：知识类博客的设计思路和理念",
    slug: "sanfun-design-report-06-knowledge-blog-philosophy",
    summary: "探讨如何在碎片化阅读时代构建沉浸式个人知识库，强化内容流转与关联阅读推荐。",
    category: "设计报告",
    readStatus: "未读",
    tags: ["设计", "干货", "设计报告"],
    date: "2020/12/15",
    readingTime: "8 分钟阅读",
    views: 4100,
    likes: 330,
    coverText: "博客设计",
    mascotIcon: "🦋",
    coverBg: "from-blue-500 to-indigo-600",
    content: `# Sanfun产品设计报告06...`,
    comments: []
  },
  {
    id: "art-24",
    title: "Sanfun产品设计报告05：视频播放器横屏与竖屏的设计差异在哪？我应该如何选择？",
    slug: "sanfun-design-report-05-video-player-orientation",
    summary: "横屏沉浸感与竖屏手势吞吐量的权衡研究，分析 TikTok 与传统播放器的信息密度考量。",
    category: "设计报告",
    readStatus: "未读",
    tags: ["干货", "产品", "设计报告"],
    date: "2020/12/9",
    readingTime: "7 分钟阅读",
    views: 3900,
    likes: 310,
    coverText: "视频播放",
    mascotIcon: "🎵",
    coverBg: "from-rose-500 to-red-500",
    content: `# Sanfun产品设计报告05...`,
    comments: []
  },
  {
    id: "art-25",
    title: "Sanfun产品设计报告04：APP的震动设计",
    slug: "sanfun-design-report-04-haptic-feedback-design",
    summary: "触觉马达（Haptic Engine）在 iOS 与 Android 交互反馈中的物理暗示与按压成就感构建。",
    category: "设计报告",
    readStatus: "未读",
    tags: ["干货", "产品", "设计报告"],
    date: "2020/10/28",
    readingTime: "5 分钟阅读",
    views: 3300,
    likes: 270,
    coverText: "震动反馈",
    mascotIcon: "📱",
    coverBg: "from-cyan-400 to-emerald-500",
    content: `# Sanfun产品设计报告04...`,
    comments: []
  },
  {
    id: "art-26",
    title: "Sanfun产品设计报告03：线下服务的时间概念，如何设计线下服务提升效率",
    slug: "sanfun-design-report-03-offline-service-time-concept",
    summary: "将数字产品的等待进度条心理预期应用至线下核销与排队场景，降低等待焦虑感。",
    category: "设计报告",
    readStatus: "未读",
    tags: ["干货", "产品", "设计报告"],
    date: "2020/10/20",
    readingTime: "6 分钟阅读",
    views: 2800,
    likes: 220,
    coverText: "时间概念",
    mascotIcon: "⏰",
    coverBg: "from-orange-500 via-red-500 to-rose-600",
    content: `# Sanfun产品设计报告03...`,
    comments: []
  },
  {
    id: "art-27",
    title: "Sanfun产品设计报告02：便捷与误触如何取舍",
    slug: "sanfun-design-report-02-convenience-vs-accidental-touch",
    summary: "分析危险操作 Delete、退订与格式化的二次确认逻辑，避免防呆机制过于繁琐。",
    category: "设计报告",
    readStatus: "未读",
    tags: ["干货", "产品", "设计报告"],
    date: "2020/10/13",
    readingTime: "6 分钟阅读",
    views: 3100,
    likes: 250,
    coverText: "Delete",
    mascotIcon: "🗑️",
    coverBg: "from-amber-400 via-yellow-500 to-orange-400",
    content: `# Sanfun产品设计报告02...`,
    comments: []
  },
  {
    id: "art-28",
    title: "Sanfun产品设计报告01：算法下的预知设计",
    slug: "sanfun-design-report-01-predictive-design-with-algorithms",
    summary: "利用智能算法预测用户下一步意图，提早预加载数据与网络请求，打造零延迟操作感。",
    category: "设计报告",
    readStatus: "未读",
    tags: ["干货", "产品", "设计报告"],
    date: "2020/10/10",
    readingTime: "8 分钟阅读",
    views: 4600,
    likes: 390,
    coverText: "预知设计",
    mascotIcon: "🔮",
    coverBg: "from-fuchsia-400 to-pink-500",
    content: `# Sanfun产品设计报告01...`,
    comments: []
  },
  {
    id: "art-29",
    title: "SanfunSticker3D发布：3D心态的Sanfun表情，个人免费使用",
    slug: "sanfun-sticker-3d-release",
    summary: "全新设计的 3D 立体小跟班贴纸与表情包开源发布，支持在博客、网页与即时通讯软件中免费商用与个人下载。",
    category: "我的项目",
    readStatus: "未读",
    tags: ["设计", "AI绘画", "产品"],
    date: "6/11",
    readingTime: "3 分钟阅读",
    views: 4890,
    likes: 410,
    coverText: "三维表情",
    mascotIcon: "😀",
    coverBg: "from-amber-300 via-amber-400 to-orange-500",
    coverImage: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=1200",
    content: `# SanfunSticker3D发布...`,
    comments: []
  },
  {
    id: "art-30",
    title: "这才是我心目中AI博客的样子",
    slug: "what-an-ai-blog-should-look-like",
    summary: "聊聊我对数字花园、AI 智能导读、Bento 便当盒排版与真正人性化阅读交互体验的理解与探索。",
    category: "软件推荐",
    readStatus: "未读",
    tags: ["AIGC", "开发"],
    date: "6/9",
    readingTime: "7 分钟阅读",
    views: 5120,
    likes: 460,
    coverText: "智能博客",
    mascotIcon: "🤖",
    coverBg: "from-indigo-400 to-purple-500",
    coverImage: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200",
    content: `# 这才是我心目中AI博客的样子...`,
    comments: []
  },
  {
    id: "art-31",
    title: "三疯历史记录看大更新：支持根据浏览器历史记录的AI对话",
    slug: "sanfun-history-log-ai-chat",
    summary: "通过隐私防护的本地向量加密存储，让你的 AI 助手随时回忆起你上周查阅过的长文与研发文档。",
    category: "我的项目",
    readStatus: "未读",
    tags: ["软件", "AIGC", "开发"],
    date: "6/9",
    readingTime: "6 分钟阅读",
    views: 3200,
    likes: 270,
    coverText: "历史记录",
    mascotIcon: "📜",
    coverBg: "from-slate-600 to-zinc-800",
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200",
    content: `# 三疯历史记录看大更新...`,
    comments: []
  },
  {
    id: "art-32",
    title: "如何让OpenClaw调用你的百度网盘？百度网盘官方Skill帮你上传、下载与分享",
    slug: "openclaw-baidu-pan-skill",
    summary: "配置官方 OpenAPI 授权令牌，实现自然语言一句话让 Agent 帮你在网盘内搜索文件与生成分享链接。",
    category: "经验分享",
    readStatus: "未读",
    tags: ["日常", "教程", "干货"],
    date: "6/4",
    readingTime: "8 分钟阅读",
    views: 4100,
    likes: 350,
    coverText: "百度网盘",
    mascotIcon: "☁️",
    coverBg: "from-blue-400 via-cyan-500 to-sky-600",
    coverImage: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1200",
    content: `# 如何让OpenClaw调用你的百度网盘...`,
    comments: []
  }
];

export const sampleArticles: Article[] = rawSampleArticles.map(a => ({
  ...a,
  slug: generatePinyinSlug(a.title, a.date)
}));

export const sampleMoments: Moment[] = [
  {
    id: "m1",
    content: "刚刚发布了全新的 Sanfun Bento 博客主题！毛玻璃卡片特效和 Gemini AI 文章一键总结在手机和电脑端都完美适配了。🎉",
    date: "2026-07-29 18:30",
    likes: 24,
    tags: ["开发日志", "BentoUI", "GeminiAI"],
    images: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600"],
    location: "常州 · 钟楼"
  },
  {
    id: "m2",
    content: "下午微调了 Tailwind CSS v4 的字体字号阶梯。选用 Plus Jakarta Sans 作为标题配搭优雅的中文黑体，层次感极佳。",
    date: "2026-07-25 11:15",
    likes: 18,
    tags: ["字体设计", "UI排版"],
    location: "Coffee Lab ☕"
  },
  {
    id: "m3",
    content: "测试了 Gemini 3.6 Flash 在 20+ 篇博客上下文中的检索响应，延迟在 300 毫秒左右！速度确实让人印象深刻。",
    date: "2026-07-20 20:05",
    likes: 31,
    tags: ["前沿AI", "GeminiFlash"]
  }
];

export const sampleProjects: Project[] = [
  {
    id: "sanfun-bento-theme",
    name: "Sanfun Bento 博客系统",
    description: "基于卡片 Bento Grid 构图的个人博客与数字花园主题，集成 AI 智能生成文章摘要与智能问答。",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    tags: ["React 19", "Tailwind CSS", "Gemini API", "TypeScript"],
    demoUrl: "https://blog.sanfun.com",
    githubUrl: "https://github.com/sanfun",
    stars: 1280,
    featured: true,
    category: "Web 应用"
  },
  {
    id: "ui-color-palette-gen",
    name: "Aesthetic 美学调色板",
    description: "专门为无障碍暗黑/明亮模式 UI 界面打造的 AI 智能配色生成工具。",
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800",
    tags: ["TypeScript", "Tailwind", "Canvas"],
    demoUrl: "https://example.com",
    githubUrl: "https://github.com",
    stars: 840,
    featured: true,
    category: "设计工具"
  },
  {
    id: "hexo-butterfly-sanfun",
    name: "Butterfly Sanfun 增强插件",
    description: "深受喜爱的 Hexo 博客主题增强包，支持状态横幅、微动态说说及技术栈组件。",
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
    tags: ["JavaScript", "Hexo", "CSS3"],
    githubUrl: "https://github.com",
    stars: 2150,
    featured: false,
    category: "扩展插件"
  }
];

export const sampleEquipment: EquipmentItem[] = [
  {
    id: "eq1",
    name: "MacBook Pro 16\" (M3 Max)",
    category: "核心硬件",
    description: "64GB 统一内存，1TB 固态硬盘。轻松同时运行本地 AI 调试、Docker 容器与 4K 视频渲染。",
    iconName: "Laptop",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400",
    rating: 5,
    status: "使用中"
  },
  {
    id: "eq2",
    name: "Apple Studio Display 27\" 5K",
    category: "桌面搭建",
    description: "218 ppi Retina 视网膜分辨率支持 True Tone 原彩显示。高精细文本渲染大幅缓解长时间写代码的视觉疲劳。",
    iconName: "Monitor",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400",
    rating: 5,
    status: "使用中"
  },
  {
    id: "eq3",
    name: "Keychron Q1 旋钮客制化键盘",
    category: "桌面搭建",
    description: "全铝合金 CNC 机身，Gateron Oil Yellow 厂润线性轴体，搭配定制 PBT 键帽，击键音沉稳舒适。",
    iconName: "Keyboard",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400",
    rating: 5,
    status: "使用中"
  },
  {
    id: "eq4",
    name: "Raycast Launcher Pro",
    category: "效率软件",
    description: "极速 macOS 启动器替代 Spotlight。自定义 GitHub 扩展、Gemini AI 快捷键与窗口管理。",
    iconName: "Zap",
    rating: 5,
    status: "强烈推荐"
  },
  {
    id: "eq5",
    name: "Figma Professional",
    category: "效率软件",
    description: "用于原型绘制、Bento UI 搭建、组件库设计与交互规范的核心工具。",
    iconName: "Layout",
    rating: 5,
    status: "使用中"
  },
  {
    id: "eq6",
    name: "VS Code + Cursor AI",
    category: "开发工具",
    description: "Tailwind CSS 智能补全、GitHub Copilot、Prettier 与 Sanfun 专属主题扩展。",
    iconName: "Code",
    rating: 5,
    status: "使用中"
  }
];

export const sampleFriends: FriendLink[] = [
  {
    id: "f1",
    name: "三疯Sanfun 官方博客",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    description: "设计即是态度。分享有价值的数字工具与优雅的用户体验设计。",
    url: "https://blog.sanfun.com",
    status: "Online",
    tags: ["产品设计", "全栈开发", "Bento"]
  },
  {
    id: "f2",
    name: "Akilar 的数字小屋",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    description: "探索前端前沿技术、Hexo 主题美化与奇妙的 CSS 魔法。",
    url: "https://example.com/akilar",
    status: "Online",
    tags: ["Hexo", "CSS"]
  },
  {
    id: "f3",
    name: "Solitude 技术实验室",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    description: "专注探讨 Linux 系统、云原生与开源软件的静谧之地。",
    url: "https://example.com/solitude",
    status: "Building",
    tags: ["Linux", "开源"]
  },
  {
    id: "f4",
    name: "Elysia 设计花园",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    description: "UI/UX 设计思考、字体排版研究与产品原型设计笔记。",
    url: "https://example.com/elysia",
    status: "Online",
    tags: ["UI/UX", "产品原型"]
  }
];
