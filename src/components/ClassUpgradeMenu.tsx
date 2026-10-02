import React from 'react';
import { TankClass } from '../types/game.ts';
import { TANK_CLASSES } from '../constants/classes.ts';
import { ArrowUpCircle, Shield, Crosshair } from 'lucide-react';

interface ClassUpgradeMenuProps {
  availableClasses: TankClass[];
  onSelectClass: (cls: TankClass) => void;
  playerLevel: number;
}

export const ClassUpgradeMenu: React.FC<ClassUpgradeMenuProps> = ({
  availableClasses,
  onSelectClass,
  playerLevel,
}) => {
  if (!availableClasses || availableClasses.length === 0) return null;

  return (
    <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3 shadow-[0_0_25px_rgba(6,182,212,0.25)] text-slate-100 max-w-xl animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ArrowUpCircle className="w-5 h-5 text-cyan-400 animate-bounce" />
          <span className="font-extrabold text-sm tracking-wide text-cyan-300">
            CHỌN LỚP CHIẾN XA TIẾN HÓA (CẤP {playerLevel})
          </span>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
          {availableClasses.length} lựa chọn
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableClasses.map((clsKey) => {
          const cls = TANK_CLASSES[clsKey];
          if (!cls) return null;

          return (
            <button
              key={clsKey}
              onClick={() => onSelectClass(clsKey)}
              className="group relative flex flex-col p-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-cyan-950/40 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-150 text-left active:scale-[0.98]"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {cls.name}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1 rounded border border-cyan-800">
                  T{cls.tier}
                </span>
              </div>

              {/* Tank Barrel Preview Thumbnail Canvas/Icon */}
              <div className="h-14 w-full bg-slate-950/60 rounded-lg flex items-center justify-center relative overflow-hidden border border-slate-800/80 mb-1.5">
                <svg
                  viewBox="-35 -35 70 70"
                  className="w-12 h-12 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]"
                >
                  {/* Barrels */}
                  {cls.barrels.map((b, idx) => {
                    const l = b.length;
                    const w = b.width;
                    const deg = (b.angle * 180) / Math.PI;
                    const off = b.offset;
                    return (
                      <rect
                        key={idx}
                        x={0}
                        y={-w / 2 + off}
                        width={cls.bodyRadius + l - 10}
                        height={w}
                        fill="#64748b"
                        stroke="#334155"
                        strokeWidth="1.5"
                        transform={`rotate(${deg})`}
                      />
                    );
                  })}
                  {/* Body */}
                  <circle
                    cx="0"
                    cy="0"
                    r={cls.bodyRadius - 7}
                    fill="#06b6d4"
                    stroke="#0891b2"
                    strokeWidth="2"
                  />
                  {cls.isSmasher && (
                    <polygon
                      points="0,-20 18,-8 18,12 0,22 -18,12 -18,-8"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                    />
                  )}
                </svg>
              </div>

              <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                {cls.description}
              </p>

              <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-800/60 w-full">
                <span className="flex items-center gap-0.5">
                  <Crosshair className="w-2.5 h-2.5 text-cyan-400" />
                  ST: x{cls.damageMult.toFixed(1)}
                </span>
                <span className="flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5 text-emerald-400" />
                  HP: x{cls.maxHpMult.toFixed(1)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
