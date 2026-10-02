import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import {
  PlayerData,
  BulletData,
  ShapeData,
  WeatherState,
  LeaderboardEntry,
  KillEvent,
  StatKey,
  TankClass,
  PlayerInput,
} from './types/game.ts';
import { TANK_CLASSES, getAvailableUpgrades } from './constants/classes.ts';
import { sound } from './services/sound.ts';
import { GameCanvas } from './components/GameCanvas.tsx';
import { StatsPanel } from './components/StatsPanel.tsx';
import { ClassUpgradeMenu } from './components/ClassUpgradeMenu.tsx';
import { Leaderboard } from './components/Leaderboard.tsx';
import { Minimap } from './components/Minimap.tsx';
import { WeatherIndicator } from './components/WeatherIndicator.tsx';
import { LobbyModal } from './components/LobbyModal.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { DeployGuideModal } from './components/DeployGuideModal.tsx';
import {
  Shield,
  Zap,
  RotateCw,
  Crosshair,
  Volume2,
  VolumeX,
  Server,
  Layers,
} from 'lucide-react';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);

  // Game data synced from server
  const [players, setPlayers] = useState<Record<string, PlayerData>>({});
  const [bullets, setBullets] = useState<BulletData[]>([]);
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [weather, setWeather] = useState<WeatherState>({
    type: 'clear',
    name: 'Trời Quang Đãng',
    description: 'Tầm nhìn tuyệt hảo, mọi chỉ số hoạt động bình thường.',
    intensity: 0,
    timeRemaining: 60,
  });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentKills, setRecentKills] = useState<KillEvent[]>([]);

  // UI Modals
  const [showDeployGuide, setShowDeployGuide] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [deathStats, setDeathStats] = useState<{
    score: number;
    kills: number;
    shapesDestroyed: number;
    level: number;
    tankClass: TankClass;
    aliveSeconds: number;
    killerName?: string;
  } | null>(null);

  // Player controls state
  const [autoFire, setAutoFire] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  const [spawnPos, setSpawnPos] = useState<{ x: number; y: number } | null>(null);

  // References for fast client tick loop
  const inputRef = useRef<PlayerInput>({
    up: false,
    down: false,
    left: false,
    right: false,
    shooting: false,
    angle: 0,
    dash: false,
  });

  const prevLevelRef = useRef(1);
  const lastPlayerNameRef = useRef('Player');
  const lastPlayerColorRef = useRef('#00b2e1');
  const hasBeenAliveRef = useRef(false);

  // Socket Connection setup
  useEffect(() => {
    const s = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      setConnected(true);
      if (s.id) setMyId(s.id);
    });

    s.on('init', (d: { id: string }) => {
      if (d && d.id) setMyId(d.id);
    });

    s.on('spawned', (d: { id: string; x: number; y: number }) => {
      if (d && d.id) setMyId(d.id);
      if (d && Number.isFinite(d.x) && Number.isFinite(d.y)) {
        setSpawnPos({ x: d.x, y: d.y });
      }
      hasBeenAliveRef.current = true;
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('state', (state: {
      players: Record<string, PlayerData>;
      bullets: BulletData[];
      shapes: ShapeData[];
      weather: WeatherState;
      leaderboard: LeaderboardEntry[];
      recentKills: KillEvent[];
    }) => {
      setPlayers(state.players);
      setBullets(state.bullets);
      setShapes(state.shapes);
      setWeather(state.weather);
      setLeaderboard(state.leaderboard);
      if (state.recentKills) setRecentKills(state.recentKills);

      // Check for level up sound
      if (s.id && state.players[s.id]) {
        const myData = state.players[s.id];
        if (myData.level > prevLevelRef.current) {
          sound.playLevelUp();
          if (myData.level === 15 || myData.level === 30 || myData.level === 45) {
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
          prevLevelRef.current = myData.level;
        }

        // Check if player is alive or died
        if (myData.alive) {
          hasBeenAliveRef.current = true;
        } else if (hasBeenAliveRef.current && inGame && !isGameOver) {
          hasBeenAliveRef.current = false;
          sound.playDeath();
          setIsGameOver(true);
          setDeathStats({
            score: myData.totalScore,
            kills: myData.kills,
            shapesDestroyed: myData.shapesDestroyed,
            level: myData.level,
            tankClass: myData.class,
            aliveSeconds: myData.aliveSeconds,
            killerName: myData.lastDamagedBy,
          });
        }
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [inGame, isGameOver]);

  // Client Input tick to server (30 FPS)
  useEffect(() => {
    if (!socket || !inGame) return;

    const interval = setInterval(() => {
      if (autoSpin) {
        inputRef.current.angle += 0.08;
      }
      socket.emit('input', {
        ...inputRef.current,
        shooting: autoFire || inputRef.current.shooting,
      });

      // Reset one-shot dash flag
      if (inputRef.current.dash) {
        inputRef.current.dash = false;
      }
    }, 1000 / 30);

    return () => clearInterval(interval);
  }, [socket, inGame, autoFire, autoSpin]);

  // Keyboard Event Handlers
  const handleUpgradeStat = useCallback(
    (stat: StatKey) => {
      if (socket) {
        socket.emit('upgrade', stat);
      }
    },
    [socket]
  );

  useEffect(() => {
    type DirectionKey = 'up' | 'down' | 'left' | 'right';
    const keyMap: Record<string, DirectionKey> = {
      KeyW: 'up',
      ArrowUp: 'up',
      KeyS: 'down',
      ArrowDown: 'down',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
    };

    const upgradeKeyMap: Record<string, StatKey> = {
      Digit1: 'regen',
      Digit2: 'health',
      Digit3: 'bodyDamage',
      Digit4: 'bulletSpeed',
      Digit5: 'bulletPen',
      Digit6: 'bulletDamage',
      Digit7: 'reload',
      Digit8: 'speed',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const dir = keyMap[e.code];
      if (dir) {
        inputRef.current[dir] = true;
      }

      if (upgradeKeyMap[e.code] && !e.repeat) {
        handleUpgradeStat(upgradeKeyMap[e.code]);
      }

      // Space to Dash
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        inputRef.current.dash = true;
        sound.playDash();
      }

      // E to toggle Auto-Fire
      if (e.code === 'KeyE' && !e.repeat) {
        setAutoFire((prev) => !prev);
      }

      // C to toggle Auto-Spin
      if (e.code === 'KeyC' && !e.repeat) {
        setAutoSpin((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const dir = keyMap[e.code];
      if (dir) {
        inputRef.current[dir] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUpgradeStat]);

  // Join Arena
  const handleJoin = (name: string, color: string) => {
    lastPlayerNameRef.current = name;
    lastPlayerColorRef.current = color;
    hasBeenAliveRef.current = false;

    if (socket) {
      socket.emit('spawn', { name, color });
      setInGame(true);
      setIsGameOver(false);
      prevLevelRef.current = 1;
    }
  };

  const handleRespawn = () => {
    hasBeenAliveRef.current = false;
    if (socket) {
      socket.emit('spawn', {
        name: lastPlayerNameRef.current,
        color: lastPlayerColorRef.current,
      });
      setIsGameOver(false);
      prevLevelRef.current = 1;
    }
  };

  const handleSelectClass = (cls: TankClass) => {
    if (socket) {
      socket.emit('selectClass', cls);
      sound.playLevelUp();
    }
  };

  const handleMouseMove = (angle: number) => {
    if (!autoSpin) {
      inputRef.current.angle = angle;
    }
  };

  const handleMouseDown = () => {
    inputRef.current.shooting = true;
    sound.playShoot();
  };

  const handleMouseUp = () => {
    inputRef.current.shooting = false;
  };

  const handleRightClickDash = () => {
    inputRef.current.dash = true;
    sound.playDash();
  };

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    sound.setEnabled(!next);
  };

  const me = myId ? players[myId] : null;
  const currentClassDef = me ? TANK_CLASSES[me.class] || TANK_CLASSES.basic : TANK_CLASSES.basic;
  const availableClasses = me ? getAvailableUpgrades(me.class, me.level) : [];
  const xpProgress = me ? Math.min(100, (me.xp / me.need) * 100) : 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Main Canvas Battlefield */}
      <GameCanvas
        myId={myId}
        inGame={inGame}
        spawnPos={spawnPos}
        players={players}
        bullets={bullets}
        shapes={shapes}
        weather={weather}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onRightClickDash={handleRightClickDash}
      />

      {/* 2. Top Bar HUD (Weather, Status, Sound) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Logo / Game title tag */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 shadow-lg text-xs font-black tracking-wider text-cyan-400">
            <Shield className="w-4 h-4 fill-cyan-400/20" />
            <span>DIEP.IO ENHANCED</span>
          </div>

          {/* Dynamic Weather Widget */}
          <WeatherIndicator weather={weather} />
        </div>

        {/* Toggles & Sound */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Auto Fire indicator */}
          <button
            onClick={() => setAutoFire(!autoFire)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-all ${
              autoFire
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>[E] Tự Bắn: {autoFire ? 'BẬT' : 'TẮT'}</span>
          </button>

          {/* Auto Spin indicator */}
          <button
            onClick={() => setAutoSpin(!autoSpin)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-all ${
              autoSpin
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>[C] Tự Xoay</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-700/70 text-slate-300 hover:text-cyan-400 shadow-lg transition-colors"
            title={soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {soundMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          {/* Deploy Guide button */}
          <button
            onClick={() => setShowDeployGuide(true)}
            className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-700/70 text-slate-300 hover:text-amber-400 shadow-lg transition-colors"
            title="Deploy lên Render.com"
          >
            <Server className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Class Evolution Menu (Top-Left under top bar) */}
      {inGame && me && availableClasses.length > 0 && (
        <div className="absolute top-16 left-3 z-30 pointer-events-auto">
          <ClassUpgradeMenu
            availableClasses={availableClasses}
            onSelectClass={handleSelectClass}
            playerLevel={me.level}
          />
        </div>
      )}

      {/* 4. Top Right: Leaderboard & Kill Feed */}
      <div className="absolute top-14 right-3 z-20 pointer-events-none">
        <Leaderboard
          entries={leaderboard}
          myId={myId}
          recentKills={recentKills}
        />
      </div>

      {/* 5. Bottom HUD: Stats Panel, XP Bar, Minimap */}
      {inGame && me && (
        <div className="absolute bottom-3 inset-x-3 flex items-end justify-between pointer-events-none z-20">
          {/* Stats upgrade panel */}
          <div className="pointer-events-auto">
            <StatsPanel
              stats={me.stats}
              points={me.points}
              maxStat={7}
              onUpgrade={handleUpgradeStat}
              isSmasher={currentClassDef.isSmasher}
            />
          </div>

          {/* Center XP Bar & Current Class */}
          <div className="flex flex-col items-center gap-1.5 w-full max-w-sm pointer-events-auto pb-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 bg-slate-950/85 px-3 py-1 rounded-full border border-slate-700/60 backdrop-blur-md shadow-lg">
              <span className="text-cyan-400">{currentClassDef.name}</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300">Cấp {me.level}</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-mono">
                {me.totalScore.toLocaleString()} pts
              </span>
            </div>

            {/* XP ProgressBar */}
            <div className="w-full h-3.5 bg-slate-900/90 rounded-full border border-slate-700 overflow-hidden shadow-inner relative">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-150 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.7)]"
                style={{ width: `${xpProgress}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-slate-950 drop-shadow">
                {Math.floor(me.xp)} / {me.need} XP
              </span>
            </div>

            {/* Dash Energy hint */}
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Space / Chuột phải để Lướt Tốc Độ</span>
            </div>
          </div>

          {/* Minimap */}
          <div className="pointer-events-auto">
            <Minimap me={me} players={players} />
          </div>
        </div>
      )}

      {/* 6. Pre-Game Lobby Modal */}
      {!inGame && (
        <LobbyModal
          onJoin={handleJoin}
          onOpenDeployGuide={() => setShowDeployGuide(true)}
          connected={connected}
          totalPlayers={Object.keys(players).length}
        />
      )}

      {/* 7. Game Over Modal */}
      {isGameOver && deathStats && (
        <GameOverModal
          score={deathStats.score}
          kills={deathStats.kills}
          shapesDestroyed={deathStats.shapesDestroyed}
          level={deathStats.level}
          tankClass={deathStats.tankClass}
          aliveSeconds={deathStats.aliveSeconds}
          killerName={deathStats.killerName}
          onRespawn={handleRespawn}
        />
      )}

      {/* 8. Render Deployment Guide Modal */}
      {showDeployGuide && (
        <DeployGuideModal onClose={() => setShowDeployGuide(false)} />
      )}
    </div>
  );
}
