import React, { useState } from 'react';
import { EquipmentItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Monitor, Laptop, Keyboard, Zap, Layout, Code, Star, CheckCircle2, ShieldCheck } from 'lucide-react';

interface EquipmentViewProps {
  equipment: EquipmentItem[];
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({ equipment }) => {
  const { accentClasses } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');

  const categories = ['全部', '核心硬件', '桌面搭建', '效率软件', '开发工具'];

  const filteredEquipment = equipment.filter(e =>
    selectedCategory === '全部' || e.category === selectedCategory
  );

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
    <div className="space-y-3.5">
      
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
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
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
  );
};
