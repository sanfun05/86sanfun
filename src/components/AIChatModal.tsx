import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, Send, Bot, Sparkles, User, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose }) => {
  const { accentClasses } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "你好！我是 **Sanfun AI**（智能小Sanfun）🤖。你可以问我关于 Sanfun 的博客文章、Bento UI 设计原则、React 19 或开发设备配置的任何问题！"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (userMsg?: string) => {
    const query = userMsg || input.trim();
    if (!query || loading) return;

    const updatedMessages: Message[] = [...messages, { role: 'user', content: query }];
    setMessages(updatedMessages);
    if (!userMsg) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: updatedMessages.slice(-6)
        })
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: "抱歉，我现在回答这个问题遇到了一些麻烦。" }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "无法连接到 Sanfun AI 服务器。" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "总结关于 Bento UI 设计的文章",
    "Sanfun 使用什么硬件配置？",
    "如何构建服务侧 Gemini 3.6 Flash 接口？"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-lg w-full max-w-xl h-[600px] flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-md text-white ${accentClasses.bg}`}>
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Sanfun AI 助手</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Gemini 3.6
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                感知上下文的数字花园助手
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className={`w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center text-white text-xs ${accentClasses.bg}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-lg text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? `${accentClasses.bg} text-white rounded-tr-xs`
                    : 'bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-700/50 rounded-tl-xs'
                }`}
              >
                <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </Markdown>
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-md flex-shrink-0 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 text-xs font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-indigo-500 dark:text-indigo-400 font-medium py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Sanfun AI 正在思考中...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800/60 overflow-x-auto flex gap-1.5 bg-zinc-50/50 dark:bg-zinc-900/50">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 whitespace-nowrap transition-colors"
            >
              ✨ {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="向 Sanfun AI 提问..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-lg text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`p-2.5 rounded-lg text-white transition-all ${accentClasses.bg} disabled:opacity-40`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
