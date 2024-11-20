export interface Terrain {
  name: string;
  imagePath: string;
  height: number;
  width: number;
}

export const terrainForest: Terrain = {
  name: "forest",
  imagePath: "./terrain-forest.svg",
  height: 4000,
  width: 4000,
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
  speed: 1,
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
  speed: 2,
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
  speed: 0.5,
  weapons: [],
  sprite: {
    name: "goblin",
    colorBg: "rgb(239 68 68)", // bg-red-500
    colorHit: "rgb(252 165 165)", // big-red-300
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
