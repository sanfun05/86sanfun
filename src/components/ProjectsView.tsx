import React, { useState } from 'react';
import { Project } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ExternalLink, Github, Star, FolderGit2, Search, Code } from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ projects }) => {
  const { accentClasses } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['全部', 'Web 应用', '设计工具', '扩展插件'];

  const filteredProjects = projects.filter(p => {
    const matchesCat = selectedCategory === '全部' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-3.5">
      
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
            基于 React、TypeScript 及 Gemini 构建的应用系统与设计主题。
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="搜索项目..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-700/60 focus:outline-none w-full sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
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
              <div className="relative h-52 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={p.coverImage}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-black/50 backdrop-blur-md">
                  {p.category}
                </div>
                {p.stars && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-mono text-amber-300 bg-black/60 backdrop-blur-md flex items-center gap-1 border border-white/20">
                    <Star className="w-3 h-3 fill-amber-300" />
                    <span>{p.stars}</span>
                  </div>
                )}
              </div>

              {/* Info Area */}
              <div className="p-6">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5 tracking-tight">
                  {p.name}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                  {p.description}
                </p>

                {/* Tech Tags */}
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
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
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
  );
};
