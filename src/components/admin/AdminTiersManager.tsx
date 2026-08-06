import React, { useState, useEffect } from 'react';
import { 
  Award, Crown, Sparkles, Star, Zap, Shield, Flame, Gem, Trophy, Heart, Plus, Edit, Trash2, CheckCircle2, Save, X, RefreshCw
} from 'lucide-react';
import { MemberTier } from '../../types';

interface AdminTiersManagerProps {
  onShowToast: (msg: string) => void;
}

const PRESET_ICONS = [
  { name: 'Award', Icon: Award },
  { name: 'Crown', Icon: Crown },
  { name: 'Sparkles', Icon: Sparkles },
  { name: 'Star', Icon: Star },
  { name: 'Zap', Icon: Zap },
  { name: 'Shield', Icon: Shield },
  { name: 'Flame', Icon: Flame },
  { name: 'Gem', Icon: Gem },
  { name: 'Trophy', Icon: Trophy },
  { name: 'Heart', Icon: Heart }
];

const PRESET_GRADIENTS = [
  { label: '经典极光蓝', value: 'from-blue-500 to-indigo-500', badgeBg: 'bg-blue-50 dark:bg-blue-950/50', textColor: 'text-blue-600 dark:text-blue-400' },
  { label: '青翠白银', value: 'from-teal-500 to-emerald-600', badgeBg: 'bg-teal-50 dark:bg-teal-950/50', textColor: 'text-teal-600 dark:text-teal-400' },
  { label: '璀璨黄金', value: 'from-amber-500 to-orange-500', badgeBg: 'bg-amber-50 dark:bg-amber-950/50', textColor: 'text-amber-600 dark:text-amber-400' },
  { label: '幻彩紫钻', value: 'from-purple-600 to-indigo-600', badgeBg: 'bg-purple-50 dark:bg-purple-950/50', textColor: 'text-purple-600 dark:text-purple-400' },
  { label: '炫彩星耀', value: 'from-purple-500 to-pink-600', badgeBg: 'bg-pink-50 dark:bg-pink-950/50', textColor: 'text-pink-600 dark:text-pink-400' },
  { label: '荣耀至尊三色', value: 'from-amber-400 via-rose-500 to-indigo-600', badgeBg: 'bg-rose-50 dark:bg-rose-950/50', textColor: 'text-rose-600 dark:text-rose-400' },
  { label: '冠世黑金皇冠', value: 'from-amber-300 via-yellow-400 to-amber-600', badgeBg: 'bg-yellow-50 dark:bg-yellow-950/50', textColor: 'text-amber-600 dark:text-amber-300' }
];

export const AdminTiersManager: React.FC<AdminTiersManagerProps> = ({ onShowToast }) => {
  const [tiers, setTiers] = useState<MemberTier[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit / Add Form State
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierName, setTierName] = useState('');
  const [tierLevelNum, setTierLevelNum] = useState(1);
  const [tierIcon, setTierIcon] = useState('Award');
  const [tierColorGroup, setTierColorGroup] = useState(PRESET_GRADIENTS[0]);
  const [tierRequiredPoints, setTierRequiredPoints] = useState(0);
  const [tierPerksText, setTierPerksText] = useState('');

  const [modalOpen, setModalOpen] = useState(false);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/member-tiers');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setTiers(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingTierId(null);
    setTierName('Lv.8 创世至尊 VIP');
    setTierLevelNum(8);
    setTierIcon('Crown');
    setTierColorGroup(PRESET_GRADIENTS[6]);
    setTierRequiredPoints(1000);
    setTierPerksText('全站付费资源终身无门槛解锁\n专属 1v1 站长技术辅导与答疑\n特制流光动效名片与红黑金勋章');
    setModalOpen(true);
  };

  const handleOpenEditModal = (tier: MemberTier) => {
    setEditingTierId(tier.id);
    setTierName(tier.name);
    setTierLevelNum(tier.levelNumeric);
    setTierIcon(tier.icon);
    const matchedPreset = PRESET_GRADIENTS.find(g => g.value === tier.color) || PRESET_GRADIENTS[0];
    setTierColorGroup(matchedPreset);
    setTierRequiredPoints(tier.requiredPoints);
    setTierPerksText(tier.perks ? tier.perks.join('\n') : '');
    setModalOpen(true);
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierName.trim()) {
      alert('请填写等级名称！');
      return;
    }

    const perksArray = tierPerksText
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean);

    const payload = {
      name: tierName.trim(),
      levelNumeric: Number(tierLevelNum),
      icon: tierIcon,
      color: tierColorGroup.value,
      badgeBg: tierColorGroup.badgeBg,
      textColor: tierColorGroup.textColor,
      requiredPoints: Number(tierRequiredPoints),
      perks: perksArray
    };

    try {
      if (editingTierId) {
        const res = await fetch(`/api/admin/tiers/${editingTierId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '更新失败');
        onShowToast(`成功修改等级配置「${tierName.trim()}」！`);
      } else {
        const res = await fetch('/api/admin/tiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '创建失败');
        onShowToast(`成功新增等级配置「${tierName.trim()}」！`);
      }
      setModalOpen(false);
      fetchTiers();
    } catch (err: any) {
      alert(err.message || '网络连接失败');
    }
  };

  const handleDeleteTier = async (id: string, name: string) => {
    if (!confirm(`确定要删除等级「${name}」的配置吗？`)) return;

    try {
      const res = await fetch(`/api/admin/tiers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '删除失败');
      onShowToast(`等级配置「${name}」已被移除`);
      fetchTiers();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const renderPresetIcon = (iconName: string) => {
    const found = PRESET_ICONS.find(i => i.name === iconName);
    const IconComp = found ? found.Icon : Award;
    return <IconComp className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80">
        <div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>会员等级体系与专属特权自定义配置</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            可自由增删改会员等级、分配预设图标与高保真渐变颜色、设定晋升积分门槛与特权明细
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>新增会员等级</span>
        </button>
      </div>

      {/* Tiers Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tiers.map((tier) => (
          <div key={tier.id} className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 relative shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs flex items-center gap-1.5 bg-gradient-to-r ${tier.color} text-white shadow-xs`}>
                  {renderPresetIcon(tier.icon)}
                  <span>{tier.name}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-zinc-400">
                  需要 {tier.requiredPoints} 积分
                </span>
              </div>

              <ul className="text-xs text-zinc-600 dark:text-zinc-300 space-y-1 pt-1">
                {tier.perks.map((perk, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
              <button
                onClick={() => handleOpenEditModal(tier)}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1"
              >
                <Edit className="w-3 h-3" />
                <span>编辑特权</span>
              </button>

              <button
                onClick={() => handleDeleteTier(tier.id, tier.name)}
                className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold hover:bg-rose-500/20"
                title="删除等级"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Tier Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form onSubmit={handleSaveTier} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{editingTierId ? '编辑会员等级与专属特权' : '新增会员等级配置'}</span>
              </h4>
              <button type="button" onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">等级名称 *</label>
                  <input
                    type="text"
                    required
                    value={tierName}
                    onChange={(e) => setTierName(e.target.value)}
                    placeholder="例如：Lv.5 星耀 VIP"
                    className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">数值级别 (Numeric)</label>
                  <input
                    type="number"
                    required
                    value={tierLevelNum}
                    onChange={(e) => setTierLevelNum(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">选择预设图标</label>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    {PRESET_ICONS.map(({ name, Icon }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setTierIcon(name)}
                        className={`p-2 rounded-lg border transition-colors ${
                          tierIcon === name
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                        }`}
                        title={name}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-400 uppercase">门槛积分 (Required Points)</label>
                  <input
                    type="number"
                    value={tierRequiredPoints}
                    onChange={(e) => setTierRequiredPoints(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">选着渐变色调主题</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {PRESET_GRADIENTS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setTierColorGroup(g)}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all flex items-center justify-between ${
                        tierColorGroup.value === g.value
                          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                          : 'border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded-full text-[10px] text-white bg-gradient-to-r ${g.value}`}>
                        {g.label}
                      </span>
                      {tierColorGroup.value === g.value && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">专属特权清单 (每行一项)</label>
                <textarea
                  rows={4}
                  value={tierPerksText}
                  onChange={(e) => setTierPerksText(e.target.value)}
                  placeholder="免费畅读全站付费文章&#10;8折兑换源码附件&#10;专属身份勋章"
                  className="w-full mt-1 p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>保存配置</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
