import React, { useState } from 'react';
import { EquipmentItem, Project } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Monitor, Laptop, Keyboard, Zap, Layout, Code, Star, CheckCircle2, ShieldCheck, FolderGit2, Search, ExternalLink, Github, Sparkles } from 'lucide-react';

interface EquipmentViewProps {
  equipment: EquipmentItem[];
  projects?: Project[];
  defaultSubTab?: 'projects' | 'equipment';
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({ equipment, projects = [], defaultSubTab = 'projects' }) => {
  const { accentClasses } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'equipment'>(defaultSubTab);
  
  // Equipment States
  const [selectedEqCategory, setSelectedEqCategory] = useState<string>('全部');
  const eqCategories = ['全部', '核心硬件', '桌面搭建', '效率软件', '开发工具'];

  // Projects States
  const [selectedProjCategory, setSelectedProjCategory] = useState<string>('全部');
  const [projSearchTerm, setProjSearchTerm] = useState<string>('');
  const projCategories = ['全部', 'Web 应用', '设计工具', '扩展插件'];

  const filteredEquipment = equipment.filter(e =>
    selectedEqCategory === '全部' || e.category === selectedEqCategory
  );

  const filteredProjects = projects.filter(p => {
    const matchesCat = selectedProjCategory === '全部' || p.category === selectedProjCategory;
    const matchesSearch = p.name.toLowerCase().includes(projSearchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(projSearchTerm.toLowerCase()) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(projSearchTerm.toLowerCase())));
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case '核心硬件': return Laptop;
      case '桌面搭建': return Keyboard;
      case '效率软件': return Layout;
      case '开发工具': return Code;
      default: return Monitor;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Switcher: Mine Page Sub-tabs */}
      <div className="flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'projects'
                ? `${accentClasses.bg} text-white shadow-xs`
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>我的项目 ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('equipment')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'equipment'
                ? `${accentClasses.bg} text-white shadow-xs`
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>生产力装备 ({equipment.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 pr-3 text-[11px] text-zinc-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>个人作品与桌面设施一览</span>
        </div>
      </div>

      {/* SUB-TAB 1: PROJECTS VIEW */}
      {activeSubTab === 'projects' && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mb-2">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>开源与独立产品</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                精选独立项目与实用工具
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                基于 React、TypeScript 及 Gemini AI 构建的应用系统、开源库与设计主题。
              </p>
            </div>

            {/* Filter Bar & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="搜索项目..."
                  value={projSearchTerm}
                  onChange={(e) => setProjSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60 focus:outline-none w-full sm:w-48"
                />
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {projCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedProjCategory(cat)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedProjCategory === cat
                    ? `${accentClasses.bg} text-white shadow-sm`
                    : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group"
              >
                <div>
                  {/* Cover Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img
                      src={p.coverImage}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/50 backdrop-blur-md">
                      {p.category}
                    </div>
                    {p.stars !== undefined && p.stars > 0 && (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-mono text-amber-300 bg-black/60 backdrop-blur-md flex items-center gap-1 border border-white/20">
                        <Star className="w-3 h-3 fill-amber-300" />
                        <span>{p.stars}</span>
                      </div>
                    )}
                  </div>

                  {/* Info Area */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5 tracking-tight">
                      {p.name}
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                      {p.description}
                    </p>

                    {/* Tech Tags */}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="p-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  {p.githubUrl ? (
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>开源代码</span>
                    </a>
                  ) : <div />}

                  {p.demoUrl && (
                    <a
                      href={p.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white ${accentClasses.bg}`}
                    >
                      <span>在线体验</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EQUIPMENT VIEW */}
      {activeSubTab === 'equipment' && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 mb-2">
                <Monitor className="w-3.5 h-3.5" />
                <span>工作站与硬件矩阵</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                生产力装备与软件工具
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                精选的桌面搭建、客制化机械键盘、5K 视网膜显示器与高效率开发软件。
              </p>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {eqCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedEqCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedEqCategory === cat
                      ? `${accentClasses.bg} text-white shadow-sm`
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredEquipment.map((item) => {
              const CatIcon = getCategoryIcon(item.category);
              return (
                <div
                  key={item.id}
                  className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-lg p-6 sm:p-6.5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-md group"
                >
                  <div>
                    {/* Image or Icon Container */}
                    {item.imageUrl ? (
                      <div className="relative h-48 w-full mb-4 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/60 backdrop-blur-md">
                          {item.category}
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-zinc-700 dark:text-zinc-300">
                        <CatIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {item.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <span className="text-[11px] font-mono text-zinc-400">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
