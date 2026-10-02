import React from 'react';
import { TankClass } from '../types/game.ts';
import { TANK_CLASSES } from '../constants/classes.ts';
import { RotateCcw, Skull, Trophy, Target, Shield, Clock } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  kills: number;
  shapesDestroyed: number;
  level: number;
  tankClass: TankClass;
  aliveSeconds: number;
  killerName?: string;
  onRespawn: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  kills,
  shapesDestroyed,
  level,
  tankClass,
  aliveSeconds,
  killerName,
  onRespawn,
}) => {
  const cls = TANK_CLASSES[tankClass] || TANK_CLASSES.basic;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(244,63,94,0.25)] text-slate-100 flex flex-col text-center">
        {/* Death icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-3 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
          <Skull className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black tracking-wide text-rose-400 uppercase mb-1">
          CHIẾN XA BỊ TIÊU DIỆT
        </h2>

        {killerName ? (
          <p className="text-xs text-slate-300 mb-4">
            Bị hạ gục bởi <b className="text-amber-400">{killerName}</b>
          </p>
        ) : (
          <p className="text-xs text-slate-400 mb-4">
            Va chạm và nổ tung trên chiến trường
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-left">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Điểm</div>
              <div className="text-base font-extrabold text-amber-300 font-mono">
                {score.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Hạ Gục (Kills)</div>
              <div className="text-base font-extrabold text-rose-300 font-mono">
                {kills}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Cấp & Lớp Xe</div>
              <div className="text-xs font-bold text-cyan-300 truncate">
                Cấp {level} • {cls.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Thời Gian Sống</div>
              <div className="text-xs font-bold text-emerald-300 font-mono">
                {formatTime(aliveSeconds)} ({shapesDestroyed} khối)
              </div>
            </div>
          </div>
        </div>

        {/* Respawn Button */}
        <button
          onClick={onRespawn}
          className="w-full py-3 px-6 rounded-2xl font-black text-sm tracking-wider uppercase bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          HỒI SINH VÀO TRẬN ĐẤU
        </button>
      </div>
    </div>
  );
};
