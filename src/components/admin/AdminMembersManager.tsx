import React, { useState, useEffect } from 'react';
import { 
  User, Shield, ShieldAlert, ShieldCheck, VolumeX, Volume2, Edit, AlertTriangle, 
  Search, MessageSquare, Coins, Award, RefreshCw, Trash2, CheckCircle2, AlertCircle, X, Send, Eye, FileText
} from 'lucide-react';
import { UserMember } from '../../types';

interface AdminMembersManagerProps {
  onShowToast: (msg: string) => void;
}

export const AdminMembersManager: React.FC<AdminMembersManagerProps> = ({ onShowToast }) => {
  const [members, setMembers] = useState<UserMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Member for operations
  const [selectedMember, setSelectedMember] = useState<UserMember | null>(null);

  // Operation Modals
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const [muteModalOpen, setMuteModalOpen] = useState(false);
  const [muteReason, setMuteReason] = useState('');

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjLevelNum, setAdjLevelNum] = useState(1);
  const [adjCredits, setAdjCredits] = useState(30);
  const [adjExp, setAdjExp] = useState(30);

  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningText, setWarningText] = useState('');
  const [warningType, setWarningType] = useState<'warning' | 'info' | 'notice'>('warning');

  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [memberComments, setMemberComments] = useState<Array<{ articleId: string; articleTitle: string; comment: any }>>([]);
  const [fetchingComments, setFetchingComments] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/members');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setMembers(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Block / Unblock Member
  const handleToggleBlock = async () => {
    if (!selectedMember) return;
    const isTargetBlacklisted = !selectedMember.isBlacklisted;

    try {
      const res = await fetch(`/api/admin/members/${selectedMember.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBlacklisted: isTargetBlacklisted,
          blacklistReason: isTargetBlacklisted ? (blockReason.trim() || '违反社区发言规范') : ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '状态更新失败');
      onShowToast(isTargetBlacklisted ? `已成功拉黑/封禁会员「${selectedMember.username}」` : `已成功解封会员「${selectedMember.username}」`);
      setBlockModalOpen(false);
      setBlockReason('');
      fetchMembers();
    } catch (err: any) {
      alert(err.message || '网络连接失败');
    }
  };

  // Mute / Unmute Member
  const handleToggleMute = async () => {
    if (!selectedMember) return;
    const isTargetMuted = !selectedMember.isMuted;

    try {
      const res = await fetch(`/api/admin/members/${selectedMember.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isMuted: isTargetMuted,
          muteReason: isTargetMuted ? (muteReason.trim() || '发表不良言论，暂停发言特权') : ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '禁言状态更新失败');
      onShowToast(isTargetMuted ? `已对会员「${selectedMember.username}」开启禁言` : `已解禁会员「${selectedMember.username}」`);
      setMuteModalOpen(false);
      setMuteReason('');
      fetchMembers();
    } catch (err: any) {
      alert(err.message || '网络连接失败');
    }
  };

  // Adjust Level & Credits
  const handleSaveAdjust = async () => {
    if (!selectedMember) return;

    try {
      const res = await fetch(`/api/admin/members/${selectedMember.id}/adjust`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          levelNumeric: adjLevelNum,
          credits: adjCredits,
          exp: adjExp
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '调节失败');
      onShowToast(`已成功调整会员「${selectedMember.username}」的等级与积分权益！`);
      setAdjustModalOpen(false);
      fetchMembers();
    } catch (err: any) {
      alert(err.message || '网络连接失败');
    }
  };

  // Send Warning / Reminder Note
  const handleSendWarningNote = async () => {
    if (!selectedMember) return;
    if (!warningText.trim()) {
      alert('请填写要发送给会员的提醒警示内容！');
      return;
    }

    try {
      const res = await fetch(`/api/admin/members/${selectedMember.id}/warning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: warningText.trim(),
          type: warningType
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '提醒发送失败');
      onShowToast(`已发送站长提醒警示至「${selectedMember.username}」会员中心！`);
      setWarningModalOpen(false);
      setWarningText('');
      fetchMembers();
    } catch (err: any) {
      alert(err.message || '网络连接失败');
    }
  };

  // Inspect Comments
  const handleInspectComments = async (member: UserMember) => {
    setSelectedMember(member);
    setCommentsModalOpen(true);
    setFetchingComments(true);
    try {
      const res = await fetch(`/api/admin/members/${member.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setMemberComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingComments(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定清理这条不良发言/评论吗？此操作不可恢复。')) return;

    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '删除失败');
      onShowToast('不良发言已被清理！');
      if (selectedMember) {
        handleInspectComments(selectedMember);
      }
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const filteredMembers = members.filter(m => 
    m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80">
        <div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            <span>会员管理与黑名单/禁言系统</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            管理员可对全站会员进行拉黑、禁言、手动调节等级积分、发送提醒通知与不良发言治理
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索用户名/邮箱/等级..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={fetchMembers}
            disabled={loading}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="刷新会员数据"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Member Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
          <thead className="bg-zinc-100/80 dark:bg-zinc-800/80 text-[11px] font-bold text-zinc-500 uppercase border-b border-zinc-200 dark:border-zinc-700">
            <tr>
              <th className="p-3">会员账号</th>
              <th className="p-3">会员等级</th>
              <th className="p-3">积分 / 经验</th>
              <th className="p-3">注册时间</th>
              <th className="p-3">互动状态</th>
              <th className="p-3 text-right">管理操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-400 italic">
                  未找到相关会员记录
                </td>
              </tr>
            ) : (
              filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.avatar}
                        alt={m.username}
                        className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700"
                      />
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                          <span>{m.username}</span>
                          {m.isBlacklisted && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                              已拉黑
                            </span>
                          )}
                          {m.isMuted && !m.isBlacklisted && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                              已禁言
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-mono">{m.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] border border-indigo-200/50 dark:border-indigo-800/50">
                      {m.level || `Lv.${m.levelNumeric || 1}`}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                        <Coins className="w-3 h-3" />
                        {m.credits || 0}
                      </span>
                      <span className="text-zinc-400">/</span>
                      <span className="text-indigo-500 font-medium">
                        EXP: {m.exp || 0}
                      </span>
                    </div>
                  </td>

                  <td className="p-3 text-[11px] text-zinc-400 font-mono">
                    {m.createdAt || '近期'}
                  </td>

                  <td className="p-3">
                    {m.isBlacklisted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        拉黑封禁中
                      </span>
                    ) : m.isMuted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                        <VolumeX className="w-3.5 h-3.5" />
                        禁言发言中
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        正常互动
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {/* Blacklist Toggle */}
                      <button
                        onClick={() => {
                          setSelectedMember(m);
                          setBlockReason(m.blacklistReason || '');
                          setBlockModalOpen(true);
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors ${
                          m.isBlacklisted
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20'
                        }`}
                        title={m.isBlacklisted ? '取消拉黑' : '拉黑封禁'}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>{m.isBlacklisted ? '解封' : '拉黑'}</span>
                      </button>

                      {/* Mute Toggle */}
                      <button
                        onClick={() => {
                          setSelectedMember(m);
                          setMuteReason(m.muteReason || '');
                          setMuteModalOpen(true);
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors ${
                          m.isMuted
                            ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                        }`}
                        title={m.isMuted ? '取消禁言' : '开启禁言'}
                      >
                        <VolumeX className="w-3 h-3" />
                        <span>{m.isMuted ? '解禁' : '禁言'}</span>
                      </button>

                      {/* Adjust Stats */}
                      <button
                        onClick={() => {
                          setSelectedMember(m);
                          setAdjLevelNum(m.levelNumeric || 1);
                          setAdjCredits(m.credits || 0);
                          setAdjExp(m.exp || 0);
                          setAdjustModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-md text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 flex items-center gap-1"
                        title="手动调节等级与积分"
                      >
                        <Edit className="w-3 h-3" />
                        <span>调节等级</span>
                      </button>

                      {/* Send Warning Note */}
                      <button
                        onClick={() => {
                          setSelectedMember(m);
                          setWarningText('');
                          setWarningModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-md text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 flex items-center gap-1"
                        title="留言提醒与安全警示"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>提醒</span>
                      </button>

                      {/* Inspect Comments */}
                      <button
                        onClick={() => handleInspectComments(m)}
                        className="px-2 py-1 rounded-md text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1"
                        title="查看与审计评论"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>查看评论</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Blacklist Modal */}
      {blockModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>{selectedMember.isBlacklisted ? '解除拉黑封禁' : '拉黑与账号封禁'}</span>
              </h4>
              <button onClick={() => setBlockModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              目标会员：<span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedMember.username}</span> ({selectedMember.email})
            </p>

            {!selectedMember.isBlacklisted && (
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">封禁/拉黑原因说明</label>
                <textarea
                  rows={3}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="请输入拉黑原因（例如：多次发表不当言论，违反社区规定...）"
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setBlockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                取消
              </button>
              <button
                onClick={handleToggleBlock}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs ${
                  selectedMember.isBlacklisted ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {selectedMember.isBlacklisted ? '确认解封账号' : '确认执行拉黑'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Mute Modal */}
      {muteModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <VolumeX className="w-4 h-4 text-amber-500" />
                <span>{selectedMember.isMuted ? '解除禁言状态' : '开启禁言限制'}</span>
              </h4>
              <button onClick={() => setMuteModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              目标会员：<span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedMember.username}</span>
            </p>

            {!selectedMember.isMuted && (
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">禁言原因说明</label>
                <textarea
                  rows={3}
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                  placeholder="请输入禁言原因（例如：发言不文明，暂停发言权限...）"
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMuteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                取消
              </button>
              <button
                onClick={handleToggleMute}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs ${
                  selectedMember.isMuted ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {selectedMember.isMuted ? '确认解除禁言' : '确认开启禁言'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Adjust Stats Modal */}
      {adjustModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Edit className="w-4 h-4 text-indigo-500" />
                <span>手动调节会员等级与积分</span>
              </h4>
              <button onClick={() => setAdjustModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              正在修改：<span className="font-bold text-indigo-500">{selectedMember.username}</span> 的账户数值
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">数值等级 (Level Numeric)</label>
                <select
                  value={adjLevelNum}
                  onChange={(e) => setAdjLevelNum(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700"
                >
                  <option value={1}>Lv.1 普通会员</option>
                  <option value={2}>Lv.2 白银会员</option>
                  <option value={3}>Lv.3 黄金会员</option>
                  <option value={4}>Lv.4 钻石会员</option>
                  <option value={5}>Lv.5 星耀 VIP</option>
                  <option value={6}>Lv.6 荣耀 SVIP</option>
                  <option value={7}>Lv.7 冠世至尊 SVIP</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">积分余额 (Credits)</label>
                <input
                  type="number"
                  value={adjCredits}
                  onChange={(e) => setAdjCredits(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">经验值 (EXP)</label>
                <input
                  type="number"
                  value={adjExp}
                  onChange={(e) => setAdjExp(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                取消
              </button>
              <button
                onClick={handleSaveAdjust}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xs"
              >
                保存调整
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Warning Note Modal */}
      {warningModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-500" />
                <span>发送留言提醒与不良发言警示</span>
              </h4>
              <button onClick={() => setWarningModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              接收对象：<span className="font-bold text-purple-500">{selectedMember.username}</span> (将直达其会员中心首页)
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">提醒类型</label>
                <select
                  value={warningType}
                  onChange={(e) => setWarningType(e.target.value as any)}
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700"
                >
                  <option value="warning">⚠️ 不良发言与社区规范警告</option>
                  <option value="info">💡 系统通知与特权变动提醒</option>
                  <option value="notice">📢 站长个性留言消息</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">提醒/警示正文内容 *</label>
                <textarea
                  rows={3}
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  placeholder="例如：您在《React 19》文章下的留言包含敏感词，请文明发言..."
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setWarningModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                取消
              </button>
              <button
                onClick={handleSendWarningNote}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>立即发送提醒</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Comments Inspection Modal */}
      {commentsModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 shrink-0">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span>审计会员「{selectedMember.username}」发言历史</span>
              </h4>
              <button onClick={() => setCommentsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {fetchingComments ? (
                <div className="py-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>正在检索全站发言记录...</span>
                </div>
              ) : memberComments.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs italic">
                  该会员暂未在全站发表过评论留言
                </div>
              ) : (
                memberComments.map(item => (
                  <div key={item.comment.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[70%]">
                        文章：{item.articleTitle}
                      </span>
                      <span className="text-[10px] text-zinc-400">{item.comment.date}</span>
                    </div>

                    <p className="text-xs text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      {item.comment.content}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400">
                      <span>位置: {item.comment.location || '未知'} | 设备: {item.comment.os} {item.comment.browser}</span>
                      <button
                        onClick={() => handleDeleteComment(item.comment.id)}
                        className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-500/20 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>清理违规言论</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
              <button
                onClick={() => setCommentsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                关闭审计窗口
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
