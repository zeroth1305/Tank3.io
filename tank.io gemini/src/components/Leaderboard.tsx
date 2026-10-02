import React from 'react';
import { LeaderboardEntry, KillEvent } from '../types/game.ts';
import { Trophy, Skull, Crosshair } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  myId: string | null;
  recentKills: KillEvent[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  myId,
  recentKills,
}) => {
  return (
    <div className="flex flex-col items-end gap-2 pointer-events-none select-none">
      {/* Real-time Kill Feed */}
      <div className="flex flex-col items-end gap-1 mb-2 max-w-xs overflow-hidden">
        {recentKills.slice(0, 4).map((k) => (
          <div
            key={k.id}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/60 shadow-lg text-[11px] font-medium text-slate-200 animate-in fade-in slide-in-from-right-2 duration-200"
          >
            <span
              className="font-bold truncate max-w-[90px]"
              style={{ color: k.killerColor }}
            >
              {k.killerName}
            </span>
            <Crosshair className="w-3 h-3 text-rose-500 shrink-0" />
            <span
              className="truncate max-w-[90px] text-slate-300"
              style={{ color: k.victimColor }}
            >
              {k.victimName}
            </span>
          </div>
        ))}
      </div>

      {/* Top 10 Leaderboard Card */}
      <div className="w-56 bg-slate-950/85 backdrop-blur-md border border-slate-700/70 rounded-2xl p-2.5 shadow-2xl text-xs pointer-events-auto">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-extrabold text-amber-400">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="tracking-wide">BẢNG XẾP HẠNG</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">TOP 10</span>
        </div>

        <div className="space-y-1">
          {entries.slice(0, 10).map((entry, index) => {
            const isMe = entry.id === myId;
            const rank = index + 1;

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] transition-all ${
                  isMe
                    ? 'bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.3)] font-bold text-cyan-200'
                    : 'hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span
                    className={`font-mono text-[10px] w-4 text-center shrink-0 ${
                      rank === 1
                        ? 'text-amber-400 font-bold'
                        : rank === 2
                        ? 'text-slate-300'
                        : rank === 3
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    #{rank}
                  </span>
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="truncate font-medium">
                    {entry.name}
                    {isMe ? ' (Bạn)' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                  {entry.kills > 0 && (
                    <span className="flex items-center gap-0.5 text-rose-400 text-[10px]">
                      <Skull className="w-2.5 h-2.5" />
                      {entry.kills}
                    </span>
                  )}
                  <span className="text-slate-200 font-bold">
                    {entry.score >= 1000
                      ? (entry.score / 1000).toFixed(1) + 'k'
                      : entry.score}
                  </span>
                </div>
              </div>
            );
          })}

          {entries.length === 0 && (
            <div className="text-center py-3 text-slate-400 text-[11px]">
              Đang đồng bộ thứ hạng...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
