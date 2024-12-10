import type { WorldMap, GameObject, Alive, Weapon } from "./engine";

// maps
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

// player weapons
const weaponWhip: Weapon = {
  name: "whip",
  damage: 2,
  durationActive: {max: 1000, current: 0},
  durationCooldown: {max: 2000, current: 0},
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
const weaponSword: Weapon = {
  name: "sword",
  damage: 4,
  durationActive: {max: 2000, current: 0},
  durationCooldown: {max: 5000, current: 0},
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
// weaponBoomerang: "🪃"
// weaponAxe: "🪓"
export const weaponsPlayerAll = [weaponWhip, weaponSword];


export const player: Alive = {
  name: "player",
  health: {max: 100, current: 0},
  speed: 1,
  weapons: [...weaponsPlayerAll],
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

// enemies
const enemySkeleton: Alive = {
  name: "skeleton",
  health: {max: 1, current: 0},
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
  health: {max: 1, current: 0},
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
  health: {max: 100, current: 0},
  speed: 0.05,
  weapons: [],
  sprite: {
    name: "goblin",
    colorBg: "rgb(239 68 68)", // bg-red-500
    colorHit: "rgb(252 165 165)", // bg-red-300
    emoji: "👺",
    fontSize: 64,
    width: 64,
    height: 64,
  },
};
// enemyWitch
// enemyDog
// enemyDragonfly
// enemyOgre: "👹"
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

export const pickupXp: GameObject = {
  name: "experience-gem",
  sprite: {
    name: "experience-gem",
    colorBg: "rgb(139 92 246)", // bg-violet-500
    colorHit: "rgb(196 181 253)", // bg-violet-300
    // emoji: "🟪", "🟦", "🟩", "🟥"
    emoji: "🟪",
    fontSize: 20,
    width: 20,
    height: 20,
  },
};

// accessoryLuck: "🍀"
// pickupHealthSmall: "🍗"
// pickupHealthMedium: "🥩",
// pickupHealthLarge: "🍖"
// pickupGoldCoin: "🪙"
// pickupGoldBag: "💰"
