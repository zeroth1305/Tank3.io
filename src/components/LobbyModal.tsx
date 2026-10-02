import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Shield, Play, HelpCircle, Server, Sparkles } from 'lucide-react';
import { sound } from '../services/sound.ts';

interface LobbyModalProps {
  onJoin: (name: string, color: string) => void;
  onOpenDeployGuide: () => void;
  connected: boolean;
  totalPlayers: number;
}

const COLOR_PRESETS = [
  { name: 'Neon Cyan', hex: '#00b2e1' },
  { name: 'Crimson Fury', hex: '#f14e54' },
  { name: 'Emerald Spark', hex: '#10b981' },
  { name: 'Amber Blaze', hex: '#f59e0b' },
  { name: 'Royal Violet', hex: '#8b5cf6' },
  { name: 'Neon Rose', hex: '#ec4899' },
  { name: 'Cyber Lime', hex: '#84cc16' },
  { name: 'Plasma Blue', hex: '#3b82f6' },
];

export const LobbyModal: React.FC<LobbyModalProps> = ({
  onJoin,
  onOpenDeployGuide,
  connected,
  totalPlayers,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#00b2e1');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Generate random default tank name
    const defaultNames = [
      'AlphaStriker',
      'QuantumTank',
      'ApexTitan',
      'ViperSniper',
      'DragonFury',
      'ThunderBolt',
      'GhostRider',
      'ShadowScythe',
    ];
    const picked = defaultNames[Math.floor(Math.random() * defaultNames.length)];
    setName(picked);
  }, []);

  // Live tank preview animation
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let animId: number;

    const renderPreview = () => {
      angle += 0.015;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Barrel
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.fillRect(0, -10, 36, 20);
      ctx.strokeRect(0, -10, 36, 20);

      // Body
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(renderPreview);
    };

    renderPreview();
    return () => cancelAnimationFrame(animId);
  }, [color]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.setEnabled(next);
    if (next) sound.playShoot('standard');
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Hero Tank';
    sound.playLevelUp();
    onJoin(finalName, color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,178,225,0.2)] text-slate-100 flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider text-slate-100 flex items-center gap-2">
                DIEP.IO ENHANCED
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-extrabold uppercase tracking-widest">
                  v2.5 NEXT-GEN
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Smooth controls • Particle FX • Weather • Biomes • Bot Arena
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleSound}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowControls(!showControls)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Hướng dẫn điều khiển"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>

        {/* Tank Preview & Setup */}
        <form onSubmit={handleStart} className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            {/* Live rotating tank preview */}
            <div className="relative shrink-0">
              <canvas
                ref={previewCanvasRef}
                width={110}
                height={110}
                className="rounded-2xl bg-slate-900 border border-slate-800 shadow-inner"
              />
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-mono">
                XEM TRƯỚC
              </span>
            </div>

            <div className="flex-1 w-full space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Tên Nhân Vật:
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên chiến xa..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-sm font-semibold text-slate-100 placeholder:text-slate-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Màu Sắc Chiến Xa:
                </label>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className={`w-6 h-6 rounded-lg transition-transform ${
                        color === c.hex
                          ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : 'hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 rounded-lg cursor-pointer bg-transparent border-0"
                    title="Màu tùy chọn"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Controls Quick Guide */}
          {showControls ? (
            <div className="bg-slate-950/80 rounded-2xl p-3 border border-amber-500/30 text-xs space-y-1.5 animate-in fade-in duration-150">
              <div className="font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> BẢNG HƯỚNG DẪN ĐIỀU KHIỂN
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300 text-[11px]">
                <div>• <b className="text-white">W, A, S, D</b>: Di chuyển mượt mà</div>
                <div>• <b className="text-white">Chuột</b>: Ngắm & Bắn</div>
                <div>• <b className="text-white">Space / Chuột Phải</b>: Tăng Tốc (Dash)</div>
                <div>• <b className="text-white">E</b>: Bật / Tắt Tự động bắn (Auto-fire)</div>
                <div>• <b className="text-white">C</b>: Bật / Tắt Tự xoay (Auto-spin)</div>
                <div>• <b className="text-white">1 - 8</b>: Nâng cấp nhanh kỹ năng</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Đang có <b className="text-cyan-400">{totalPlayers}</b> xe tăng online & bot đấu trường</span>
              <button
                type="button"
                onClick={() => setShowControls(true)}
                className="text-cyan-400 hover:underline"
              >
                Xem hướng dẫn phím tắt & tính năng
              </button>
            </div>
          )}

          {/* Spawn Button */}
          <button
            type="submit"
            disabled={!connected}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-sm tracking-wider uppercase bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 fill-current" />
            {connected ? 'VÀO CHIẾN TRƯỜNG NGAY' : 'ĐANG KẾT NỐI MÁY CHỦ...'}
          </button>
        </form>

        {/* Footer info for Render.com */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{connected ? 'Máy chủ WebSocket sẵn sàng' : 'Mất kết nối'}</span>
          </div>

          <button
            type="button"
            onClick={onOpenDeployGuide}
            className="flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Server className="w-3 h-3" />
            <span>Hướng dẫn Deploy lên Render.com</span>
          </button>
        </div>
      </div>
    </div>
  );
};
