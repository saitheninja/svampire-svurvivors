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

// sprites

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

export interface Alive extends GameObject {
  healthCurrent: number;
  healthMax: number;
  speed: number;
  weapons: Weapon[];
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

      activePlayer.healthCurrent = activePlayer.healthCurrent - weapon.damage;
      activePlayer.el.style.backgroundColor = activePlayer.sprite.colorHit.replace(")", " / 0.5)");
    });

    // if player not hit by enemy sprite
    if (!isColliding(enemy.el, activePlayer.el)) return;

    activePlayer.healthCurrent = activePlayer.healthCurrent - 1;
    activePlayer.el.style.backgroundColor = activePlayer.sprite.colorHit.replace(")", " / 0.5)");
  });

  return activePlayer;
}

/*
 * Generate div for given sprite.
 */
export function generateDiv(sprite: Sprite, spawnId: number): HTMLDivElement {
  const elEmoji = document.createElement("span");
  elEmoji.id = `emoji-${spawnId}`;

  elEmoji.textContent = sprite.emoji;
  elEmoji.style.fontSize = `${sprite.fontSize}px`;

  const elName = document.createElement("span");
  elName.id = `name-${spawnId}`;

  elName.textContent = sprite.name;
  elName.classList.add("sr-only");

  const elDiv = document.createElement("div");
  elDiv.id = `sprite-${spawnId}`;

  elDiv.appendChild(elEmoji);
  elDiv.appendChild(elName);

  elDiv.style.position = "absolute";
  elDiv.style.width = `${sprite.width}px`;
  elDiv.style.height = `${sprite.height}px`;

  elDiv.style.overflow = "clip";

  // set bg color alpha to 50%
  elDiv.style.backgroundColor = sprite.colorBg.replace(")", " / 0.5)");

  //  center emoji in div
  elEmoji.style.marginLeft = `${-sprite.fontSize / 10}px`;
  elEmoji.style.marginTop = `${-sprite.fontSize / 4}px`;
  elDiv.style.display = "flex";
  elDiv.style.flexDirection = "row";

  // track no. of spawns
  spawnId += 1;

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
 * Attach `terrain` as backgroundImage for `el`.
 */
export function setMap(
  elGameWindow: HTMLDivElement,
  elTerrain: HTMLDivElement,
  map: WorldMap,
): void {
  // set background tile
  elGameWindow.style.backgroundImage = `url(${map.background.path})`;
  elGameWindow.style.backgroundSize = `${map.background.width}px ${map.background.height}px`;
  elGameWindow.style.backgroundRepeat = "repeat";

  // set terrain dimensions
  elTerrain.style.width = `${map.terrain.width + elGameWindow.clientWidth}px`;
  elTerrain.style.height = `${map.terrain.height + elGameWindow.clientHeight}px`;

  // set terrain background
  elTerrain.style.backgroundImage = `url(${map.terrain.path})`;
  elTerrain.style.backgroundSize = `${map.terrain.width}px ${map.terrain.height}px`;
  elTerrain.style.backgroundRepeat = "no-repeat";
  elTerrain.style.backgroundPosition = "center";
}
