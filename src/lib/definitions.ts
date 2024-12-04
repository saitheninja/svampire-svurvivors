interface ImageSvg {
  path: string;
  height: number;
  width: number;
}

export interface WorldMap {
  name: string;
  terrain: ImageSvg;
  background: ImageSvg; // tiles
}

export const mapForest: WorldMap = {
  name: "forest",
  terrain: {
    path: "./terrain-forest.svg",
    height: 8000,
    width: 8000,
  },
  background: {
    path: "./tree.svg",
    height: 150,
    width: 50,
  },
};

export interface Sprite {
  name: string;
  colorBg: string;
  colorHit: string;
  emoji: string;
  fontSize: number; // px
  height: number; // px
  width: number; // px
}

interface GameObject {
  name: string;
  sprite: Sprite;
  el?: HTMLDivElement;
}

export interface Weapon extends GameObject {
  damage: number;
  durationActive: number; // milliseconds
  durationActiveElapsed: number;
  durationCooldown: number;
  durationCooldownElapsed: number;
  // levelCurrent: number;
  // levelMax: number;
}

const whip: Weapon = {
  name: "whip",
  damage: 2,
  durationActive: 1000,
  durationActiveElapsed: 0,
  durationCooldown: 2000,
  durationCooldownElapsed: 0,
  sprite: {
    name: "whip",
    colorBg: "rgb(30 58 138)", // bg-blue-900
    colorHit: "rgb(147 197 253)", // bg-blue-300
    emoji: "🔗🔗🔗🔗",
    fontSize: 24,
    width: 24 * 5,
    height: 24,
  },
};
const sword: Weapon = {
  name: "sword",
  damage: 4,
  durationActive: 2000,
  durationActiveElapsed: 0,
  durationCooldown: 5000,
  durationCooldownElapsed: 0,
  sprite: {
    name: "sword",
    colorBg: "rgb(30 58 138)", // bg-blue-900
    colorHit: "rgb(147 197 253)", // bg-blue-300
    emoji: "🗡️",
    fontSize: 48,
    width: 48,
    height: 48,
  },
};

const weaponsAll: Weapon[] = [whip, sword];

export interface Alive extends GameObject {
  healthCurrent: number;
  healthMax: number;
  speed: number;
  weapons: Weapon[];
}

export const player: Alive = {
  name: "player",
  healthCurrent: 100,
  healthMax: 100,
  speed: 1,
  weapons: [...weaponsAll],
  sprite: {
    name: "player",
    colorBg: "rgb(30 58 138)", // bg-blue-900
    colorHit: "rgb(147 197 253)", // bg-blue-300
    emoji: "🧔🏾",
    fontSize: 48,
    width: 48,
    height: 48,
  },
};

const enemySkeleton: Alive = {
  name: "skeleton",
  healthCurrent: 1,
  healthMax: 1,
  speed: 0.1,
  weapons: [],
  sprite: {
    name: "skeleton",
    colorBg: "rgb(132 204 22)", // bg-lime-500
    colorHit: "rgb(190 242 100)", // bg-lime-300
    emoji: "💀",
    fontSize: 48,
    width: 48,
    height: 48,
  },
};
const enemyZombie: Alive = {
  name: "zombie",
  healthCurrent: 4,
  healthMax: 4,
  speed: 0.1,
  weapons: [],
  sprite: {
    name: "zombie",
    colorBg: "rgb(132 204 22)", // bg-lime-500
    colorHit: "rgb(190 242 100)", // bg-lime-300
    emoji: "🧟",
    fontSize: 48,
    width: 48,
    height: 48,
  },
};
const enemyGoblin: Alive = {
  name: "goblin",
  healthCurrent: 100,
  healthMax: 100,
  speed: 0.05,
  weapons: [],
  sprite: {
    name: "goblin",
    colorBg: "rgb(239 68 68)", // bg-red-500
    colorHit: "rgb(252 165 165)", // bg-red-300
    emoji: "👺",
    fontSize: 80,
    width: 80,
    height: 80,
  },
};
// Witch
// Dog
// Dragonfly

export const enemyWave: Alive[] = [
  enemySkeleton,
  enemySkeleton,
  enemySkeleton,
  enemySkeleton,
  enemySkeleton,
  enemySkeleton,
  enemySkeleton,
  enemyZombie,
  enemyZombie,
  enemyGoblin,
  enemyZombie,
  enemyZombie,
];

interface PlayerLevel {
  level: number;
  xpToNext: number;
}
const xpStep = 10;
export const playerLevels: PlayerLevel[] = [
  { level: 1, xpToNext: xpStep * 1 },
  { level: 2, xpToNext: xpStep * 2 },
  { level: 3, xpToNext: xpStep * 3 },
  { level: 4, xpToNext: xpStep * 4 },
  { level: 5, xpToNext: xpStep * 5 },
  { level: 6, xpToNext: xpStep * 6 },
  { level: 7, xpToNext: xpStep * 7 },
  { level: 8, xpToNext: xpStep * 8 },
  { level: 9, xpToNext: xpStep * 9 },
  { level: 10, xpToNext: xpStep * 10 },
];
// on level up, choose upgrade

export const pickupXp: Sprite = {
  name: "experience-gem",
  colorBg: "rgb(139 92 246)", // bg-violet-500
  colorHit: "rgb(196 181 253)", // bg-violet-300
  // emoji: "🟪", "🟦", "🟩", "🟥"
  emoji: "🟪",
  fontSize: 20,
  width: 20,
  height: 20,
};

// accessoryLuck: "🍀"
// pickupHealthSmall: "🍗"
// pickupHealthMedium: "🥩",
// pickupHealthLarge: "🍖"
// pickupGoldCoin: "🪙"
// pickupGoldBag: "💰"
// weaponBoomerang: "🪃"
// weaponAxe: "🪓"
// enemyOgre: "👹"
