import React, { useRef, useEffect } from 'react';
import { PlayerData } from '../types/game.ts';
import { BIOMES, MAP_SIZE } from '../constants/biomes.ts';

interface MinimapProps {
  me: PlayerData | null;
  players: Record<string, PlayerData>;
  mapSize?: number;
}

export const Minimap: React.FC<MinimapProps> = ({
  me,
  players,
  mapSize = MAP_SIZE,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const scale = size / mapSize;

    // Background
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const step = size / 4;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(size, i * step);
      ctx.stroke();
    }

    // Biomes
    for (const b of BIOMES) {
      ctx.fillStyle = b.color;
      if (b.type === 'nest' && b.radius) {
        ctx.beginPath();
        ctx.arc(b.x * scale, b.y * scale, b.radius * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = b.accent;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (b.width && b.height) {
        ctx.fillRect(b.x * scale, b.y * scale, b.width * scale, b.height * scale);
        ctx.strokeStyle = b.accent;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(b.x * scale, b.y * scale, b.width * scale, b.height * scale);
      }
    }

    // Draw other tanks as small dots
    for (const id in players) {
      const p = players[id];
      if (!p.alive) continue;
      if (me && id === me.id) continue;

      ctx.beginPath();
      ctx.arc(p.x * scale, p.y * scale, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    // Draw player with pulse ring and heading line
    if (me && me.alive) {
      const px = me.x * scale;
      const py = me.y * scale;

      // Pulse
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Heading
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(me.angle) * 10, py + Math.sin(me.angle) * 10);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Body dot
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = me.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [me, players, mapSize]);

  return (
    <div className="relative group bg-slate-950/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-2 shadow-xl select-none">
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800 text-[10px] text-slate-400 font-mono">
        <span>BẢN ĐỒ CHIẾN TRƯỜNG</span>
        {me && (
          <span className="text-cyan-400">
            {Math.round(me.x)}, {Math.round(me.y)}
          </span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={130}
        height={130}
        className="rounded-lg border border-slate-800 bg-slate-950 shadow-inner"
      />

      {/* Mini legend on hover */}
      <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono px-0.5">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" /> Tổ
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" /> Băng
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Lửa
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Ốc đảo
        </span>
      </div>
    </div>
  );
};
