<script lang="ts">
  import ControlsKeys from "./ControlsKeys.svelte";
  import ControlsJoystick from "./ControlsJoystick.svelte";

  import { enemyWave, player, terrainForest } from "$lib/definitions";

  import type { Alive, Sprite, Terrain, Weapon } from "$lib/definitions";

  // current game state
  let elGameWindow: HTMLDivElement | undefined = $state();
  let elWorld: HTMLDivElement | undefined = $state();
  let elTerrain: HTMLDivElement | undefined = $state();

  let isStarted = $state(false);
  let spawnId = 0;

  let activeEnemies: Alive[] = $state([]);
  let activePlayer: Alive | undefined = $state();
  let activeWeapons: Weapon[] = $state([]);

  // fps
  let timestampPrev = $state(0);
  let timeSincePrevFrame = $state(0);
  let fps = $derived(Math.round(1000 / timeSincePrevFrame));

  // timer
  let timeElapsed = $state(0);
  let timerMinutes = $derived(Math.floor(timeElapsed / 1000 / 60));
  let timerSeconds = $derived(Math.floor((timeElapsed / 1000) % 60));

  // controls
  let actionsActive: string[] = $state([]);
  let isPaused = $state(false);
  let dirX = $state(0);
  let dirY = $state(0);
  let joystickAngle = $state(0); // rads
  let joystickTiltRatio = $state(0); // 0 to 1

  /*
    Attach `terrain` as backgroundImage for `el`.
  */
  function setTerrain(el: HTMLDivElement, terrain: Terrain): void {
    // set dimensions
    el.style.width = `${terrain.width}px`;
    el.style.height = `${terrain.height}px`;

    // set background
    el.style.backgroundImage = `url(${terrain.imagePath})`;
    el.style.backgroundSize = `${terrain.width}px ${terrain.height}px`;
    el.style.backgroundRepeat = "no-repeat";
  }

  /*
    Generate div for given sprite.
  */
  function generateDiv(sprite: Sprite): HTMLDivElement {
    const elEmoji = document.createElement("span");
    elEmoji.textContent = sprite.emoji;
    elEmoji.style.fontSize = `${sprite.fontSize}px`;

    const elName = document.createElement("span");
    elName.textContent = sprite.name;
    elName.classList.add("sr-only");

    const elDiv = document.createElement("div");
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
    elDiv.id = `${spawnId}`;

    return elDiv;
  }

  /*
    Spawn each enemy in `wave`, and attach it to `el`.
    Uses element with id `enemies`.
  */
  function spawnEnemyWaveCircle(wave: Alive[], list: Alive[]): void {
    // Roll for upgraded monster that drops treasure chest on defeat

    const elEnemies = document.getElementById("enemies");
    if (!elEnemies) {
      console.error(`No div with id "enemies".`);
      return;
    }

    const distance = 300;
    const spread = 360 / wave.length;

    wave.forEach((enemy, i) => {
      // make new enemy
      let newEnemy = structuredClone(enemy);
      newEnemy.el = generateDiv(newEnemy.sprite);

      // calc x, y from angle in circle
      const angle = spread * i;
      const rads = angle * (Math.PI / 180);
      const x = Math.round(Math.cos(rads) * distance);
      const y = Math.round(Math.sin(rads) * distance);

      // set x, y
      newEnemy.el.style.left = `${elEnemies.scrollLeft + elEnemies.clientWidth / 2 + x}px`;
      newEnemy.el.style.top = `${elEnemies.scrollTop + elEnemies.clientHeight / 2 + y}px`;

      // add to world
      elEnemies.appendChild(newEnemy.el);

      // add to list of active enemies
      list.push(newEnemy);
    });
  }

  /*
    Check if div bounding boxes overlap.
  */
  function isCollidingCheck(div1: Element, div2: Element): boolean {
    let d1Rect = div1.getBoundingClientRect();
    let d2Rect = div2.getBoundingClientRect();

    const isNotCollidingBottom = d1Rect.bottom < d2Rect.top; // bottom1 higher than top2  1--' ,--2
    const isNotCollidingTop = d2Rect.bottom < d1Rect.top; // bottom2 higher than top1     2--' ,--1
    const isNotCollidingRight = d1Rect.right < d2Rect.left; // 1__| |__2
    const isNotCollidingLeft = d2Rect.right < d1Rect.left; //  2__| |__1

    const notColliding =
      isNotCollidingBottom || isNotCollidingTop || isNotCollidingRight || isNotCollidingLeft;

    return !notColliding;
  }

  function roundTo3Places(n: number): number {
    const n3 = n * 1_000;
    const rounded = Math.round(n3);
    const divided = rounded / 1_000;

    return divided;
  }

  /*
    Calc player movement and scroll world.
  */
  function movePlayer(): void {
    if (!elWorld) return;
    if (!activePlayer) return;
    if (!dirX && !dirY && !joystickTiltRatio) return;

    const distanceMax = (activePlayer.speed / 2) * timeSincePrevFrame;

    let distance = 0;
    let angle = 0;

    // keys
    if (dirX || dirY) {
      distance = distanceMax;
      angle = Math.atan2(dirY, dirX);
    }

    // joystick overrides keys
    if (joystickTiltRatio) {
      distance = distanceMax * joystickTiltRatio;
      angle = (joystickAngle * Math.PI) / 180;
    }

    const left = distance * Math.cos(angle);
    const top = distance * Math.sin(angle);

    const roundedLeft = roundTo3Places(left);
    const roundedTop = roundTo3Places(top);

    // scroll world
    elWorld.scrollBy({
      left: roundedLeft,
      top: roundedTop,
    });
  }

  /*
    Enemies move towards player.
  */
  function moveEnemies(): void {
    if (!elWorld) return;

    const playerX = elWorld.scrollLeft + elWorld.clientWidth / 2;
    const playerY = elWorld.scrollTop + elWorld.clientHeight / 2;

    activeEnemies.forEach(({ el, speed }) => {
      if (!el) return;
      let left = parseFloat(el.style.left);
      let top = parseFloat(el.style.top);

      const distance = (speed / 20) * timeSincePrevFrame;

      const difX = left - playerX;
      const difY = top - playerY;

      if (Math.abs(difX) > distance) {
        if (difX > 0) {
          left = left - distance;
        } else {
          left = left + distance;
        }
      } else {
        left = playerX;
      }
      if (Math.abs(difY) > distance) {
        if (difY > 0) {
          top = top - distance;
        } else {
          top = top + distance;
        }
      } else {
        top = playerY;
      }

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    });

    // check collisions with player
    activeEnemies.forEach((enemy) => {
      if (!enemy.el) return;

      let isColliding = false;

      activeWeapons.forEach((weapon) => {
        if (!weapon.el) return;
        if (!enemy.el) return;

        // check collision
        const isCollidingWeapon = isCollidingCheck(weapon.el, enemy.el);

        // if anything collides
        if (!isCollidingWeapon) return;

        // change background
        isColliding = true;

        // take damage
        enemy.healthCurrent = enemy.healthCurrent - weapon.damage;
      });

      if (!isColliding) {
        enemy.el.style.backgroundColor = enemy.sprite.colorBg.replace(")", " / 0.5)");
      } else {
        enemy.el.style.backgroundColor = enemy.sprite.colorHit.replace(")", " / 0.5)");
      }
    });

    // check enemy health, remove el if dead
    activeEnemies.forEach((enemy) => {
      if (enemy.healthCurrent > 0) return;
      enemy.el?.remove();
    });

    // remove from `enemiesActive` if health 0 or below
    activeEnemies = activeEnemies.filter((enemy) => enemy.healthCurrent > 0);
  }

  /*
    Add new weapons. Remove expired weapons.
  */
  function checkPlayerWeapons(): void {
    if (!activePlayer) return;

    // remove elements of expired weapons
    activeWeapons.forEach((weapon) => {
      weapon.durationActiveElapsed += timeSincePrevFrame;

      if (weapon.durationActiveElapsed < weapon.durationActive) return;
      weapon.el?.remove();
    });

    // remove expired weapons from tracking list
    activeWeapons = activeWeapons.filter(
      (weapon) => weapon.durationActiveElapsed < weapon.durationActive,
    );

    // add new weapons
    activePlayer.weapons.forEach((weapon) => {
      weapon.durationCooldownElapsed += timeSincePrevFrame;

      // if still on cooldown
      if (weapon.durationCooldownElapsed < weapon.durationCooldown) return;

      // reset cooldown
      weapon.durationCooldownElapsed = 0;

      // make new weapon object
      // structuredClone(weapon) causes error here
      const newWeapon = JSON.parse(JSON.stringify(weapon));
      newWeapon.el = generateDiv(weapon.sprite);

      // add to active weapons
      activeWeapons.push(newWeapon);

      // set el location
      if (!activePlayer?.el) return;
      const left = parseFloat(activePlayer.el.style.left);
      const width = parseFloat(activePlayer.el.style.width);
      const top = parseFloat(activePlayer.el.style.top);
      const height = parseFloat(activePlayer.el.style.height);

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
  }

  /*
    Trigger game logic.
  */
  function gameLoop(timestamp: number) {
    // timestamp: DOMHighResTimeStamp
    // The DOMHighResTimeStamp type is a double and is used to store a time value in milliseconds.

    // fps
    timeSincePrevFrame = timestamp - timestampPrev;
    timestampPrev = timestamp;

    if (!isPaused) {
      timeElapsed += timeSincePrevFrame;
      movePlayer();
      checkPlayerWeapons();
      moveEnemies();
      // if (!activePlayer) return;
      // if (activePlayer?.healthCurrent <= 0) return;
      // activePlayer.healthCurrent = activePlayer.healthCurrent - 1;
    }

    // new frame
    window.requestAnimationFrame(gameLoop);
  }

  /*
    Make new player object & el on start.
  */
  function spawnPlayer() {
    if (!elWorld) return;

    // make new copy of player
    activePlayer = structuredClone(player);

    // make player el
    activePlayer.el = generateDiv(activePlayer.sprite);
    activePlayer.el.id = "player";

    // set el position
    activePlayer.el.style.left = `${elWorld.clientWidth / 2 - activePlayer.sprite.width / 2}px`;
    activePlayer.el.style.top = `${elWorld.clientHeight / 2 - activePlayer.sprite.height / 2}px`;

    // add to game
    elWorld.appendChild(activePlayer.el);
  }

  /*
    Generate game state.
    Attached to UI button.
  */
  function startGame(): void {
    // div doesn't exist yet
    if (!elGameWindow) {
      console.error(`No element with id "game-window".`);
      return;
    }
    if (!elWorld) {
      console.error(`No element with id "world".`);
      return;
    }
    if (!elTerrain) {
      console.error(`No element with id "terrain".`);
      return;
    }

    // reset game state
    activeEnemies = [];
    activeWeapons = [];
    isStarted = true; // hide info el, use joystick
    isPaused = false;
    timeElapsed = 0; // reset timer// reset timer

    // fullscreen
    elGameWindow.requestFullscreen();

    // load map
    setTerrain(elTerrain, terrainForest);

    const top = (elWorld.scrollHeight - elWorld.clientHeight) / 2;
    const left = (elWorld.scrollWidth - elWorld.clientWidth) / 2;
    // console.log(top, left);

    // scroll to center
    elWorld.scrollTo({
      top: top,
      left: left,
    });

    // fresh player object after terrain load because of height, width
    spawnPlayer();

    // spawn enemies
    spawnEnemyWaveCircle(enemyWave, activeEnemies);

    // start game loop
    window.requestAnimationFrame(gameLoop);
  }
</script>

<ControlsKeys bind:actionsActive bind:isPaused bind:dirX bind:dirY />

<div id="game-window" bind:this={elGameWindow} class="flex h-screen flex-col bg-gray-900">
  <div id="top-ui" class="z-50 flex flex-shrink gap-2 bg-rose-950 py-1">
    <h1 class="text-center text-xl font-extrabold">Svampire Svurvivors</h1>

    <img src={terrainForest.imagePath} alt="Minimap of {terrainForest.name} area." class="size-8" />

    <form
      onsubmit={(event) => {
        event.preventDefault();
        isPaused = !isPaused;
      }}
    >
      <button class="bg-rose-900 px-4 py-1 font-extrabold">
        {#if !isPaused}
          pause
        {:else}
          unpause
        {/if}
      </button>
    </form>

    <form
      onsubmit={(event) => {
        event.preventDefault();
        spawnEnemyWaveCircle(enemyWave, activeEnemies);
      }}
    >
      <button class="bg-rose-900 px-4 py-1 font-extrabold">spawn enemies</button>
    </form>

    <time
      id="timer"
      datetime="PT{timerMinutes}M{timerSeconds}S"
      class="flex flex-row gap-0 text-blue-500"
    >
      <span>{timerMinutes.toString().length === 1 ? "0" : ""}{timerMinutes}</span>
      <span>:</span>
      <span>{timerSeconds.toString().length === 1 ? "0" : ""}{timerSeconds}</span>
    </time>

    <span class="text-blue-700">{fps} fps</span>

    <!-- <span class="text-cyan-500">scrollLeft: {elWorld?.scrollLeft}</span> -->
    <!-- <span class="text-cyan-500">scrollWidth: {elWorld?.scrollWidth}</span> -->
    <!-- <span class="text-cyan-500">clientWidth: {elWorld?.clientWidth}</span> -->
    <!-- <span class="text-cyan-500">{elWorld ? elWorld.scrollWidth - elWorld.clientWidth : 0}</span> -->

    <!-- <span class="text-cyan-500">scrollTop: {elWorld?.scrollTop}</span> -->
    <!-- <span class="text-cyan-500">scrollHeight: {elWorld?.scrollHeight}</span> -->
    <!-- <span class="text-cyan-500">clientHeight: {elWorld?.clientHeight}</span> -->
    <!-- <span class="text-cyan-500">{elWorld ? elWorld.scrollHeight - elWorld.clientHeight : 0}</span> -->

    <!-- <span class="text-cyan-500">actions: {actionsActive}</span> -->

    <span class="text-blue-500"
      >weapons: {activeWeapons.length}
      {#each activeWeapons as { sprite }}
        <span>{sprite.emoji}</span>
      {/each}
    </span>

    <span class="text-lime-500"
      >enemies: {activeEnemies.length}
      {#each activeEnemies as { sprite }}
        <span>{sprite.emoji}</span>
      {/each}
    </span>

    <div id="health-bar" class="max-w-max">
      {#if activePlayer}
        {@const healthPercent = (activePlayer.healthCurrent / activePlayer.healthMax) * 100}

        <div class="flex flex-row gap-2">
          <span>health:</span>
          <span>{Math.round(healthPercent)}%</span>
          <span>{activePlayer.healthCurrent} / {activePlayer.healthMax}</span>
        </div>

        <div class="flex h-4 flex-row bg-gray-600">
          <div class="bg-rose-500" style="width: {healthPercent}%"></div>
        </div>
      {/if}
    </div>
  </div>

  <div bind:this={elWorld} id="world" class="flex-grow overflow-auto bg-purple-900">
    {#if !isStarted}
      <div id="info" class="mx-auto max-w-max">
        <form
          id="form-start-game"
          onsubmit={(event) => {
            event.preventDefault();
            startGame();
          }}
          class="mx-auto mb-8 mt-12 max-w-max"
        >
          <button
            class="border-b-8 border-red-900 bg-rose-600 px-8 py-2 font-extrabold text-white shadow-md shadow-red-900"
            >start game</button
          >
        </form>

        <div>
          <p>TODO:</p>

          <ul class="list-disc">
            <li>globals: score, experience, gold</li>
            <li>map</li>
            <li>power ups</li>
            <li>arrows pointing to power ups</li>
          </ul>
        </div>
      </div>
    {:else if !isPaused}
      <ControlsJoystick bind:joystickAngle bind:joystickTiltRatio />
    {/if}

    <div bind:this={elTerrain} id="terrain" class="relative">
      <div id="enemies" class="absolute h-full w-full"></div>
    </div>

    <!-- player goes here -->
    <div id="weapons"></div>
  </div>
</div>
