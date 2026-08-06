import React, { useState, useEffect } from 'react';
import { 
  Link, CheckCircle2, XCircle, AlertCircle, Plus, Edit, Trash2, Globe, Clock, Search, ExternalLink, RefreshCw, X, Save
} from 'lucide-react';
import { FriendLink } from '../../types';

interface AdminFriendAuditManagerProps {
  onShowToast: (msg: string) => void;
}

export const AdminFriendAuditManager: React.FC<AdminFriendAuditManagerProps> = ({ onShowToast }) => {
  const [friends, setFriends] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [search, setSearch] = useState('');

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Edit / Add Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formRss, setFormRss] = useState('');

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/friends?all=true');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setFriends(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  // Approve Friend Link Application
  const handleApprove = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/friends/${id}/audit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '审核失败');

      onShowToast(`友链「${name}」已审核通过并即刻发布上线！`);
      fetchFriends();
    } catch (err: any) {
      alert(err.message || '网络连接失败');
    }
  };

  // Reject Friend Link Application
  const handleConfirmReject = async () => {
    if (!rejectTargetId) return;

    try {
      const res = await fetch(`/api/admin/friends/${rejectTargetId}/audit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejectReason: rejectReason.trim() || '未符合友链申请要求或链接失效'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '操作失败');

      onShowToast('已驳回该友链申请');
      setRejectModalOpen(false);
      setRejectReason('');
      fetchFriends();
    } catch (err: any) {
      alert(err.message || '网络连接失败');
    }
  };

  // Save Add / Edit
  const handleSaveFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) {
      alert('请填写博客名称与站点 URL！');
      return;
    }

    const payload = {
      name: formName.trim(),
      url: formUrl.trim(),
      avatar: formAvatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      description: formDesc.trim() || '极客个人独立博客',
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      rssUrl: formRss.trim() || undefined,
      status: 'approved'
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/friends/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '修改失败');
        onShowToast(`已更新友链「${formName.trim()}」`);
      } else {
        const res = await fetch('/api/admin/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '添加失败');
        onShowToast(`成功新增友链「${formName.trim()}」`);
      }
      setEditModalOpen(false);
      fetchFriends();
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  // Delete Friend
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要彻底删除友链「${name}」吗？`)) return;

    try {
      const res = await fetch(`/api/admin/friends/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      onShowToast(`友链「${name}」已被删除`);
      fetchFriends();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const pendingCount = friends.filter(f => f.status === 'pending').length;
  const approvedCount = friends.filter(f => f.status === 'approved' || !f.status).length;
  const rejectedCount = friends.filter(f => f.status === 'rejected').length;

  const filteredFriends = friends.filter(f => {
    if (activeTab === 'pending') return f.status === 'pending';
    if (activeTab === 'approved') return f.status === 'approved' || !f.status;
    if (activeTab === 'rejected') return f.status === 'rejected';
    return true;
  }).filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.url.toLowerCase().includes(search.toLowerCase()) ||
    (f.email && f.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80">
        <div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Link className="w-4 h-4 text-emerald-500" />
            <span>友情链接申请审核与目录管理</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            审查来自全站读者的友情链接申请、快速一键通过上线或填写驳回说明
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingId(null);
              setFormName('');
              setFormUrl('');
              setFormAvatar('');
              setFormDesc('');
              setFormTags('前端, 极客');
              setFormRss('');
              setEditModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>直接添加友链</span>
          </button>

          <button
            onClick={fetchFriends}
            disabled={loading}
            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="刷新"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>待审核申请 ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>已上线 ({approvedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>已驳回 ({rejectedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            全部 ({friends.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索友链/网址/邮箱..."
            className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs border border-zinc-200 dark:border-zinc-700"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredFriends.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs italic">
            暂无对应状态的友情链接记录
          </div>
        ) : (
          filteredFriends.map((f) => {
            const isPending = f.status === 'pending';
            const isRejected = f.status === 'rejected';

            return (
              <div key={f.id} className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-[260px] flex-1">
                  <img
                    src={f.avatar}
                    alt={f.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        {f.name}
                      </h4>
                      {isPending && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                          待审核
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                          已驳回
                        </span>
                      )}
                    </div>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>{f.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {f.description}
                    </p>

                    {f.appliedAt && (
                      <span className="text-[10px] text-zinc-400 block font-mono">
                        申请时间: {f.appliedAt} {f.email ? ` | 联系邮箱: ${f.email}` : ''}
                      </span>
                    )}

                    {isRejected && f.rejectReason && (
                      <p className="text-[11px] text-rose-500 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg mt-1 border border-rose-200 dark:border-rose-900">
                        驳回原因: {f.rejectReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Operations */}
                <div className="flex items-center gap-2">
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleApprove(f.id, f.name)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>一键同意发布</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectTargetId(f.id);
                          setRejectReason('');
                          setRejectModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 font-bold text-xs flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>驳回申请</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setEditingId(f.id);
                      setFormName(f.name);
                      setFormUrl(f.url);
                      setFormAvatar(f.avatar);
                      setFormDesc(f.description);
                      setFormTags(f.tags ? f.tags.join(', ') : '');
                      setFormRss(f.rssUrl || '');
                      setEditModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>编辑</span>
                  </button>

                  <button
                    onClick={() => handleDelete(f.id, f.name)}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10"
                    title="彻底删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>驳回友链申请说明</span>
              </h4>
              <button onClick={() => setRejectModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase">填写驳回原因说明</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="例如：站点无法正常访问 / 未提前添加本站友链..."
                className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                取消
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-xs"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleSaveFriend} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span>{editingId ? '编辑友情链接信息' : '手动添加友情链接'}</span>
              </h4>
              <button type="button" onClick={() => setEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">站点/博客名称 *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Sanfun 博客"
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">站点 URL 地址 *</label>
                <input
                  type="url"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://zhheo.com"
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">头像 / Logo 图标 URL</label>
                <input
                  type="text"
                  value={formAvatar}
                  onChange={(e) => setFormAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">站点一句话描述</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="分享全栈架构与 Bento 设计哲学"
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">标签分类 (逗号分隔)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="前端, 设计, 全栈"
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>保存友链</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
