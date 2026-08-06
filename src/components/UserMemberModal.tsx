import React, { useState, useEffect } from 'react';
import { 
  X, User, Lock, Mail, Shield, Sparkles, Award, Zap, Coins, 
  CheckCircle2, Upload, Edit, RefreshCw, LogOut, ExternalLink, 
  ChevronRight, Star, Heart, FileText, Download, AlertCircle, ArrowUpRight, Crown, MessageSquare, Send, Bell, Flame, AlertTriangle
} from 'lucide-react';
import { UserMember, MemberTier, DirectMessage } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ImageCropperModal } from './ImageCropperModal';

interface UserMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserMember | null;
  onUserUpdate: (user: UserMember | null) => void;
}

export const UserMemberModal: React.FC<UserMemberModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate
}) => {
  const { accentClasses } = useTheme();

  // Active Tab: 'auth' | 'profile' | 'levels' | 'purchases' | 'messages'
  const [activeTab, setActiveTab] = useState<'auth' | 'profile' | 'levels' | 'purchases' | 'messages'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Auth Inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('');

  // Profile Edit Inputs
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Direct Messages State
  const [messagesList, setMessagesList] = useState<DirectMessage[]>([]);
  const [newMsgInput, setNewMsgInput] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [msgError, setMsgError] = useState('');

  // Tiers list from backend
  const [tiersList, setTiersList] = useState<MemberTier[]>([]);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cropper Modal State
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Fetch Tiers & Messages on Open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      fetch('/api/member-tiers')
        .then(res => res.ok ? res.json() : [])
        .then(data => { if (Array.isArray(data)) setTiersList(data); })
        .catch(() => {});

      if (currentUser) {
        setActiveTab('profile');
        setEditUsername(currentUser.username);
        setEditBio(currentUser.bio || '');
        setEditAvatar(currentUser.avatar);

        fetchUserMessages(currentUser.id);
      } else {
        setActiveTab('auth');
      }
    }
  }, [isOpen, currentUser]);

  const fetchUserMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/messages?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMessagesList(data);
        // Mark read by user
        fetch('/api/messages/read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: userId, readBy: 'user' })
        }).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newMsgInput.trim()) return;

    if (currentUser.isBlacklisted) {
      setMsgError('【账号封禁】您的账号已被拉黑，无法发送私信！');
      return;
    }
    if (currentUser.isMuted) {
      setMsgError(`【禁言限制】您的账号已被禁言：${currentUser.muteReason || '发言违规'}，无法发送私信！`);
      return;
    }

    setIsSendingMsg(true);
    setMsgError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentUser.id,
          memberName: currentUser.username,
          memberAvatar: currentUser.avatar,
          sender: 'user',
          content: newMsgInput.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '发送失败');
      setNewMsgInput('');
      fetchUserMessages(currentUser.id);
    } catch (err: any) {
      setMsgError(err.message || '私信发送异常');
    } finally {
      setIsSendingMsg(false);
    }
  };

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setErrorMsg('请输入注册邮箱/用户名与登录密码！');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: emailInput, password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '登录失败');
      }
      onUserUpdate(data.user);
      localStorage.setItem('sanfun_user_id', data.user.id);
      setSuccessMsg('欢迎回来，' + data.user.username + '！');
      setActiveTab('profile');
    } catch (err: any) {
      setErrorMsg(err.message || '登录异常');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !emailInput || !passwordInput) {
      setErrorMsg('请填写完整的用户名、邮箱与密码！');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput,
          email: emailInput,
          password: passwordInput,
          avatar: avatarInput || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(usernameInput)}`
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '注册失败');
      }
      onUserUpdate(data.user);
      localStorage.setItem('sanfun_user_id', data.user.id);
      setSuccessMsg(data.message || '注册成功，已获赠积分！');
      setActiveTab('profile');
    } catch (err: any) {
      setErrorMsg(err.message || '注册异常');
    } finally {
      setLoading(false);
    }
  };

  // Save Profile
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          username: editUsername,
          avatar: editAvatar,
          bio: editBio
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');
      onUserUpdate(data.user);
      setSuccessMsg('个人资料及自定义头像已保存成功！');
    } catch (err: any) {
      setErrorMsg(err.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('sanfun_user_id');
    onUserUpdate(null);
    setActiveTab('auth');
    setSuccessMsg('已退出当前账号登录');
  };

  // Quick Recharge / Simulating Upgrade
  const handleSimulateRecharge = async (amount: number, targetLevel: number) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          credits: amount,
          levelNumeric: targetLevel
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '充值/升级失败');
      onUserUpdate(data.user);
      setSuccessMsg(`充值成功！增加了 ${amount} 积分！`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Level Badge Helper
  const renderLevelBadge = (levelNumeric: number, levelText: string) => {
    switch (levelNumeric) {
      case 7:
        return (
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600 text-zinc-950 font-black text-[11px] shadow-md flex items-center gap-1 animate-bounce">
            <Crown className="w-3.5 h-3.5 text-zinc-900 fill-yellow-300" />
            <span>{levelText || 'Lv.7 冠世 SVIP'}</span>
          </span>
        );
      case 6:
        return (
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 text-white font-black text-[11px] shadow-sm flex items-center gap-1 animate-pulse">
            <Sparkles className="w-3 h-3 text-amber-200" />
            <span>{levelText || 'Lv.6 荣耀 SVIP'}</span>
          </span>
        );
      case 5:
        return (
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-[11px] shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-200" />
            <span>{levelText || 'Lv.5 星耀 VIP'}</span>
          </span>
        );
      case 4:
        return (
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-[11px] shadow-xs flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
            <span>{levelText || 'Lv.4 钻石会员'}</span>
          </span>
        );
      case 3:
        return (
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[11px] shadow-xs flex items-center gap-1">
            <Award className="w-3 h-3 fill-white" />
            <span>{levelText || 'Lv.3 黄金会员'}</span>
          </span>
        );
      case 2:
        return (
          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-[11px] shadow-xs flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{levelText || 'Lv.2 白银会员'}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium flex items-center gap-1">
            <User className="w-3 h-3 text-zinc-500" />
            <span>{levelText || 'Lv.1 普通会员'}</span>
          </span>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/80">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl text-white shadow-xs ${accentClasses.bg}`}>
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>{currentUser ? '会员中心与特权中心' : '用户登录与创作者注册'}</span>
                  {currentUser && renderLevelBadge(currentUser.levelNumeric, currentUser.level)}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {currentUser ? `等级: ${currentUser.level} | 积分余额: ${currentUser.credits}` : '注册立享专栏付费阅读、独家附件下载与特权标识'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 pt-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-1 overflow-x-auto bg-white dark:bg-zinc-900">
            {!currentUser && (
              <button
                onClick={() => setActiveTab('auth')}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'auth'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>登录 / 注册</span>
              </button>
            )}

            {currentUser && (
              <>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'profile'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>个人中心与资料修改</span>
                </button>

                <button
                  onClick={() => setActiveTab('purchases')}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'purchases'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>已解锁内容 ({currentUser.unlockedArticles.length + currentUser.purchasedAttachments.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('messages')}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'messages'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span>站长私信 / 互动</span>
                  {messagesList.some(m => !m.readByUser) && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  )}
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('levels')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'levels'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>等级体系与充值特权</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tab Content Area */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            
            {/* TAB 1: AUTH (LOGIN & REGISTER) */}
            {activeTab === 'auth' && !currentUser && (
              <div className="space-y-5">
                <div className="flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-xl max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      authMode === 'login'
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    账号登录
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      authMode === 'register'
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    免费注册 (赠30积分)
                  </button>
                </div>

                {authMode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-3.5 max-w-sm mx-auto">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">邮箱 或 用户名 *</label>
                      <div className="relative mt-1">
                        <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="your_email@example.com 或 演示账号"
                          className="w-full bg-zinc-50 dark:bg-zinc-800/80 pl-9 pr-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">登录密码 *</label>
                      <div className="relative mt-1">
                        <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-zinc-50 dark:bg-zinc-800/80 pl-9 pr-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-sm ${accentClasses.bg}`}
                      >
                        {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                        <span>立即登录</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/50 text-[11px] text-indigo-800 dark:text-indigo-300 space-y-1">
                      <p className="font-bold">💡 体验快速测试账号：</p>
                      <p>• 账号：<code className="font-mono bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded">demo@sanfun.net</code></p>
                      <p>• 密码：<code className="font-mono bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded">password123</code> (拥有 Lv.2 进阶特权)</p>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3 max-w-sm mx-auto">
                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">个性用户名 *</label>
                      <div className="relative mt-1">
                        <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          placeholder="设置一个酷炫的名字"
                          className="w-full bg-zinc-50 dark:bg-zinc-800/80 pl-9 pr-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">电子邮箱 *</label>
                      <div className="relative mt-1">
                        <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="用于接收通知与找回密码"
                          className="w-full bg-zinc-50 dark:bg-zinc-800/80 pl-9 pr-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">设置密码 *</label>
                      <div className="relative mt-1">
                        <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="建议 6 位以上混合密码"
                          className="w-full bg-zinc-50 dark:bg-zinc-800/80 pl-9 pr-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">自定义头像链接 (选填)</label>
                      <input
                        type="text"
                        value={avatarInput}
                        onChange={(e) => setAvatarInput(e.target.value)}
                        placeholder="不填将使用智能随机生成头像"
                        className="w-full bg-zinc-50 dark:bg-zinc-800/80 px-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1 font-mono"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 shadow-sm ${accentClasses.bg}`}
                      >
                        {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                        <span>完成注册 (送 30 积分)</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: PROFILE CENTER & AVATAR CROPPER */}
            {activeTab === 'profile' && currentUser && (
              <div className="space-y-6">
                
                {/* System Warning Notes & Account Status Banners */}
                {(currentUser.isBlacklisted || currentUser.isMuted || (currentUser.warningNotes && currentUser.warningNotes.length > 0)) && (
                  <div className="space-y-2">
                    {currentUser.isBlacklisted && (
                      <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                        <div>
                          <p className="font-bold">【账号已拉黑/封禁】</p>
                          <p className="text-[11px] opacity-90">封禁原因：{currentUser.blacklistReason || '违反社区管理规范，已被限制全站互动。'}</p>
                        </div>
                      </div>
                    )}

                    {currentUser.isMuted && !currentUser.isBlacklisted && (
                      <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                        <div>
                          <p className="font-bold">【账号处于禁言状态】</p>
                          <p className="text-[11px] opacity-90">禁言原因：{currentUser.muteReason || '发言违规，暂时无法发布评论或私信。'}</p>
                        </div>
                      </div>
                    )}

                    {currentUser.warningNotes && currentUser.warningNotes.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                            <Bell className="w-4 h-4 text-indigo-500" />
                            <span>来自站长的消息与安全提醒 ({currentUser.warningNotes.length})</span>
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {currentUser.warningNotes.map(note => (
                            <div key={note.id} className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-xs flex items-start justify-between gap-2">
                              <p className="text-zinc-700 dark:text-zinc-300">{note.content}</p>
                              <span className="text-[10px] text-zinc-400 shrink-0">{note.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Profile Summary Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-800 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative group shrink-0">
                      <img
                        src={editAvatar || currentUser.avatar}
                        alt={currentUser.username}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/50 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCropperOpen(true)}
                        className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>更换</span>
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-black truncate">{currentUser.username}</h4>
                        {renderLevelBadge(currentUser.levelNumeric, currentUser.level)}
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">{currentUser.email}</p>
                      <p className="text-xs text-zinc-300 mt-1 line-clamp-1">{currentUser.bio || '未填写个性签名'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md text-center">
                      <span className="text-[10px] text-zinc-400 block font-bold">积分余额</span>
                      <span className="text-base font-black text-amber-300 flex items-center justify-center gap-1">
                        <Coins className="w-4 h-4" />
                        <span>{currentUser.credits}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
                      title="退出登录"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Edit Profile Form */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Edit className="w-4 h-4 text-indigo-500" />
                    <span>个人资料与头像编辑器</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">用户名</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">头像链接 / 裁切上传</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={editAvatar}
                          onChange={(e) => setEditAvatar(e.target.value)}
                          placeholder="图片 URL 或点击右侧裁切上传"
                          className="w-full bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setIsCropperOpen(true)}
                          className="px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>裁切头像</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">个人简介 (Bio)</label>
                    <textarea
                      rows={2}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="介绍一下你自己..."
                      className="w-full bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 mt-1"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSaveProfile}
                      className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm ${accentClasses.bg}`}
                    >
                      {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>保存个人资料</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: MEMBER LEVELS & RECHARGE */}
            {activeTab === 'levels' && (
              <div className="space-y-5">
                <div className="text-center max-w-md mx-auto space-y-1">
                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100">会员等级体系与专属特权</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    等级越高，可免费阅读的付费干货越多，独家源码与资源包一键下载！
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  {/* Lv.1 */}
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs">
                        Lv.1 普通会员
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">免费注册即享</span>
                    </div>
                    <ul className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 注册赠送 30 经验积分</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 注册后参与文章互动评论</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 基础免费专栏资源查看</li>
                    </ul>
                  </div>

                  {/* Lv.2 */}
                  <div className="p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-teal-500 text-white font-bold text-xs">
                        Lv.2 白银会员
                      </span>
                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">白银进阶</span>
                    </div>
                    <ul className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1">
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" /> 解锁 Lv.2+ 白银专享技术文档</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" /> 专属青翠白银会员身份勋章</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" /> 8折积分兑换源码附件资源</li>
                    </ul>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => handleSimulateRecharge(50, 2)}
                        className="w-full py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold text-[11px] shadow-xs"
                      >
                        升至 Lv.2 白银会员 (+50积分)
                      </button>
                    )}
                  </div>

                  {/* Lv.3 */}
                  <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-xs">
                        Lv.3 黄金会员
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">黄金尊享</span>
                    </div>
                    <ul className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1">
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 免费阅读 Lv.3+ 黄金付费干货</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 璀璨黄金专属 VIP 勋章标识</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 网盘及提取码解密 5折优惠</li>
                    </ul>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => handleSimulateRecharge(100, 3)}
                        className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-xs"
                      >
                        升至 Lv.3 黄金会员 (+100积分)
                      </button>
                    )}
                  </div>

                  {/* Lv.4 */}
                  <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold text-xs">
                        Lv.4 钻石会员
                      </span>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">钻石核心</span>
                    </div>
                    <ul className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1">
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" /> 免费畅享 Lv.4+ 独家全套源码</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" /> 专属幻彩紫钻贵宾尊享标识</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" /> 专属技术求助与答疑优先权</li>
                    </ul>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => handleSimulateRecharge(200, 4)}
                        className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-xs"
                      >
                        升至 Lv.4 钻石会员 (+200积分)
                      </button>
                    )}
                  </div>

                  {/* Lv.5 */}
                  <div className="p-3.5 rounded-xl bg-purple-900/10 dark:bg-purple-950/30 border border-purple-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-xs shadow-xs">
                        Lv.5 星耀 VIP
                      </span>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">星耀尊享</span>
                    </div>
                    <ul className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1">
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" /> 免费阅读 Lv.5+ 深度进阶架构专栏</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" /> 炫彩星耀专属紫金 VIP 徽章标识</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" /> 全站源码与网盘资源一键解锁</li>
                    </ul>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => handleSimulateRecharge(300, 5)}
                        className="w-full py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-[11px] shadow-xs"
                      >
                        升至 Lv.5 星耀 VIP (+300积分)
                      </button>
                    )}
                  </div>

                  {/* Lv.6 */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-amber-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 text-white font-black text-xs shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>Lv.6 荣耀 SVIP</span>
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">荣耀殿堂</span>
                    </div>
                    <ul className="text-[11px] text-zinc-600 dark:text-zinc-300 space-y-1">
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 全站所有付费文章无门槛免费畅读</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 文章附件、源码资源与网盘解密免积分</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 炫彩极光身份标识与专属评论特权</li>
                    </ul>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => handleSimulateRecharge(500, 6)}
                        className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-bold text-[11px] shadow-xs"
                      >
                        升至 Lv.6 荣耀 SVIP (+500积分)
                      </button>
                    )}
                  </div>

                  {/* Lv.7 */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-yellow-500/20 via-amber-400/20 to-orange-500/20 border-2 border-yellow-400 dark:border-yellow-500 space-y-2 col-span-1 sm:col-span-2 lg:col-span-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600 text-zinc-950 font-black text-xs shadow-md flex items-center gap-1.5">
                        <Crown className="w-4 h-4 fill-yellow-200 text-zinc-900" />
                        <span>Lv.7 冠世至尊 SVIP (创世神级)</span>
                      </span>
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-300 animate-pulse">创世至高赞助商</span>
                    </div>
                    <ul className="text-[11px] text-zinc-800 dark:text-zinc-100 space-y-1.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3">
                      <li className="flex items-center gap-1.5 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> 终极皇冠身份标志与至尊耀眼全站称号</li>
                      <li className="flex items-center gap-1.5 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> 全站所有付费文章、源码附件及网盘资源永久免费解锁</li>
                      <li className="flex items-center gap-1.5 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> 荣登博客首页终身赞助大佬名册榜首</li>
                      <li className="flex items-center gap-1.5 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> 作者 1v1 专属技术答疑与项目架构指导通道</li>
                      <li className="flex items-center gap-1.5 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> 评论区弹幕流光气泡与尊贵红黑黑金名片</li>
                      <li className="flex items-center gap-1.5 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> 专享全站未发布源码预先测试权与私有库推荐</li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser) handleSimulateRecharge(800, 7);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-zinc-950 font-black text-xs shadow-xl flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4 fill-zinc-900" />
                      <span>晋升 Lv.7 冠世至尊 SVIP (+800积分)</span>
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 4: UNLOCKED CONTENT */}
            {activeTab === 'purchases' && currentUser && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>已购买/解锁的付费文章与附件明细</span>
                </h4>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2">
                  <span className="text-[11px] font-bold text-zinc-500 block uppercase">已解锁付费文章 ID 清单：</span>
                  {currentUser.unlockedArticles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {currentUser.unlockedArticles.map((id) => (
                        <span key={id} className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{id}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">暂未解锁付费文章，可在文章详情页中使用积分或 VIP 解锁。</p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2">
                  <span className="text-[11px] font-bold text-zinc-500 block uppercase">已购买附件清单：</span>
                  {currentUser.purchasedAttachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {currentUser.purchasedAttachments.map((id) => (
                        <span key={id} className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs font-mono font-bold flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          <span>{id}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">暂无付费购买附件。</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: DIRECT MESSAGING WITH ADMIN */}
            {activeTab === 'messages' && currentUser && (
              <div className="space-y-4 flex flex-col h-[400px]">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      与博客管理员 (Sanfun) 的私信通道
                    </h4>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    可以在此咨询技术细节、反馈问题或申请特权
                  </span>
                </div>

                {msgError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 shrink-0">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{msgError}</span>
                  </div>
                )}

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                  {messagesList.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 text-xs space-y-1">
                      <MessageSquare className="w-8 h-8 mx-auto opacity-40 mb-2" />
                      <p className="font-bold">暂无私信互动记录</p>
                      <p className="text-[11px]">有任何想法或建议？在下方输入框给站长留言吧！</p>
                    </div>
                  ) : (
                    messagesList.map(msg => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div key={msg.id} className={`flex items-start gap-2.5 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                          {isAdmin && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-indigo-500/30">
                              博
                            </div>
                          )}

                          <div className={`max-w-[75%] space-y-1 ${isAdmin ? 'items-start' : 'items-end flex flex-col'}`}>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                              <span>{isAdmin ? '管理员 Sanfun (站长)' : msg.memberName}</span>
                              <span>•</span>
                              <span>{msg.createdAt}</span>
                            </div>
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isAdmin
                                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/80 rounded-tl-xs'
                                : `${accentClasses.bg} text-white rounded-tr-xs`
                            }`}>
                              {msg.content}
                            </div>
                          </div>

                          {!isAdmin && (
                            <img
                              src={msg.memberAvatar || currentUser.avatar}
                              alt={currentUser.username}
                              className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-zinc-300 dark:ring-zinc-700"
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send Input */}
                <form onSubmit={handleSendDirectMessage} className="flex items-center gap-2 shrink-0 pt-1">
                  <input
                    type="text"
                    value={newMsgInput}
                    onChange={(e) => setNewMsgInput(e.target.value)}
                    disabled={currentUser.isBlacklisted || currentUser.isMuted || isSendingMsg}
                    placeholder={
                      currentUser.isBlacklisted
                        ? "账号已被拉黑，禁止发送"
                        : currentUser.isMuted
                        ? "账号处于禁言状态，禁止发送"
                        : "给站长留言私信..."
                    }
                    className="flex-1 bg-zinc-50 dark:bg-zinc-800/80 px-3.5 py-2.5 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={currentUser.isBlacklisted || currentUser.isMuted || isSendingMsg || !newMsgInput.trim()}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 shadow-sm transition-all ${accentClasses.bg} disabled:opacity-50`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingMsg ? '发送中' : '发送'}</span>
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">
              Sanfun Member System • 积分与等级安全保障
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              关闭窗口
            </button>
          </div>

        </div>
      </div>

      {/* Avatar Cropper Popup */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        initialImageUrl={editAvatar || currentUser?.avatar}
        onCropComplete={(croppedUrl) => {
          setEditAvatar(croppedUrl);
          if (!currentUser) setAvatarInput(croppedUrl);
          setIsCropperOpen(false);
        }}
      />
    </>
  );
};
