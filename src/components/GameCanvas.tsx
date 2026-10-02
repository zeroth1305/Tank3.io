import React, { useRef, useEffect } from 'react';
import {
  PlayerData,
  BulletData,
  ShapeData,
  WeatherState,
  Particle,
  DamageNumber,
} from '../types/game.ts';
import { TANK_CLASSES } from '../constants/classes.ts';
import { BIOMES, MAP_SIZE } from '../constants/biomes.ts';

interface GameCanvasProps {
  myId: string | null;
  inGame?: boolean;
  spawnPos?: { x: number; y: number } | null;
  players: Record<string, PlayerData>;
  bullets: BulletData[];
  shapes: ShapeData[];
  weather: WeatherState;
  onMouseMove: (angle: number) => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onRightClickDash?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  myId,
  inGame,
  spawnPos,
  players,
  bullets,
  shapes,
  weather,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  onRightClickDash,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync props to refs for uninterrupted 60fps render loop
  const playersRef = useRef(players);
  const bulletsRef = useRef(bullets);
  const shapesRef = useRef(shapes);
  const weatherRef = useRef(weather);
  const myIdRef = useRef(myId);
  const inGameRef = useRef(inGame);

  useEffect(() => {
    playersRef.current = players;
    bulletsRef.current = bullets;
    shapesRef.current = shapes;
    weatherRef.current = weather;
    myIdRef.current = myId;
    inGameRef.current = inGame;
  }, [players, bullets, shapes, weather, myId, inGame]);

  // Smooth camera position
  const camRef = useRef({ x: MAP_SIZE / 2, y: MAP_SIZE / 2 });
  const hasSnappedToPlayerRef = useRef(false);

  // Instant snap on spawnPos event
  useEffect(() => {
    if (spawnPos && Number.isFinite(spawnPos.x) && Number.isFinite(spawnPos.y)) {
      camRef.current.x = spawnPos.x;
      camRef.current.y = spawnPos.y;
      hasSnappedToPlayerRef.current = true;
    }
  }, [spawnPos]);

  // Particles & Floating Damage Numbers
  const particlesRef = useRef<Particle[]>([]);
  const damageNumsRef = useRef<DamageNumber[]>([]);
  const screenShakeRef = useRef({ x: 0, y: 0, intensity: 0 });
  const lightningFlashRef = useRef(0);

  // Setup canvas resize & pointer events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleCanvasMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentMyId = myIdRef.current;
      const me = currentMyId ? playersRef.current[currentMyId] : null;

      // Calculate aim angle based on player's exact screen position
      let playerScreenX = canvas.width / 2;
      let playerScreenY = canvas.height / 2;
      if (me && me.alive) {
        const camX = camRef.current.x - canvas.width / 2;
        const camY = camRef.current.y - canvas.height / 2;
        playerScreenX = me.x - camX;
        playerScreenY = me.y - camY;
      }

      const angle = Math.atan2(mouseY - playerScreenY, mouseX - playerScreenX);
      onMouseMove(angle);
    };

    const handleCanvasMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        onMouseDown();
      } else if (e.button === 2) {
        e.preventDefault();
        if (onRightClickDash) onRightClickDash();
      }
    };

    const handleCanvasMouseUp = (e: MouseEvent) => {
      if (e.button === 0) onMouseUp();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mousedown', handleCanvasMouseDown);
    window.addEventListener('mouseup', handleCanvasMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('mousedown', handleCanvasMouseDown);
      window.removeEventListener('mouseup', handleCanvasMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onMouseMove, onMouseDown, onMouseUp, onRightClickDash]);

  // Persistent 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;

      const currentMyId = myIdRef.current;
      const currentPlayers = playersRef.current;
      const currentBullets = bulletsRef.current;
      const currentShapes = shapesRef.current;
      const currentWeather = weatherRef.current;

      const me = currentMyId ? currentPlayers[currentMyId] : null;

      // Camera Centering & Smooth Follow
      if (me && me.alive) {
        if (!hasSnappedToPlayerRef.current) {
          // Instantly snap to player on first spawn
          camRef.current.x = me.x;
          camRef.current.y = me.y;
          hasSnappedToPlayerRef.current = true;
        } else {
          // Smooth follow
          camRef.current.x += (me.x - camRef.current.x) * 0.16;
          camRef.current.y += (me.y - camRef.current.y) * 0.16;
        }
      } else {
        hasSnappedToPlayerRef.current = false;
      }

      // Screen shake decay
      if (screenShakeRef.current.intensity > 0.1) {
        screenShakeRef.current.x =
          (Math.random() - 0.5) * screenShakeRef.current.intensity;
        screenShakeRef.current.y =
          (Math.random() - 0.5) * screenShakeRef.current.intensity;
        screenShakeRef.current.intensity *= 0.9;
      } else {
        screenShakeRef.current.x = 0;
        screenShakeRef.current.y = 0;
        screenShakeRef.current.intensity = 0;
      }

      const camX = camRef.current.x - w / 2 + screenShakeRef.current.x;
      const camY = camRef.current.y - h / 2 + screenShakeRef.current.y;

      // 1. Draw Void Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // 2. Draw Arena Map bounds
      ctx.save();
      ctx.translate(-camX, -camY);

      // Arena Floor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

      // Arena Outer Border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);

      // 3. Draw Biomes
      for (const b of BIOMES) {
        ctx.save();
        if (b.type === 'nest' && b.radius) {
          // Central nest
          const grad = ctx.createRadialGradient(
            b.x,
            b.y,
            50,
            b.x,
            b.y,
            b.radius
          );
          grad.addColorStop(0, 'rgba(147, 51, 234, 0.25)');
          grad.addColorStop(1, 'rgba(124, 58, 237, 0.04)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
          ctx.fill();

          // Outer nest runic ring
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 3;
          ctx.setLineDash([16, 12]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (b.width && b.height) {
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.width, b.height);
          ctx.strokeStyle = b.accent;
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y, b.width, b.height);
        }
        ctx.restore();
      }

      // 4. Draw Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      const startX = Math.max(0, Math.floor(camX / gridSize) * gridSize);
      const endX = Math.min(
        MAP_SIZE,
        Math.ceil((camX + w) / gridSize) * gridSize
      );
      const startY = Math.max(0, Math.floor(camY / gridSize) * gridSize);
      const endY = Math.min(
        MAP_SIZE,
        Math.ceil((camY + h) / gridSize) * gridSize
      );

      ctx.beginPath();
      for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();

      // 5. Draw Shapes (Squares, Triangles, Pentagons, Alpha Pentagons, Crashers)
      for (const s of currentShapes) {
        // Frustum culling
        if (
          s.x + s.r < camX ||
          s.x - s.r > camX + w ||
          s.y + s.r < camY ||
          s.y - s.r > camY + h
        ) {
          continue;
        }

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.lineWidth = s.type === 'alpha_pentagon' ? 6 : 3;

        if (s.type === 'square') {
          ctx.fillStyle = '#ffe869';
          ctx.strokeStyle = '#bfae4e';
          ctx.fillRect(-s.r, -s.r, s.r * 2, s.r * 2);
          ctx.strokeRect(-s.r, -s.r, s.r * 2, s.r * 2);
        } else if (s.type === 'triangle' || s.type === 'crasher') {
          ctx.fillStyle = s.type === 'crasher' ? '#f43f5e' : '#fc7677';
          ctx.strokeStyle = s.type === 'crasher' ? '#be123c' : '#bd5859';
          ctx.beginPath();
          for (let i = 0; i < 3; i++) {
            const a = (i * Math.PI * 2) / 3 - Math.PI / 2;
            const px = Math.cos(a) * s.r * 1.15;
            const py = Math.sin(a) * s.r * 1.15;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Crasher glowing eye
          if (s.type === 'crasher') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (s.type === 'pentagon' || s.type === 'alpha_pentagon') {
          ctx.fillStyle = s.type === 'alpha_pentagon' ? '#8b5cf6' : '#768dfc';
          ctx.strokeStyle = s.type === 'alpha_pentagon' ? '#6d28d9' : '#5569c7';
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const px = Math.cos(a) * s.r * 1.1;
            const py = Math.sin(a) * s.r * 1.1;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();

        // Shape Health Bar (if damaged)
        if (s.hp < s.maxHp) {
          const barW = Math.max(30, s.r * 1.4);
          const barH = 5;
          const ratio = Math.max(0, s.hp / s.maxHp);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(s.x - barW / 2, s.y + s.r + 6, barW, barH);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(s.x - barW / 2, s.y + s.r + 6, barW * ratio, barH);
        }
      }

      // 6. Draw Bullets, Drones & Traps
      for (const b of currentBullets) {
        if (
          b.x + b.r < camX ||
          b.x - b.r > camX + w ||
          b.y + b.r < camY ||
          b.y - b.r > camY + h
        ) {
          continue;
        }

        ctx.save();
        ctx.translate(b.x, b.y);

        if (b.isDrone) {
          const droneAngle = Math.atan2(b.vy, b.vx);
          ctx.rotate(droneAngle);
          ctx.beginPath();
          ctx.moveTo(b.r * 1.3, 0);
          ctx.lineTo(-b.r * 0.8, -b.r * 0.9);
          ctx.lineTo(-b.r * 0.8, b.r * 0.9);
          ctx.closePath();
          ctx.fillStyle = b.color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (b.isTrap) {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const r = i % 2 === 0 ? b.r * 1.4 : b.r * 0.6;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, b.r, 0, Math.PI * 2);
          ctx.fillStyle = b.color;
          ctx.fill();
          ctx.lineWidth = Math.max(2, b.r * 0.2);
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.stroke();
        }
        ctx.restore();
      }

      // 7. Draw Tanks (Both Player & Bots)
      for (const id in currentPlayers) {
        const p = currentPlayers[id];
        if (!p.alive) continue;

        const isMe = id === currentMyId;

        // Frustum culling: NEVER cull the local player's tank!
        if (
          !isMe &&
          (p.x + 120 < camX ||
            p.x - 120 > camX + w ||
            p.y + 120 < camY ||
            p.y - 120 > camY + h)
        ) {
          continue;
        }

        const cls = TANK_CLASSES[p.class] || TANK_CLASSES.basic;
        const radius = cls.bodyRadius || 24;

        ctx.save();
        ctx.translate(p.x, p.y);

        // Highlight ring under local player's tank
        if (isMe) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([5, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // A. Barrels
        ctx.save();
        ctx.rotate(p.angle);
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;

        cls.barrels.forEach((b) => {
          ctx.save();
          ctx.rotate(b.angle);

          const recoilOffset = p.recoil ? p.recoil * (b.recoil || 3) * 0.5 : 0;
          const barrelLen = radius + b.length - recoilOffset;
          const barrelW = b.width;
          const lateral = b.offset;

          if (b.isDroneSpawner) {
            ctx.beginPath();
            ctx.moveTo(radius * 0.5, -barrelW / 2 + lateral);
            ctx.lineTo(barrelLen, -barrelW * 0.7 + lateral);
            ctx.lineTo(barrelLen, barrelW * 0.7 + lateral);
            ctx.lineTo(radius * 0.5, barrelW / 2 + lateral);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (b.isTrapSpawner) {
            ctx.beginPath();
            ctx.moveTo(radius * 0.7, -barrelW / 2 + lateral);
            ctx.lineTo(barrelLen, -barrelW / 2 + lateral);
            ctx.lineTo(barrelLen + 6, lateral);
            ctx.lineTo(barrelLen, barrelW / 2 + lateral);
            ctx.lineTo(radius * 0.7, barrelW / 2 + lateral);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillRect(0, -barrelW / 2 + lateral, barrelLen, barrelW);
            ctx.strokeRect(0, -barrelW / 2 + lateral, barrelLen, barrelW);
          }
          ctx.restore();
        });
        ctx.restore(); // Restore rotate(p.angle)

        // B. Tank Body
        if (cls.isSmasher) {
          ctx.save();
          ctx.rotate(time * 0.003);
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            const rOuter = radius + 9;
            const rInner = radius + 2;
            const ox = Math.cos(a) * rOuter;
            const oy = Math.sin(a) * rOuter;
            const ix = Math.cos(a + Math.PI / 8) * rInner;
            const iy = Math.sin(a + Math.PI / 8) * rInner;
            if (i === 0) ctx.moveTo(ox, oy);
            else {
              ctx.lineTo(ox, oy);
              ctx.lineTo(ix, iy);
            }
          }
          ctx.closePath();
          ctx.fillStyle = '#475569';
          ctx.fill();
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }

        // Inner Hull Circle
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.stroke();

        // Bot badge or player star
        if (p.isBot) {
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }

        // Invulnerability Shield Forcefield
        if (p.invulnerableTimer && p.invulnerableTimer > 0) {
          ctx.save();
          const shieldRadius = radius + 10 + Math.sin(time * 0.01) * 2;
          ctx.beginPath();
          ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
          ctx.fill();
          ctx.restore();
        }

        // C. Health bar & Name HUD
        const hpBarW = Math.max(48, radius * 2.2);
        const hpBarH = 5;
        const hpRatio = Math.max(0, p.hp / p.maxHp);

        // Local Player Indicator Banner
        if (isMe) {
          ctx.fillStyle = '#22d3ee';
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.fillText('▼ BẠN ▼', 0, -radius - 28);
          ctx.shadowBlur = 0;
        }

        // Invulnerability Shield Tag
        if (p.invulnerableTimer && p.invulnerableTimer > 0) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`🛡️ KHIÊN (${Math.ceil(p.invulnerableTimer)}s)`, 0, -radius - (isMe ? 38 : 28));
        }

        // Player Name & Level Badge
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(`${p.name} [Lv ${p.level}]`, 0, -radius - 14);
        ctx.shadowBlur = 0;

        // Health bar
        if (p.hp < p.maxHp || isMe) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(-hpBarW / 2, radius + 8, hpBarW, hpBarH);
          ctx.fillStyle = hpRatio > 0.3 ? '#10b981' : '#ef4444';
          ctx.fillRect(-hpBarW / 2, radius + 8, hpBarW * hpRatio, hpBarH);

          // Dash energy bar (if my tank)
          if (isMe) {
            const dashW = hpBarW * (p.dashEnergy / 100);
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(-hpBarW / 2, radius + 15, dashW, 3);
          }
        }

        ctx.restore(); // Restore translate(p.x, p.y)
      }

      // 8. Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= pt.decay;

        if (pt.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 9. Floating Damage Numbers
      for (let i = damageNumsRef.current.length - 1; i >= 0; i--) {
        const d = damageNumsRef.current[i];
        d.x += d.vx;
        d.y += d.vy;
        d.life -= 0.02;

        if (d.life <= 0) {
          damageNumsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.min(1, d.life * 1.5);
        ctx.fillStyle = d.color;
        ctx.font = `${d.crit ? 'bold 15px' : 'bold 12px'} JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(d.text, d.x, d.y);
        ctx.restore();
      }

      ctx.restore(); // Restore camera transform

      // 10. Weather Screen Overlays
      if (currentWeather.type === 'rain') {
        ctx.save();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
        ctx.lineWidth = 1.5;
        const dropCount = 45;
        for (let i = 0; i < dropCount; i++) {
          const rx = (Math.sin(i * 99 + time * 0.001) * 0.5 + 0.5) * w;
          const ry = (time * 0.9 + i * 40) % h;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 4, ry + 16);
          ctx.stroke();
        }

        if (Math.random() < 0.002) {
          lightningFlashRef.current = 0.4;
        }
        if (lightningFlashRef.current > 0) {
          ctx.fillStyle = `rgba(224, 242, 254, ${lightningFlashRef.current})`;
          ctx.fillRect(0, 0, w, h);
          lightningFlashRef.current -= 0.04;
        }
        ctx.restore();
      } else if (currentWeather.type === 'sandstorm') {
        ctx.save();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.07)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
        for (let i = 0; i < 30; i++) {
          const sx = (time * 0.6 + i * 70) % w;
          const sy = (Math.cos(i * 45 + time * 0.002) * 0.5 + 0.5) * h;
          ctx.fillRect(sx, sy, 3, 2);
        }
        ctx.restore();
      } else if (currentWeather.type === 'aurora') {
        ctx.save();
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.06)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.06)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // 11. Screen Vignette
      const vig = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.4,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.7
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(2, 6, 23, 0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []); // Run persistent 60fps loop once on mount

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair block select-none bg-slate-950"
    />
  );
};
