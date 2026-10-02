import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import {
  PlayerData,
  BulletData,
  ShapeData,
  WeatherState,
  WeatherType,
  LeaderboardEntry,
  KillEvent,
  StatKey,
  TankClass,
} from './src/types/game.ts';
import { TANK_CLASSES, AVAILABLE_CLASSES_BY_TIER } from './src/constants/classes.ts';
import { BIOMES, MAP_SIZE, getBiomeAt } from './src/constants/biomes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;
const TICK_RATE = 30; // 30 FPS server-authoritative tick
const MAX_LEVEL = 45;
const MAX_STAT = 7;
const SHAPE_COUNT = 120;
const MAX_BOTS = 10;

// Base physics constants
const BASE_SPEED = 240;
const BASE_HP = 100;
const BASE_DAMAGE = 22;
const BASE_RELOAD = 0.38;
const BASE_BULLET_SPEED = 580;
const BASE_BODY_DAMAGE = 20;

const STAT_KEYS: StatKey[] = [
  'regen',
  'health',
  'bodyDamage',
  'bulletSpeed',
  'bulletPen',
  'bulletDamage',
  'reload',
  'speed',
];

const WEATHER_CYCLE: Array<{ type: WeatherType; name: string; desc: string }> = [
  {
    type: 'clear',
    name: 'Trời Quang Đãng',
    desc: 'Tầm nhìn tuyệt hảo, mọi chỉ số hoạt động bình thường.',
  },
  {
    type: 'rain',
    name: 'Mưa Giông Sấm Sét',
    desc: 'Đường đạn lướt nhanh hơn (+15% tốc độ đạn), bề mặt trơn trượt.',
  },
  {
    type: 'sandstorm',
    name: 'Bão Cát Sa Mạc',
    desc: 'Bụi cát cuồng nộ, tăng uy lực hỏa lực (+10% sát thương đạn).',
  },
  {
    type: 'aurora',
    name: 'Bình Minh Cực Quang',
    desc: 'Năng lượng thần bí phủ khắp chiến trường, tăng +25% điểm XP!',
  },
];

let currentWeatherIndex = 0;
let weatherTimeRemaining = 75; // seconds

const weatherState: WeatherState = {
  type: WEATHER_CYCLE[0].type,
  name: WEATHER_CYCLE[0].name,
  description: WEATHER_CYCLE[0].desc,
  intensity: 0.5,
  timeRemaining: weatherTimeRemaining,
};

// Game state containers
const players: Record<string, PlayerData> = {};
const playerInputs: Record<
  string,
  {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    shooting: boolean;
    angle: number;
    dash?: boolean;
  }
> = {};

let bullets: BulletData[] = [];
let shapes: ShapeData[] = [];
let nextShapeId = 1;
let nextBulletId = 1;
const recentKills: KillEvent[] = [];

// Helper functions
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function xpNeed(level: number): number {
  return Math.floor(18 + 22 * level + Math.pow(level, 1.45) * 6);
}

function newStats() {
  return {
    regen: 0,
    health: 0,
    bodyDamage: 0,
    bulletSpeed: 0,
    bulletPen: 0,
    bulletDamage: 0,
    reload: 0,
    speed: 0,
  };
}

function maxHpOf(p: PlayerData): number {
  const cls = TANK_CLASSES[p.class] || TANK_CLASSES.basic;
  return (BASE_HP + 25 * p.stats.health) * cls.maxHpMult;
}

function speedOf(p: PlayerData): number {
  const cls = TANK_CLASSES[p.class] || TANK_CLASSES.basic;
  let spd = BASE_SPEED * (1 + 0.06 * p.stats.speed) * cls.speedMult;
  // Biome modifications
  const biome = getBiomeAt(p.x, p.y);
  if (biome?.type === 'ice') spd *= 1.25;
  return spd;
}

function damageOf(p: PlayerData): number {
  const cls = TANK_CLASSES[p.class] || TANK_CLASSES.basic;
  let dmg = BASE_DAMAGE * (1 + 0.22 * p.stats.bulletDamage) * cls.damageMult;
  if (weatherState.type === 'sandstorm') dmg *= 1.1;
  return dmg;
}

function bodyDamageOf(p: PlayerData): number {
  const cls = TANK_CLASSES[p.class] || TANK_CLASSES.basic;
  return (BASE_BODY_DAMAGE + 12 * p.stats.bodyDamage) * cls.bodyDamageMult;
}

function reloadOf(p: PlayerData): number {
  const cls = TANK_CLASSES[p.class] || TANK_CLASSES.basic;
  return BASE_RELOAD * Math.pow(0.86, p.stats.reload) * cls.reloadMult;
}

function bulletSpeedOf(p: PlayerData): number {
  let spd = BASE_BULLET_SPEED * (1 + 0.08 * p.stats.bulletSpeed);
  if (weatherState.type === 'rain') spd *= 1.15;
  return spd;
}

function addXp(p: PlayerData, amount: number) {
  let adjusted = amount;
  if (weatherState.type === 'aurora') adjusted *= 1.25;

  p.xp += adjusted;
  p.totalScore += Math.floor(adjusted);

  while (p.level < MAX_LEVEL && p.xp >= p.need) {
    p.xp -= p.need;
    p.level++;
    p.points++;
    p.need = xpNeed(p.level);

    // Bot automatic evolution & skill point distribution
    if (p.isBot) {
      botAutoUpgrade(p);
    }
  }
}

function botAutoUpgrade(bot: PlayerData) {
  // Upgrade a random stat
  const unmaxedStats = STAT_KEYS.filter((k) => bot.stats[k] < MAX_STAT);
  if (unmaxedStats.length > 0 && bot.points > 0) {
    const picked = unmaxedStats[Math.floor(Math.random() * unmaxedStats.length)];
    bot.stats[picked]++;
    bot.points--;
    if (picked === 'health') bot.hp += 25;
  }

  // Evolve class if level requirement met
  if (bot.level >= 45 && bot.class !== 'triplet') {
    const tier4 = AVAILABLE_CLASSES_BY_TIER[4];
    bot.class = tier4[Math.floor(Math.random() * tier4.length)];
  } else if (bot.level >= 30 && bot.class === 'basic') {
    const tier3 = AVAILABLE_CLASSES_BY_TIER[3];
    bot.class = tier3[Math.floor(Math.random() * tier3.length)];
  } else if (bot.level >= 15 && bot.class === 'basic') {
    const tier2 = AVAILABLE_CLASSES_BY_TIER[2];
    bot.class = tier2[Math.floor(Math.random() * tier2.length)];
  }
}

function getSafeSpawnCoords(): { x: number; y: number } {
  for (let attempt = 0; attempt < 30; attempt++) {
    const x = rand(300, MAP_SIZE - 300);
    const y = rand(300, MAP_SIZE - 300);
    const distToCenter = Math.hypot(x - MAP_SIZE / 2, y - MAP_SIZE / 2);
    // Stay clear of central nest (radius 560 + 150 margin)
    if (distToCenter < 720) continue;
    // Stay clear of lava biome (x: 2500, y: 2500 to 4000, 4000)
    if (x >= 2400 && y >= 2400) continue;
    return { x, y };
  }
  return { x: 800, y: 800 };
}

function resetPlayer(p: PlayerData) {
  p.level = 1;
  p.xp = 0;
  p.points = 0;
  p.stats = newStats();
  p.totalScore = 0;
  p.kills = 0;
  p.shapesDestroyed = 0;
  p.class = 'basic';
  p.need = xpNeed(1);
  const safePos = getSafeSpawnCoords();
  p.x = safePos.x;
  p.y = safePos.y;
  p.vx = 0;
  p.vy = 0;
  p.maxHp = maxHpOf(p);
  p.hp = p.maxHp;
  p.dashEnergy = 100;
  p.alive = true;
  p.aliveSeconds = 0;
  p.recoil = 0;
  p.invulnerableTimer = 4.0; // 4 seconds of spawn protection
}

// Shape Spawner
function spawnShape(forceNest: boolean = false) {
  const isCenter = forceNest || Math.random() < 0.25;
  let type: ShapeData['type'] = 'square';

  if (isCenter) {
    const roll = Math.random();
    if (roll < 0.05) type = 'alpha_pentagon';
    else if (roll < 0.35) type = 'crasher';
    else type = 'pentagon';
  } else {
    type = Math.random() < 0.3 ? 'triangle' : 'square';
  }

  let hp = 30;
  let xp = 10;
  let r = 20;

  let x = rand(100, MAP_SIZE - 100);
  let y = rand(100, MAP_SIZE - 100);

  if (type === 'triangle') {
    hp = 60;
    xp = 25;
    r = 24;
  } else if (type === 'pentagon') {
    hp = 220;
    xp = 130;
    r = 34;
    x = MAP_SIZE / 2 + rand(-400, 400);
    y = MAP_SIZE / 2 + rand(-400, 400);
  } else if (type === 'alpha_pentagon') {
    hp = 2500;
    xp = 3200;
    r = 85;
    x = MAP_SIZE / 2 + rand(-180, 180);
    y = MAP_SIZE / 2 + rand(-180, 180);
  } else if (type === 'crasher') {
    hp = 45;
    xp = 20;
    r = 16;
    x = MAP_SIZE / 2 + rand(-350, 350);
    y = MAP_SIZE / 2 + rand(-350, 350);
  }

  shapes.push({
    id: nextShapeId++,
    type,
    x,
    y,
    vx: 0,
    vy: 0,
    r,
    hp,
    maxHp: hp,
    xp,
    angle: rand(0, Math.PI * 2),
    spinSpeed: rand(-0.02, 0.02),
  });
}

// Populate initial shapes
for (let i = 0; i < SHAPE_COUNT; i++) spawnShape();

// Bot Creator
const BOT_NAMES = [
  'TerminatorX',
  'CyberStriker',
  'PhantomSniper',
  'VanguardBot',
  'OmegaTank',
  'NovaFighter',
  'ApexPredator',
  'Ragnarok',
  'ShadowReaper',
  'IronClad',
  'BlasterBot',
  'MatrixGhost',
];

const BOT_COLORS = [
  '#00b2e1',
  '#f14e54',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#14b8a6',
];

function spawnBot() {
  const botId = 'bot_' + Math.floor(rand(1000, 9999));
  const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const botColor = BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];

  const p: PlayerData = {
    id: botId,
    name: botName,
    color: botColor,
    isBot: true,
    x: rand(300, MAP_SIZE - 300),
    y: rand(300, MAP_SIZE - 300),
    vx: 0,
    vy: 0,
    angle: rand(0, Math.PI * 2),
    class: 'basic',
    level: 1,
    xp: 0,
    need: xpNeed(1),
    points: 0,
    totalScore: 0,
    kills: 0,
    shapesDestroyed: 0,
    hp: BASE_HP,
    maxHp: BASE_HP,
    stats: newStats(),
    dashEnergy: 100,
    biome: 'neutral',
    alive: true,
    recoil: 0,
    aliveSeconds: 0,
    invulnerableTimer: 2.0,
  };

  resetPlayer(p);
  // Give bot a bit of random starting XP to create dynamic tier variety
  const initialBonus = Math.floor(rand(100, 1800));
  addXp(p, initialBonus);

  players[botId] = p;
  playerInputs[botId] = {
    up: false,
    down: false,
    left: false,
    right: false,
    shooting: true,
    angle: 0,
  };
}

// Initial Bot Pool
for (let i = 0; i < MAX_BOTS; i++) {
  spawnBot();
}

// Socket IO Event Handling
io.on('connection', (socket) => {
  // Prepare player record
  const p: PlayerData = {
    id: socket.id,
    name: 'Hero Tank',
    color: '#00b2e1',
    isBot: false,
    x: rand(300, MAP_SIZE - 300),
    y: rand(300, MAP_SIZE - 300),
    vx: 0,
    vy: 0,
    angle: 0,
    class: 'basic',
    level: 1,
    xp: 0,
    need: xpNeed(1),
    points: 0,
    totalScore: 0,
    kills: 0,
    shapesDestroyed: 0,
    hp: BASE_HP,
    maxHp: BASE_HP,
    stats: newStats(),
    dashEnergy: 100,
    biome: 'neutral',
    alive: false, // Spawn when requested
    recoil: 0,
    aliveSeconds: 0,
    invulnerableTimer: 0,
  };

  players[socket.id] = p;
  playerInputs[socket.id] = {
    up: false,
    down: false,
    left: false,
    right: false,
    shooting: false,
    angle: 0,
  };

  // Notify client of their confirmed socket ID
  socket.emit('init', { id: socket.id, mapSize: MAP_SIZE });

  // Client requests spawn
  socket.on('spawn', (data: { name: string; color: string }) => {
    let pl = players[socket.id];
    if (!pl) {
      pl = {
        id: socket.id,
        name: 'Hero Tank',
        color: '#00b2e1',
        isBot: false,
        x: 800,
        y: 800,
        vx: 0,
        vy: 0,
        angle: 0,
        class: 'basic',
        level: 1,
        xp: 0,
        need: xpNeed(1),
        points: 0,
        totalScore: 0,
        kills: 0,
        shapesDestroyed: 0,
        hp: BASE_HP,
        maxHp: BASE_HP,
        stats: newStats(),
        dashEnergy: 100,
        biome: 'neutral',
        alive: true,
        recoil: 0,
        aliveSeconds: 0,
        invulnerableTimer: 4.0,
      };
      players[socket.id] = pl;
      playerInputs[socket.id] = {
        up: false,
        down: false,
        left: false,
        right: false,
        shooting: false,
        angle: 0,
      };
    }

    if (data.name && typeof data.name === 'string') {
      pl.name = data.name.trim().substring(0, 18) || 'Hero Tank';
    }
    if (data.color && typeof data.color === 'string') {
      pl.color = data.color;
    }
    resetPlayer(pl);
    pl.alive = true;
    pl.invulnerableTimer = 4.0;

    // Immediately send spawn confirmation with coordinates to client
    socket.emit('spawned', { id: socket.id, x: pl.x, y: pl.y });
  });

  // Client inputs
  socket.on('input', (input) => {
    const pl = players[socket.id];
    if (!pl || !pl.alive) return;

    playerInputs[socket.id] = {
      up: !!input.up,
      down: !!input.down,
      left: !!input.left,
      right: !!input.right,
      shooting: !!input.shooting,
      angle: Number.isFinite(input.angle) ? input.angle : pl.angle,
      dash: !!input.dash,
    };
    if (Number.isFinite(input.angle)) {
      pl.angle = input.angle;
    }
  });

  // Client upgrades skill stat
  socket.on('upgrade', (stat: StatKey) => {
    const pl = players[socket.id];
    if (!pl || !pl.alive || !STAT_KEYS.includes(stat)) return;
    if (pl.points <= 0 || pl.stats[stat] >= MAX_STAT) return;

    const cls = TANK_CLASSES[pl.class] || TANK_CLASSES.basic;
    if (
      cls.isSmasher &&
      ['bulletSpeed', 'bulletPen', 'bulletDamage', 'reload'].includes(stat)
    ) {
      return;
    }

    pl.stats[stat]++;
    pl.points--;
    if (stat === 'health') {
      pl.maxHp = maxHpOf(pl);
      pl.hp += 25;
    }
  });

  // Client selects evolved class
  socket.on('selectClass', (targetClass: TankClass) => {
    const pl = players[socket.id];
    if (!pl || !pl.alive) return;
    const targetDef = TANK_CLASSES[targetClass];
    if (!targetDef) return;
    if (pl.level < targetDef.reqLevel) return;

    pl.class = targetClass;
    pl.maxHp = maxHpOf(pl);
    pl.hp = Math.min(pl.hp, pl.maxHp);
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    delete playerInputs[socket.id];
  });
});

// Cooldown tracking for shooting
const playerCooldowns: Record<string, number> = {};

// Main Server Tick Loop (30 FPS)
setInterval(() => {
  const dt = 1 / TICK_RATE;

  // 1. Weather Update
  weatherTimeRemaining -= dt;
  if (weatherTimeRemaining <= 0) {
    currentWeatherIndex = (currentWeatherIndex + 1) % WEATHER_CYCLE.length;
    const nextW = WEATHER_CYCLE[currentWeatherIndex];
    weatherState.type = nextW.type;
    weatherState.name = nextW.name;
    weatherState.description = nextW.desc;
    weatherTimeRemaining = rand(60, 90);
  }
  weatherState.timeRemaining = weatherTimeRemaining;

  // 2. Maintain Bot Count
  const currentBotCount = Object.values(players).filter(
    (p) => p.isBot && p.alive
  ).length;
  if (currentBotCount < MAX_BOTS) {
    spawnBot();
  }

  // 3. AI Bot Decision Cycle
  for (const id in players) {
    const p = players[id];
    if (!p.isBot || !p.alive) continue;

    // AI Logic: Find nearest target (shape or player)
    let closestTarget: { x: number; y: number; dist: number; isPlayer: boolean } | null = null;

    // Check shapes within 700px
    for (const s of shapes) {
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < 700 && (!closestTarget || d < closestTarget.dist)) {
        closestTarget = { x: s.x, y: s.y, dist: d, isPlayer: false };
      }
    }

    // Check players/other bots within 550px
    for (const otherId in players) {
      if (otherId === id) continue;
      const op = players[otherId];
      if (!op.alive) continue;
      const d = Math.hypot(op.x - p.x, op.y - p.y);
      if (d < 550 && (!closestTarget || d < closestTarget.dist * 0.7)) {
        closestTarget = { x: op.x, y: op.y, dist: d, isPlayer: true };
      }
    }

    const inp = playerInputs[id];
    if (closestTarget) {
      const aimAngle = Math.atan2(closestTarget.y - p.y, closestTarget.x - p.x);
      p.angle = aimAngle;
      inp.angle = aimAngle;
      inp.shooting = true;

      // Move towards target if safe, or back away if very close
      if (closestTarget.dist > 180) {
        inp.up = Math.sin(aimAngle) < -0.3;
        inp.down = Math.sin(aimAngle) > 0.3;
        inp.left = Math.cos(aimAngle) < -0.3;
        inp.right = Math.cos(aimAngle) > 0.3;
      } else {
        // strafe
        inp.up = Math.cos(aimAngle) > 0;
        inp.down = Math.cos(aimAngle) <= 0;
        inp.left = false;
        inp.right = false;
      }
    } else {
      // Wander around arena
      inp.up = p.y > MAP_SIZE / 2;
      inp.down = p.y < MAP_SIZE / 2;
      inp.left = p.x > MAP_SIZE / 2;
      inp.right = p.x < MAP_SIZE / 2;
      inp.shooting = Math.random() < 0.4;
    }
  }

  // 4. Player Physics & Movement
  for (const id in players) {
    const p = players[id];
    if (!p.alive) continue;
    p.aliveSeconds += dt;
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer = Math.max(0, p.invulnerableTimer - dt);
    }

    const inp = playerInputs[id] || {
      up: false,
      down: false,
      left: false,
      right: false,
      shooting: false,
      angle: 0,
    };

    let dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    let dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    const maxSpd = speedOf(p);
    const biome = getBiomeAt(p.x, p.y);
    p.biome = biome ? biome.id : 'neutral';

    // Acceleration & inertia
    const accel = biome?.type === 'ice' ? 8 : 18;
    p.vx += (dx * maxSpd - p.vx) * accel * dt;
    p.vy += (dy * maxSpd - p.vy) * accel * dt;

    // Dash / Thruster burst
    p.dashEnergy = Math.min(100, p.dashEnergy + 20 * dt);
    if (inp.dash && p.dashEnergy >= 40) {
      p.dashEnergy -= 40;
      const dashAngle = dx !== 0 || dy !== 0 ? Math.atan2(dy, dx) : p.angle;
      p.vx += Math.cos(dashAngle) * 450;
      p.vy += Math.sin(dashAngle) * 450;
    }

    // Biome Environmental Effects
    if (biome?.type === 'sanctuary') {
      // 3x Natural Regen
      p.hp = Math.min(maxHpOf(p), p.hp + (6 + 3 * p.stats.regen) * dt);
    } else if (biome?.type === 'lava') {
      // Lava slight damage (only if not invulnerable)
      if (p.invulnerableTimer <= 0) {
        p.hp -= 2.5 * dt;
        if (p.hp <= 0) {
          p.alive = false;
          p.lastDamagedBy = 'Dung Nham Obsidian';
        }
      }
    } else {
      // Standard Regen
      p.hp = Math.min(maxHpOf(p), p.hp + (2.5 + 1.5 * p.stats.regen) * dt);
    }

    // Apply movement
    const cls = TANK_CLASSES[p.class] || TANK_CLASSES.basic;
    const bodyR = cls.bodyRadius || 24;

    p.x = Math.max(bodyR, Math.min(MAP_SIZE - bodyR, p.x + p.vx * dt));
    p.y = Math.max(bodyR, Math.min(MAP_SIZE - bodyR, p.y + p.vy * dt));

    // Recoil decay
    p.recoil = Math.max(0, p.recoil - 6 * dt);

    // Shooting
    if (!playerCooldowns[id]) playerCooldowns[id] = 0;
    playerCooldowns[id] -= dt;

    if (inp.shooting && playerCooldowns[id] <= 0 && !cls.isSmasher) {
      playerCooldowns[id] = reloadOf(p);
      p.recoil = 1.0;

      // Spawn bullets for each barrel
      cls.barrels.forEach((b) => {
        let finalAngle = p.angle + b.angle;
        if (b.spread) finalAngle += rand(-b.spread, b.spread);

        // Barrel muzzle tip coordinate
        const barrelLen = bodyR + b.length;
        const spawnX =
          p.x +
          Math.cos(p.angle) * barrelLen +
          Math.cos(p.angle + Math.PI / 2) * b.offset;
        const spawnY =
          p.y +
          Math.sin(p.angle) * barrelLen +
          Math.sin(p.angle + Math.PI / 2) * b.offset;

        // Recoil kickback on tank
        const recoilPwr = b.recoil || 3;
        p.vx -= Math.cos(finalAngle) * recoilPwr * 7;
        p.vy -= Math.sin(finalAngle) * recoilPwr * 7;

        const bSpd = bulletSpeedOf(p) * (b.speedMult || 1);
        const bRadius = (b.bulletScale || 1.0) * (b.isTrapSpawner ? 13 : 8.5);
        const bDmg = damageOf(p) * (b.damageMult || 1);

        bullets.push({
          id: nextBulletId++,
          owner: id,
          color: p.color,
          x: spawnX,
          y: spawnY,
          vx: Math.cos(finalAngle) * bSpd,
          vy: Math.sin(finalAngle) * bSpd,
          r: bRadius,
          damage: bDmg,
          hp: 10 + 15 * p.stats.bulletPen,
          life: b.isTrapSpawner ? 7.0 : 1.7,
          maxLife: b.isTrapSpawner ? 7.0 : 1.7,
          isDrone: !!b.isDroneSpawner,
          isTrap: !!b.isTrapSpawner,
        });
      });
    }
  }

  // 5. Crasher AI movement towards closest player in nest
  for (const s of shapes) {
    if (s.type === 'crasher') {
      let nearestP: PlayerData | null = null;
      let minD = 500;
      for (const id in players) {
        const p = players[id];
        if (!p.alive) continue;
        const d = Math.hypot(p.x - s.x, p.y - s.y);
        if (d < minD) {
          minD = d;
          nearestP = p;
        }
      }
      if (nearestP) {
        const angle = Math.atan2(nearestP.y - s.y, nearestP.x - s.x);
        s.vx += Math.cos(angle) * 220 * dt;
        s.vy += Math.sin(angle) * 220 * dt;
      }
      s.vx *= 0.94;
      s.vy *= 0.94;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    s.angle += s.spinSpeed;
  }

  // 6. Bullet Physics & Collisions
  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    if (b.life <= 0) continue;

    // Bullet vs Tank collision
    for (const id in players) {
      if (id === b.owner || b.life <= 0) continue;
      const p = players[id];
      if (!p.alive) continue;

      const cls = TANK_CLASSES[p.class] || TANK_CLASSES.basic;
      const bodyR = cls.bodyRadius || 24;

      if (Math.hypot(p.x - b.x, p.y - b.y) < bodyR + b.r) {
        if (p.invulnerableTimer > 0) {
          b.life = 0; // Bullet absorbed harmlessly by spawn shield
          continue;
        }
        p.hp -= b.damage;
        b.life = 0;
        p.lastDamagedBy = players[b.owner]?.name || 'Chiến Xa Vô Danh';

        if (p.hp <= 0) {
          p.alive = false;
          const killer = players[b.owner];
          if (killer) {
            killer.kills++;
            addXp(killer, 120 + p.totalScore * 0.5);

            // Record Kill Event
            recentKills.unshift({
              id: 'kill_' + Date.now() + Math.random(),
              killerName: killer.name,
              victimName: p.name,
              killerColor: killer.color,
              victimColor: p.color,
              killerClass: killer.class,
              victimClass: p.class,
              timestamp: Date.now(),
            });
            if (recentKills.length > 8) recentKills.pop();
          }
        }
      }
    }

    if (b.life <= 0) continue;

    // Bullet vs Shape collision
    for (const s of shapes) {
      if (Math.hypot(s.x - b.x, s.y - b.y) < s.r + b.r) {
        s.hp -= b.damage;
        b.life = 0;

        if (s.hp <= 0) {
          (s as unknown as { dead?: boolean }).dead = true;
          const owner = players[b.owner];
          if (owner) {
            owner.shapesDestroyed++;
            addXp(owner, s.xp);
          }
        }
        break;
      }
    }
  }

  // 7. Tank vs Shape Body Ramming Collisions
  for (const id in players) {
    const p = players[id];
    if (!p.alive) continue;

    const cls = TANK_CLASSES[p.class] || TANK_CLASSES.basic;
    const bodyR = cls.bodyRadius || 24;

    for (const s of shapes) {
      const dist = Math.hypot(s.x - p.x, s.y - p.y);
      if (dist < bodyR + s.r) {
        if (p.invulnerableTimer > 0) {
          // Push shape away harmlessly
          const pushAng = Math.atan2(s.y - p.y, s.x - p.x);
          s.vx += Math.cos(pushAng) * 160;
          s.vy += Math.sin(pushAng) * 160;
          continue;
        }
        // Ramming exchange
        const pBodyDmg = bodyDamageOf(p);
        const sDmg = s.type === 'crasher' ? 25 : s.r * 0.8;

        s.hp -= pBodyDmg;
        p.hp -= sDmg;
        p.lastDamagedBy = `Khối ${s.type}`;

        // Knockback
        const ang = Math.atan2(p.y - s.y, p.x - s.x);
        p.vx += Math.cos(ang) * 120;
        p.vy += Math.sin(ang) * 120;

        if (s.hp <= 0) {
          (s as unknown as { dead?: boolean }).dead = true;
          p.shapesDestroyed++;
          addXp(p, s.xp);
        }

        if (p.hp <= 0) {
          p.alive = false;
        }
      }
    }
  }

  // Cleanup dead bullets & shapes
  bullets = bullets.filter(
    (b) =>
      b.life > 0 &&
      b.x > -50 &&
      b.x < MAP_SIZE + 50 &&
      b.y > -50 &&
      b.y < MAP_SIZE + 50
  );
  shapes = shapes.filter((s) => !(s as unknown as { dead?: boolean }).dead);
  while (shapes.length < SHAPE_COUNT) spawnShape();

  // 8. Generate Real-time Top 10 Leaderboard
  const leaderboard: LeaderboardEntry[] = Object.values(players)
    .filter((p) => p.alive)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      name: p.name,
      score: Math.floor(p.totalScore),
      kills: p.kills,
      level: p.level,
      color: p.color,
      tankClass: p.class,
      isBot: p.isBot,
    }));

  // 9. Broadcast State to Clients
  io.emit('state', {
    players,
    bullets: bullets.map((b) => ({
      id: b.id,
      owner: b.owner,
      color: b.color,
      x: Math.round(b.x),
      y: Math.round(b.y),
      vx: b.vx,
      vy: b.vy,
      r: b.r,
      damage: b.damage,
      hp: b.hp,
      life: b.life,
      maxLife: b.maxLife,
      isDrone: b.isDrone,
      isTrap: b.isTrap,
    })),
    shapes: shapes.map((s) => ({
      id: s.id,
      type: s.type,
      x: Math.round(s.x),
      y: Math.round(s.y),
      vx: s.vx,
      vy: s.vy,
      r: s.r,
      hp: Math.round(s.hp),
      maxHp: s.maxHp,
      xp: s.xp,
      angle: s.angle,
      spinSpeed: s.spinSpeed,
    })),
    weather: weatherState,
    leaderboard,
    recentKills,
    mapSize: MAP_SIZE,
    serverTime: Date.now(),
  });
}, 1000 / TICK_RATE);

// Setup Express Static / Dev Mode
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`[DIEP.IO ENHANCED] Server running on http://localhost:${PORT}`);
  });
}

startServer();
