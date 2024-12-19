import type { GameRound, WorldMap, Sprite, GameObject, Alive, Weapon } from "./engine";

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
const spriteWhip1: Sprite = {
  name: "whip",
  colorBg: "rgb(30 58 138)", // bg-blue-900
  colorHit: "rgb(147 197 253)", // bg-blue-300
  emoji: "🔗🔗🔗🔗",
  fontSize: 24,
  width: 24 * 5,
  height: 24,
};
const weaponWhip: Weapon = {
  name: "whip",
  damage: 2,
  durationActive: { min: 0, max: 1000, current: 0 },
  durationCooldown: { min: 0, max: 2000, current: 0 },
  level: 1,
  maxSpawns: 1,
  sprite: spriteWhip1,
};
const spriteSword1: Sprite = {
  name: "sword",
  colorBg: "rgb(30 58 138)", // bg-blue-900
  colorHit: "rgb(147 197 253)", // bg-blue-300
  emoji: "🗡️",
  fontSize: 48,
  width: 48,
  height: 48,
};
const weaponSword: Weapon = {
  name: "sword",
  damage: 4,
  durationActive: { min: 0, max: 2000, current: 0 },
  durationCooldown: { min: 0, max: 5000, current: 0 },
  level: 1,
  maxSpawns: 1,
  sprite: spriteSword1,
};
// weaponBoomerang: "🪃"
// weaponAxe: "🪓"
export const weaponsPlayerAll = [weaponWhip, weaponSword];

// enemy weapons
const weaponSkeletonBody: Weapon = {
  name: "skeleton-body",
  damage: 1,
  durationActive: { min: 0, max: 5000, current: 0 },
  durationCooldown: { min: 0, max: 1, current: 0 },
  level: 1,
  maxSpawns: 1,
  sprite: {
    name: "skeleton-body",
    colorBg: "rgb(30 58 138)", // bg-blue-900
    colorHit: "rgb(147 197 253)", // bg-blue-300
    emoji: "",
    fontSize: 48,
    width: 48,
    height: 48,
  },
};
const weaponZombieBody: Weapon = {
  name: "zombie-body",
  damage: 1,
  durationActive: { min: 0, max: 5000, current: 0 },
  durationCooldown: { min: 0, max: 1, current: 0 },
  level: 1,
  maxSpawns: 1,
  sprite: {
    name: "zombie-body",
    colorBg: "rgb(30 58 138)", // bg-blue-900
    colorHit: "rgb(147 197 253)", // bg-blue-300
    emoji: "",
    fontSize: 48,
    width: 48,
    height: 48,
  },
};
const weaponGoblinBody: Weapon = {
  name: "skeleton-body",
  damage: 1,
  durationActive: { min: 0, max: 5000, current: 0 },
  durationCooldown: { min: 0, max: 1, current: 0 },
  level: 1,
  maxSpawns: 1,
  sprite: {
    name: "goblin-body",
    colorBg: "rgb(30 58 138)", // bg-blue-900
    colorHit: "rgb(147 197 253)", // bg-blue-300
    emoji: "",
    fontSize: 64,
    width: 64,
    height: 64,
  },
};

export const player: Alive = {
  name: "player",
  capacityAccessories: 6,
  capacityWeapons: 6,
  equippedAccessories: [],
  equippedWeapons: [...weaponsPlayerAll],
  activeWeapons: [],
  durationHitCooldown: { min: 0, max: 200, current: 0 },
  health: { min: 0, max: 100, current: 100 },
  speed: 0.5,
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
  capacityAccessories: 6,
  capacityWeapons: 6,
  equippedAccessories: [],
  equippedWeapons: [weaponSkeletonBody],
  activeWeapons: [],
  durationHitCooldown: { min: 0, max: 0, current: 0 },
  health: { min: 0, max: 1, current: 1 },
  speed: 0.1,
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
  capacityAccessories: 6,
  capacityWeapons: 6,
  equippedAccessories: [],
  equippedWeapons: [weaponZombieBody],
  activeWeapons: [],
  durationHitCooldown: { min: 0, max: 0, current: 0 },
  health: { min: 0, max: 1, current: 1 },
  speed: 0.1,
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
  capacityAccessories: 6,
  capacityWeapons: 6,
  equippedAccessories: [],
  equippedWeapons: [weaponGoblinBody],
  activeWeapons: [],
  durationHitCooldown: { min: 0, max: 0, current: 0 },
  health: { min: 0, max: 100, current: 100 },
  speed: 0.05,
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
const enemyWave: Alive[] = [
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

// game rounds
export const gameRound1: GameRound = {
  enemyWaves: [enemyWave],
  durationTimer: {
    min: 0,
    max: 30 * 60 * 1000, // minutes * seconds * milliseconds
    current: 0,
  },
  map: mapForest,

  logs: { spawns: [], enemiesKilled: [] },
};

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
