export interface Terrain {
  name: string;
  imagePath: string;
  height: number;
  width: number;
}

export const terrainForest: Terrain = {
  name: "forest",
  imagePath: "./terrain-forest.svg",
  height: 8000,
  width: 8000,
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
  // emoji: "🎟️", "🎫", "♦️", "🫘", "🧬", "💙", "🟪", "🟦", "🟩", "🟨", "🟧", "🟥"
  emoji: "🟪",
  fontSize: 20,
  width: 20,
  height: 20,
};

// bg-violet-50 rgb(245 243 255);
// bg-violet-100 rgb(237 233 254);
// bg-violet-200 rgb(221 214 254);
// bg-violet-300 rgb(196 181 253);
// bg-violet-400 rgb(167 139 250);
// bg-violet-500 rgb(139 92 246);
// bg-violet-600 rgb(124 58 237);
// bg-violet-700 rgb(109 40 217);
// bg-violet-800 rgb(91 33 182);
// bg-violet-900 rgb(76 29 149);
// bg-violet-950 rgb(46 16 101);
//
// bg-purple-50 rgb(250 245 255);
// bg-purple-100 rgb(243 232 255);
// bg-purple-200 rgb(233 213 255);
// bg-purple-300 rgb(216 180 254);
// bg-purple-400 rgb(192 132 252);
// bg-purple-500 rgb(168 85 247);
// bg-purple-600 rgb(147 51 234);
// bg-purple-700 rgb(126 34 206);
// bg-purple-800 rgb(107 33 168);
// bg-purple-900 rgb(88 28 135);
// bg-purple-950 rgb(59 7 100);
//
// bg-fuchsia-50 rgb(253 244 255);
// bg-fuchsia-100 rgb(250 232 255);
// bg-fuchsia-200 rgb(245 208 254);
// bg-fuchsia-300 rgb(240 171 252);
// bg-fuchsia-400 rgb(232 121 249);
// bg-fuchsia-500 rgb(217 70 239);
// bg-fuchsia-600 rgb(192 38 211);
// bg-fuchsia-700 rgb(162 28 175);
// bg-fuchsia-800 rgb(134 25 143);
// bg-fuchsia-900 rgb(112 26 117);
// bg-fuchsia-950 rgb(74 4 78);
//
// accessoryLuck: "🍀"
// pickupHealthSmall: "🍗"
// pickupHealthMedium: "🥩",
// pickupHealthLarge: "🍖"
// pickupGoldCoin: "🪙"
// pickupGoldBag: "💰"
// weaponBoomerang: "🪃"
// weaponAxe: "🪓"
// enemyOgre: "👹"
