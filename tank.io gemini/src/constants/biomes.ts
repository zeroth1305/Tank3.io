import { BiomeZone } from '../types/game.ts';

export const MAP_SIZE = 4000;

export const BIOMES: BiomeZone[] = [
  {
    id: 'nest',
    name: 'Pentagon Nest',
    type: 'nest',
    x: 2000,
    y: 2000,
    radius: 560,
    color: 'rgba(124, 58, 237, 0.12)',
    accent: '#a855f7',
    description: 'Tổ ngũ giác trung tâm - Nơi ngự trị của Alpha Pentagon & đàn Crasher hung dữ!',
  },
  {
    id: 'ice',
    name: 'Glacier Tundra',
    type: 'ice',
    x: 0,
    y: 0,
    width: 1500,
    height: 1500,
    color: 'rgba(56, 189, 248, 0.12)',
    accent: '#38bdf8',
    description: 'Băng nguyên giá lạnh - Bề mặt trơn trượt giảm ma sát tăng tốc độ lướt!',
  },
  {
    id: 'lava',
    name: 'Obsidian Magma',
    type: 'lava',
    x: 2500,
    y: 2500,
    width: 1500,
    height: 1500,
    color: 'rgba(239, 68, 68, 0.12)',
    accent: '#ef4444',
    description: 'Hầm dung nham - Đầy bụi lửa, chiến trường rực lửa tàn sát!',
  },
  {
    id: 'sanctuary',
    name: 'Emerald Oasis',
    type: 'sanctuary',
    x: 2600,
    y: 100,
    width: 1300,
    height: 1300,
    color: 'rgba(34, 197, 94, 0.12)',
    accent: '#22c55e',
    description: 'Ốc đảo phồn vinh - Tăng gấp 3 lần tốc độ hồi phục sinh lực tự nhiên!',
  },
];

export function getBiomeAt(x: number, y: number): BiomeZone | null {
  // Check Nest first
  const nest = BIOMES.find((b) => b.type === 'nest');
  if (nest && nest.radius) {
    const dist = Math.hypot(x - nest.x, y - nest.y);
    if (dist <= nest.radius) return nest;
  }

  // Check rectangular zones
  for (const b of BIOMES) {
    if (b.type === 'nest') continue;
    if (b.width && b.height) {
      if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
        return b;
      }
    }
  }

  return null;
}
