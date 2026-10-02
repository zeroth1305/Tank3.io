import React from 'react';
import { PlayerStats, StatKey } from '../types/game.ts';
import { Heart, Shield, Zap, Crosshair, Sparkles, Flame, RefreshCw, Gauge } from 'lucide-react';

interface StatsPanelProps {
  stats: PlayerStats;
  points: number;
  maxStat: number;
  onUpgrade: (stat: StatKey) => void;
  isSmasher?: boolean;
}

interface StatMeta {
  key: StatKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  barColor: string;
  desc: string;
  keyNumber: number;
}

const STAT_METAS: StatMeta[] = [
  {
    key: 'regen',
    label: 'Hồi Máu',
    icon: <Heart className="w-3.5 h-3.5" />,
    color: 'text-rose-400',
    barColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    desc: 'Tăng tốc độ tự hồi phục sinh lực khi không bị tấn công',
    keyNumber: 1,
  },
  {
    key: 'health',
    label: 'Máu Tối Đa',
    icon: <Shield className="w-3.5 h-3.5" />,
    color: 'text-emerald-400',
    barColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
    desc: 'Gia tăng lượng máu tối đa cho chiến xa',
    keyNumber: 2,
  },
  {
    key: 'bodyDamage',
    label: 'Sát Thương Thân',
    icon: <Flame className="w-3.5 h-3.5" />,
    color: 'text-amber-400',
    barColor: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    desc: 'Sát thương khi va chạm trực tiếp với kẻ địch hoặc hình khối',
    keyNumber: 3,
  },
  {
    key: 'bulletSpeed',
    label: 'Tốc Độ Đạn',
    icon: <Zap className="w-3.5 h-3.5" />,
    color: 'text-cyan-400',
    barColor: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
    desc: 'Đạn bay nhanh hơn và tăng tầm bắn hiệu quả',
    keyNumber: 4,
  },
  {
    key: 'bulletPen',
    label: 'Độ Xuyên Thấu',
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: 'text-indigo-400',
    barColor: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]',
    desc: 'Tăng lượng máu của viên đạn để xuyên qua đạn địch và vật thể',
    keyNumber: 5,
  },
  {
    key: 'bulletDamage',
    label: 'Uy Lực Đạn',
    icon: <Crosshair className="w-3.5 h-3.5" />,
    color: 'text-purple-400',
    barColor: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
    desc: 'Gia tăng sát thương mỗi khi đạn bắn trúng',
    keyNumber: 6,
  },
  {
    key: 'reload',
    label: 'Tốc Độ Nạp Đạn',
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    color: 'text-blue-400',
    barColor: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
    desc: 'Giảm thời gian giãn cách giữa các loạt bắn',
    keyNumber: 7,
  },
  {
    key: 'speed',
    label: 'Tốc Độ Di Chuyển',
    icon: <Gauge className="w-3.5 h-3.5" />,
    color: 'text-teal-400',
    barColor: 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]',
    desc: 'Gia tăng tốc độ cơ động của động cơ chiến xa',
    keyNumber: 8,
  },
];

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  points,
  maxStat,
  onUpgrade,
  isSmasher = false,
}) => {
  return (
    <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-3 shadow-2xl w-72 text-xs select-none transition-all">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>NÂNG CẤP KỸ NĂNG</span>
        </div>
        {points > 0 ? (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[11px] animate-pulse border border-amber-500/40">
            +{points} ĐIỂM
          </span>
        ) : (
          <span className="text-slate-400 text-[10px]">Hết điểm</span>
        )}
      </div>

      <div className="space-y-1.5">
        {STAT_METAS.map((meta) => {
          const isBulletStat = ['bulletSpeed', 'bulletPen', 'bulletDamage', 'reload'].includes(meta.key);
          const disabledBySmasher = isSmasher && isBulletStat;
          const value = stats[meta.key] || 0;
          const isMaxed = value >= maxStat;
          const canUpgrade = points > 0 && !isMaxed && !disabledBySmasher;

          return (
            <div
              key={meta.key}
              title={meta.desc}
              className={`flex items-center gap-2 px-1.5 py-1 rounded transition-colors ${
                canUpgrade ? 'hover:bg-slate-800/60 cursor-pointer' : 'opacity-85'
              }`}
              onClick={() => canUpgrade && onUpgrade(meta.key)}
            >
              <div className="flex items-center gap-1 w-28 shrink-0">
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1 py-0.5 rounded">
                  {meta.keyNumber}
                </span>
                <span className={`${meta.color} font-medium text-[11px] truncate`}>
                  {meta.label}
                </span>
              </div>

              {/* Pip bar */}
              <div className="flex-1 flex gap-0.5 items-center">
                {Array.from({ length: maxStat }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 flex-1 rounded-xs transition-all duration-150 ${
                      i < value
                        ? meta.barColor
                        : 'bg-slate-800 border border-slate-700/50'
                    }`}
                  />
                ))}
              </div>

              {/* Plus button */}
              <button
                disabled={!canUpgrade}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canUpgrade) onUpgrade(meta.key);
                }}
                className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs transition-all ${
                  canUpgrade
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-40'
                }`}
              >
                +
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center px-1">
        <span>Phím tắt: [1] - [8]</span>
        <span>Cấp tối đa: {maxStat}</span>
      </div>
    </div>
  );
};
