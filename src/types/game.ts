export type StatKey =
  | 'regen'
  | 'health'
  | 'bodyDamage'
  | 'bulletSpeed'
  | 'bulletPen'
  | 'bulletDamage'
  | 'reload'
  | 'speed';

export interface PlayerStats {
  regen: number;
  health: number;
  bodyDamage: number;
  bulletSpeed: number;
  bulletPen: number;
  bulletDamage: number;
  reload: number;
  speed: number;
}

export type TankClass =
  | 'basic'
  // Tier 2 (Level 15)
  | 'twin'
  | 'sniper'
  | 'machine_gun'
  | 'flank_guard'
  | 'smasher'
  | 'overseer'
  // Tier 3 (Level 30)
  | 'triple_shot'
  | 'assassin'
  | 'destroyer'
  | 'quad_tank'
  | 'tri_angle'
  | 'overlord'
  | 'trapper'
  // Tier 4 (Level 45)
  | 'triplet'
  | 'penta_shot'
  | 'annihilator'
  | 'booster'
  | 'fighter'
  | 'hybrid'
  | 'streamliner'
  | 'battleship';

export interface BarrelConfig {
  angle: number; // in radians relative to tank orientation
  offset: number; // lateral offset perpendicular to barrel
  width: number;
  length: number;
  recoil?: number;
  bulletScale?: number;
  speedMult?: number;
  damageMult?: number;
  isDroneSpawner?: boolean;
  isTrapSpawner?: boolean;
  spread?: number;
}

export interface ClassDefinition {
  name: string;
  tier: 1 | 2 | 3 | 4;
  reqLevel: number;
  prevClass?: TankClass[];
  description: string;
  bodyRadius: number;
  speedMult: number;
  reloadMult: number;
  damageMult: number;
  bodyDamageMult: number;
  maxHpMult: number;
  fovMult: number;
  barrels: BarrelConfig[];
  isSmasher?: boolean;
  isDroneClass?: boolean;
}

export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shooting: boolean;
  angle: number;
  dash?: boolean;
  autoFire?: boolean;
  autoSpin?: boolean;
}

export interface PlayerData {
  id: string;
  name: string;
  color: string;
  isBot: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  class: TankClass;
  level: number;
  xp: number;
  need: number;
  points: number;
  totalScore: number;
  kills: number;
  shapesDestroyed: number;
  hp: number;
  maxHp: number;
  stats: PlayerStats;
  dashEnergy: number; // 0 - 100
  biome: string;
  alive: boolean;
  recoil: number;
  lastDamagedBy?: string;
  aliveSeconds: number;
  invulnerableTimer: number; // Spawn protection in seconds
}

export type ShapeType = 'square' | 'triangle' | 'pentagon' | 'alpha_pentagon' | 'crasher';

export interface ShapeData {
  id: number;
  type: ShapeType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  maxHp: number;
  xp: number;
  angle: number;
  spinSpeed: number;
}

export interface BulletData {
  id: number;
  owner: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  damage: number;
  hp: number;
  life: number;
  maxLife: number;
  isDrone?: boolean;
  isTrap?: boolean;
  targetX?: number;
  targetY?: number;
}

export type WeatherType = 'clear' | 'rain' | 'sandstorm' | 'aurora';

export interface WeatherState {
  type: WeatherType;
  name: string;
  description: string;
  intensity: number; // 0 to 1
  timeRemaining: number; // in seconds
}

export interface BiomeZone {
  id: string;
  name: string;
  type: 'nest' | 'ice' | 'lava' | 'sanctuary' | 'stream' | 'neutral';
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  color: string;
  accent: string;
  description: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  kills: number;
  level: number;
  color: string;
  tankClass: TankClass;
  isBot: boolean;
}

export interface KillEvent {
  id: string;
  killerName: string;
  victimName: string;
  killerColor: string;
  victimColor: string;
  killerClass: TankClass;
  victimClass: TankClass;
  timestamp: number;
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  crit?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'square' | 'spark';
}

export interface ServerGameState {
  players: Record<string, PlayerData>;
  bullets: BulletData[];
  shapes: ShapeData[];
  weather: WeatherState;
  leaderboard: LeaderboardEntry[];
  recentKills: KillEvent[];
  mapSize: number;
  serverTime: number;
}
