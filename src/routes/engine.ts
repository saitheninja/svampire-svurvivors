// map
interface ImageSvg {
  path: string;
  height: number;
  width: number;
}
export interface WorldMap {
  name: string;
  terrain: ImageSvg;
  background: ImageSvg; // tiling sprite
}

export interface Sprite {
  name: string;
  colorBg: string;
  colorHit: string;
  emoji: string;
  fontSize: number; // px
  height: number; // px
  width: number; // px
}

export interface NumberRange {
  min: number;
  max: number;
  current: number;
}

interface LogEvent {
  durationTimer: NumberRange;
  message: string;
  timestamp: Date;
  type: "Spawn" | "Kill" | "Pickup" | "LevelUp";
}
export interface LogEventKill extends LogEvent {
  type: "Kill";
  enemy: Alive;
  weapon: Weapon;
}
interface LogEventSpawn extends LogEvent {
  type: "Spawn";
  sprite: Sprite;
  uuid: string;
}

export interface GameRound {
  durationTimer: NumberRange; // milliseconds
  enemyWaves: Alive[][];
  map: WorldMap;

  logs: {
    spawns: LogEventSpawn[];
    enemiesKilled: LogEventKill[];
  };
}

export interface GameObject {
  name: string;
  sprite: Sprite;
  el?: HTMLDivElement;
}

export interface Weapon extends GameObject {
  damage: number;
  durationActive: NumberRange; // milliseconds
  durationCooldown: NumberRange; // milliseconds
  // levelCurrent: number;
  // levelMax: number;
}

export interface Alive extends GameObject {
  capacityAccessories: number; // default 6
  capacityWeapons: number; // default 6
  health: NumberRange; // need max for level up, accesory effects, etc.
  speed: number;
  weapons: Weapon[];
  activeWeapons: Weapon[];
}

/*
 * Check if el1, el2 bounding boxes overlap.
 */
export function isColliding(el1: HTMLElement, el2: HTMLElement): boolean {
  const rect1 = el1.getBoundingClientRect();
  const rect2 = el2.getBoundingClientRect();

  const isNotCollidingBottom = rect1.bottom < rect2.top; // bottom1 higher than top2  1--' ,--2
  const isNotCollidingTop = rect2.bottom < rect1.top; // bottom2 higher than top1     2--' ,--1
  const isNotCollidingRight = rect1.right < rect2.left; // 1__| |__2
  const isNotCollidingLeft = rect2.right < rect1.left; //  2__| |__1

  const notColliding =
    isNotCollidingBottom || isNotCollidingTop || isNotCollidingRight || isNotCollidingLeft;

  return !notColliding;
}

/*
 * If player sprite overlaps with enemy sprite or enemy weapon sprite:
 * - take damage,
 * - change sprite background-color.
 */
export function checkCollisionsOnPlayer(activePlayer: Alive, activeEnemies: Alive[]): Alive {
  if (!activePlayer.el) {
    console.error("No activePlayer el.");
    return activePlayer;
  }

  // if hit by any enemy, change background-color
  activePlayer.el.style.backgroundColor = activePlayer.sprite.colorBg.replace(")", " / 0.5)");

  activeEnemies.forEach((enemy) => {
    if (!enemy.el) return;
    if (!activePlayer.el) return;

    enemy.weapons.forEach((weapon) => {
      if (!weapon.el) return;
      if (!activePlayer.el) return;

      // if player not hit by weapon
      if (!isColliding(weapon.el, activePlayer.el)) return;

      activePlayer.health.current = activePlayer.health.current - weapon.damage;
      activePlayer.el.style.backgroundColor = activePlayer.sprite.colorHit.replace(")", " / 0.5)");
    });

    // if player not hit by enemy sprite
    if (!isColliding(enemy.el, activePlayer.el)) return;

/*
 * Add new weapons. Remove expired weapons.
 */
export function checkWeapons(alive: Alive, round: GameRound, timeSincePrevFrame: number): Alive {
  console.log(alive);
  // remove elements of expired weapons
  alive.activeWeapons.forEach((weapon) => {
    weapon.durationActive.current += timeSincePrevFrame;

    if (weapon.durationActive.current < weapon.durationActive.max) return;
    weapon.el?.remove();
  });

    activePlayer.health.current = activePlayer.health.current - 1;
    activePlayer.el.style.backgroundColor = activePlayer.sprite.colorHit.replace(")", " / 0.5)");
  // remove expired weapons from tracking list
  alive.activeWeapons = alive.activeWeapons.filter(
    (weapon) => weapon.durationActive.current < weapon.durationActive.max,
  );

  // add new weapons
  alive.weapons.forEach((weapon) => {
    weapon.durationCooldown.current += timeSincePrevFrame;

    // if still on cooldown
    if (weapon.durationCooldown.current < weapon.durationCooldown.max) return;

    // reset cooldown
    weapon.durationCooldown.current = 0;

    // make new weapon object
    // structuredClone(weapon) causes error here
    const newWeapon = JSON.parse(JSON.stringify(weapon));
    newWeapon.el = generateDivEl(weapon.sprite, round);

    // add to active weapons
    alive.activeWeapons.push(newWeapon);

    // set el location
    if (!alive?.el) return;
    const left = parseFloat(alive.el.style.left);
    const width = parseFloat(alive.el.style.width);
    const top = parseFloat(alive.el.style.top);
    const height = parseFloat(alive.el.style.height);

    newWeapon.el.style.left = `${left + width}px`;
    newWeapon.el.style.top = `${top + height}px`;

    // add el to world
    const elWeapons = document.getElementById("weapons");
    if (!elWeapons) {
      console.error(`No div with id "weapons".`);
      return;
    }
    elWeapons.appendChild(newWeapon.el);
  });

  return activePlayer;
  return alive;
}

/*
 * Check timer, player health.
 */
export function isGameOver(activeRound: GameRound, activePlayer: Alive): boolean {
  // time up
  if (activeRound.durationTimer.current > activeRound.durationTimer.max) return true;

  // out of health
  if (activePlayer.health.current <= activePlayer.health.min) return true;

  return false;
}

/*
 * Generate div for given sprite.
 */
export function generateDivEl(sprite: Sprite, round: GameRound): HTMLDivElement {
  const uuid = crypto.randomUUID();

  const elEmoji = document.createElement("span");
  elEmoji.id = `emoji-${uuid}`;
  elEmoji.textContent = sprite.emoji;
  elEmoji.style.fontSize = `${sprite.fontSize}px`;

  const elName = document.createElement("span");
  elName.id = `name-${uuid}`;
  elName.textContent = sprite.name;
  elName.classList.add("sr-only");

  const elDiv = document.createElement("div");
  elDiv.id = `sprite-${sprite.name}-${uuid}`;

  // add children
  elDiv.appendChild(elEmoji);
  elDiv.appendChild(elName);

  // set position
  elDiv.style.position = "absolute";
  elDiv.style.width = `${sprite.width}px`;
  elDiv.style.height = `${sprite.height}px`;

  // clip emoji overflow
  elDiv.style.overflow = "clip";

  // set bg color alpha to 50%
  elDiv.style.backgroundColor = sprite.colorBg.replace(")", " / 0.5)");

  //  center emoji in div
  elEmoji.style.marginLeft = `${-sprite.fontSize / 10}px`;
  elEmoji.style.marginTop = `${-sprite.fontSize / 4}px`;
  elDiv.style.display = "flex";
  elDiv.style.flexDirection = "row";

  // track spawns
  const newLog: LogEventSpawn = {
    message: `Spawned new ${sprite.name}.`,
    durationTimer: round.durationTimer,
    timestamp: new Date(),
    type: "Spawn",
    sprite: sprite,
    uuid: uuid,
  };
  round.logs.spawns.push(newLog);

  return elDiv;
}

/*
 * Custom rounding.
 */
export function roundTo3Places(n: number): number {
  const n3 = n * 1_000;
  const rounded = Math.round(n3);
  const divided = rounded / 1_000;

  return divided;
}

/*
 * Set `map` as backgroundImage for `elTerrain`.
 * Set tiling image as backgroundImage for `elGameWindow`.
 */
export function setMap(elGameWindow: HTMLElement, elTerrain: HTMLElement, map: WorldMap): void {
  // set dimensions
  elTerrain.style.width = `${map.terrain.width + elGameWindow.clientWidth}px`;
  elTerrain.style.height = `${map.terrain.height + elGameWindow.clientHeight}px`;

  // set elTerrain backgroundImage
  elTerrain.style.backgroundImage = `url(${map.terrain.path})`;
  elTerrain.style.backgroundSize = `${map.terrain.width}px ${map.terrain.height}px`;
  elTerrain.style.backgroundRepeat = "no-repeat";
  elTerrain.style.backgroundPosition = "center";

  // set elGameWindow backgroundImage tile
  elGameWindow.style.backgroundImage = `url(${map.background.path})`;
  elGameWindow.style.backgroundSize = `${map.background.width}px ${map.background.height}px`;
  elGameWindow.style.backgroundRepeat = "repeat";

  // scroll to center
  elGameWindow.scrollTo({
    top: (elGameWindow.scrollHeight - elGameWindow.clientHeight) / 2,
    left: (elGameWindow.scrollWidth - elGameWindow.clientWidth) / 2,
  });
}