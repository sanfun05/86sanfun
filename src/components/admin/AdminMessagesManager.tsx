import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, RefreshCw, AlertCircle, Check, Clock } from 'lucide-react';
import { DirectMessage } from '../../types';

interface AdminMessagesManagerProps {
  onShowToast: (msg: string) => void;
}

export const AdminMessagesManager: React.FC<AdminMessagesManagerProps> = ({ onShowToast }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data: DirectMessage[] = await res.json();
          setMessages(data);
          if (!selectedMemberId && data.length > 0) {
            setSelectedMemberId(data[0].memberId);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Group messages by member
  const threadsMap = new Map<string, { memberId: string; memberName: string; memberAvatar: string; lastMsg: DirectMessage; unreadCount: number; list: DirectMessage[] }>();

  messages.forEach(msg => {
    const thread = threadsMap.get(msg.memberId);
    if (!thread) {
      threadsMap.set(msg.memberId, {
        memberId: msg.memberId,
        memberName: msg.memberName,
        memberAvatar: msg.memberAvatar,
        lastMsg: msg,
        unreadCount: (!msg.readByAdmin && msg.sender === 'user') ? 1 : 0,
        list: [msg]
      });
    } else {
      thread.list.push(msg);
      thread.lastMsg = msg;
      if (!msg.readByAdmin && msg.sender === 'user') {
        thread.unreadCount += 1;
      }
    }
  });

  const threads = Array.from(threadsMap.values());
  const activeThread = selectedMemberId ? threadsMap.get(selectedMemberId) : threads[0];

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyInput.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: activeThread.memberId,
          memberName: activeThread.memberName,
          memberAvatar: activeThread.memberAvatar,
          sender: 'admin',
          content: replyInput.trim()
        })
      });
      if (!res.ok) {
        const text = await res.text();
        let errMsg = '回复发送失败';
        try {
          const errJson = JSON.parse(text);
          if (errJson.error) errMsg = errJson.error;
        } catch {}
        throw new Error(errMsg);
      }
      const data = await res.json();

      onShowToast(`已对会员「${activeThread.memberName}」发送站长官方回复！`);
      setReplyInput('');
      fetchMessages();
    } catch (err: any) {
      alert(err.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80">
        <div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span>会员私信留言与双向互动中心</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            在此接收并直接答复会员的私信咨询、技术求助与权限申请
          </p>
        </div>

        <button
          onClick={fetchMessages}
          disabled={loading}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新消息</span>
        </button>
      </div>

      {/* Main Grid: Left Member Threads, Right Chat Stream */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[520px]">
        {/* Left Thread List */}
        <div className="md:col-span-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/80 flex flex-col">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 font-bold text-xs text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-200 dark:border-zinc-800">
            私信列表 ({threads.length} 人对话)
          </div>

          {threads.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 italic">
              暂未收到会员私信
            </div>
          ) : (
            threads.map((t) => {
              const isSelected = activeThread?.memberId === t.memberId;
              return (
                <button
                  key={t.memberId}
                  onClick={() => setSelectedMemberId(t.memberId)}
                  className={`p-3 text-left w-full transition-colors flex items-start gap-2.5 ${
                    isSelected ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <img
                    src={t.memberAvatar}
                    alt={t.memberName}
                    className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {t.memberName}
                      </span>
                      {t.unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                          {t.unreadCount} 未读
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {t.lastMsg.content}
                    </p>
                    <span className="text-[9px] text-zinc-400 font-mono block mt-1">
                      {t.lastMsg.createdAt}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Active Chat */}
        <div className="md:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between overflow-hidden">
          {activeThread ? (
            <>
              {/* Active Header */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeThread.memberAvatar}
                    alt={activeThread.memberName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {activeThread.memberName}
                    </h4>
                    <span className="text-[10px] text-zinc-400">会员 ID: {activeThread.memberId}</span>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-indigo-500 font-bold">
                  记录共 {activeThread.list.length} 条
                </span>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                {activeThread.list.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div key={msg.id} className={`flex items-start gap-2.5 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      {!isAdmin && (
                        <img
                          src={msg.memberAvatar}
                          alt={msg.memberName}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      )}

                      <div className={`max-w-[75%] space-y-1 ${isAdmin ? 'items-end flex flex-col' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <span>{isAdmin ? '站长 Sanfun (您)' : msg.memberName}</span>
                          <span>•</span>
                          <span>{msg.createdAt}</span>
                        </div>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isAdmin
                            ? 'bg-indigo-600 text-white rounded-tr-xs'
                            : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/80 rounded-tl-xs'
                        }`}>
                          {msg.content}
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-indigo-500/30">
                          博
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder={`回复会员「${activeThread.memberName}」...`}
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  disabled={sending || !replyInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? '发送中' : '回复'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto text-center text-zinc-400 text-xs">
              请在左侧选择对话会员
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
