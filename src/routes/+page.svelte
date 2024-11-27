<script lang="ts">
  import ControlsKeys from "./ControlsKeys.svelte";
  import ControlsJoystick from "./ControlsJoystick.svelte";

  import { enemyWave, player, terrainForest } from "$lib/definitions";

  import type { Alive, Sprite, Terrain, Weapon } from "$lib/definitions";

  const durationGameEnd = 30 * 60 * 1000; // minute * seconds * milliseconds
  // when filled, treasure chests won't offer that type
  const slotsWeapons = 6;
  const slotsAccessories = 6;

  // current game state
  let elGameWindow: HTMLDivElement | undefined = $state();
  let elWorld: HTMLDivElement | undefined = $state();
  let elTerrain: HTMLDivElement | undefined = $state();
  let elPlayer: HTMLDivElement | undefined = $state();

  let isStarted = $state(false);
  let isFinished = $state(false);
  let spawnId = 0;
  let enemiesKilled = $state(0);

  let activeEnemies: Alive[] = $state([]);
  let activePlayer: Alive = $state(structuredClone(player));
  let activeWeapons: Weapon[] = $state([]);
  let healthPercent = $state(100);
  $effect(() => {
    if (!activePlayer) return;
    healthPercent = Math.round((activePlayer.healthCurrent / activePlayer.healthMax) * 100);
  });

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

  /*
    Custom rounding.
  */
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
  }

  /*
    Check enemies overlap with player weapons.
  */
  function checkEnemiesHit(): void {
    // check if enemy hit by player weapons
    activeEnemies.forEach((enemy) => {
      if (!enemy.el) return;

      let isEnemyHit = false;

      activeWeapons.forEach((weapon) => {
        if (!weapon.el) return;
        if (!enemy.el) return;

        // check collision
        const isCollidingWeapon = isCollidingCheck(weapon.el, enemy.el);

        // if no weapons hit
        if (!isCollidingWeapon) return;

        // change background
        isEnemyHit = true;

        // take damage
        enemy.healthCurrent = enemy.healthCurrent - weapon.damage;
      });

      // change enemy bg
      if (!isEnemyHit) {
        enemy.el.style.backgroundColor = enemy.sprite.colorBg.replace(")", " / 0.5)");
      } else {
        enemy.el.style.backgroundColor = enemy.sprite.colorHit.replace(")", " / 0.5)");
      }
    });

    // check enemy health, remove el if dead
    activeEnemies.forEach((enemy) => {
      if (enemy.healthCurrent > 0) return;
      enemy.el?.remove();
      enemiesKilled += 1;
    });

    // remove from `enemiesActive` if health 0 or below
    activeEnemies = activeEnemies.filter((enemy) => enemy.healthCurrent > 0);
  }

  /*
    Check player overlaps with enemies.
  */
  function checkPlayerHit(): void {
    let isPlayerHit = false;

    activeEnemies.forEach((enemy) => {
      if (!enemy.el) {
        console.error("No enemy el.");
        return;
      }
      if (!activePlayer.el) {
        console.error("No activePlayer el.");
        return;
      }

      // check if player hit by enemy
      const isCollidingPlayer = isCollidingCheck(enemy.el, activePlayer.el);

      // if no enemies hit player
      if (!isCollidingPlayer) return;

      // if hit, change background
      isPlayerHit = true;

      // take damage
      activePlayer.healthCurrent = activePlayer.healthCurrent - 1;
    });

    // change player bg
    if (!activePlayer.el) {
      console.error("No activePlayer el.");
      return;
    }
    if (!isPlayerHit) {
      activePlayer.el.style.backgroundColor = player.sprite.colorBg.replace(")", " / 0.5)");
    } else {
      activePlayer.el.style.backgroundColor = player.sprite.colorHit.replace(")", " / 0.5)");
    }
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
    Check timer, player health.
  */
  function checkGameOver(): boolean {
    if (timeElapsed > durationGameEnd) return true;
    if (activePlayer && activePlayer.healthCurrent <= 0) return true;

    return false;
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

    // game over
    isFinished = checkGameOver();
    if (isFinished) return;

    if (!isPaused) {
      timeElapsed += timeSincePrevFrame;
      movePlayer();
      checkPlayerWeapons();
      moveEnemies();
      checkEnemiesHit();
      checkPlayerHit();
    }

    // new frame
    window.requestAnimationFrame(gameLoop);
  }

  /*
    Make new player object & sprite el on start.
  */
  function spawnPlayer(): void {
    // make fresh copy of player data, and transfer elPlayer
    activePlayer = structuredClone(player);

    // make player sprite
    const elSprite = generateDiv(activePlayer.sprite);
    activePlayer.el = elSprite;

    // position sprite
    if (!elGameWindow) {
      console.error(`No element with id "game-window".`);
      return;
    }
    activePlayer.el.style.left = `${(elGameWindow.clientWidth - activePlayer.sprite.width) / 2}px`;
    activePlayer.el.style.top = `${(elGameWindow.clientHeight - activePlayer.sprite.height) / 2}px`;

    // add to game
    if (!elPlayer) {
      console.error(`No element with id "player".`);
      return;
    }
    elPlayer.insertBefore(elSprite, elPlayer.firstElementChild);
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
    isFinished = false;
    isStarted = true; // hide info el, use joystick
    isPaused = false;
    timeElapsed = 0; // reset timer// reset timer
    enemiesKilled = 0;
    spawnId = 0;

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
  <div id="top-ui" class="absolute left-0 top-0 z-50 w-full p-1">
    <div id="experience-bar" class="mb-2 rounded-lg border-2 border-blue-100 bg-gray-900 px-2 py-1">
      <h1 class="text-xl font-extrabold">Svampire Svurvivors</h1>

      <!-- {#if activePlayer} -->
      <!--   {@const experiencePercent = -->
      <!--     (activePlayer.experienceCurrent / activePlayer.experienceNextLevel) * 100} -->
      <!---->
      <!--   <div class="sr-only flex flex-row gap-2"> -->
      <!--     <span>experience:</span> -->
      <!--     <span>{Math.round(experiencePercent)}%</span> -->
      <!--     <span>{activePlayer.healthCurrent} / {activePlayer.healthMax}</span> -->
      <!--   </div> -->
      <!---->
      <!--   <div class="flex h-4 flex-row bg-gray-600"> -->
      <!--     <div class="bg-blue-500" style="width: {experiencePercent}%"></div> -->
      <!---->
      <!--     <span class="ml-auto max-w-max">{activePlayer.level}</span> -->
      <!--   </div> -->
      <!-- {/if} -->
    </div>

    <div class="grid grid-cols-3 grid-rows-1">
      <div class="flex flex-col gap-1 justify-self-start text-center">
        <div class="flex flex-row gap-1">
          {#each player.weapons as { sprite }}
            <span class="w-6 overflow-clip border-2 border-white/30">{sprite.emoji}</span>
          {/each}
        </div>

        <div class="flex flex-row gap-1">
          {#each Array(slotsWeapons) as slot, i}
            <span class="w-6 border-2 border-white/30">{slot}{i}</span>
          {/each}
        </div>

        <div class="flex flex-row gap-1">
          {#each Array(slotsAccessories) as slot, i}
            <span class="w-6 border-2 border-dotted border-white/30">{slot}{i}</span>
          {/each}
        </div>
      </div>

      <time
        id="timer"
        datetime="PT{timerMinutes}M{timerSeconds}S"
        class="flex flex-row gap-0 justify-self-center text-lg font-extrabold text-white"
      >
        <span>{timerMinutes.toString().length === 1 ? "0" : ""}{timerMinutes}</span>
        <span>:</span>
        <span>{timerSeconds.toString().length === 1 ? "0" : ""}{timerSeconds}</span>
      </time>

      <div class="flex flex-col gap-1 justify-self-end text-end">
        <span>{0} 🪙</span>
        <span>{enemiesKilled} 💀</span>
        <span class="text-blue-700">{fps} fps</span>

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

        <!-- <span class="text-cyan-500">scrollLeft: {elWorld?.scrollLeft}</span> -->
        <!-- <span class="text-cyan-500">scrollWidth: {elWorld?.scrollWidth}</span> -->
        <!-- <span class="text-cyan-500">clientWidth: {elWorld?.clientWidth}</span> -->
        <!-- <span class="text-cyan-500">{elWorld ? elWorld.scrollWidth - elWorld.clientWidth : 0}</span> -->

        <!-- <span class="text-cyan-500">scrollTop: {elWorld?.scrollTop}</span> -->
        <!-- <span class="text-cyan-500">scrollHeight: {elWorld?.scrollHeight}</span> -->
        <!-- <span class="text-cyan-500">clientHeight: {elWorld?.clientHeight}</span> -->
        <!-- <span class="text-cyan-500">{elWorld ? elWorld.scrollHeight - elWorld.clientHeight : 0}</span> -->

        <!-- <span class="text-cyan-500">actions: {actionsActive}</span> -->

        <!-- <span class="text-blue-500" -->
        <!--   >weapons: {activeWeapons.length} -->
        <!--   {#each activeWeapons as { sprite }} -->
        <!--     <span>{sprite.emoji}</span> -->
        <!--   {/each} -->
        <!-- </span> -->

        <!-- <span class="text-lime-500" -->
        <!--   >enemies: {activeEnemies.length} -->
        <!--   {#each activeEnemies as { sprite }} -->
        <!--     <span>{sprite.emoji}</span> -->
        <!--   {/each} -->
        <!-- </span> -->
      </div>
    </div>

    {#if isPaused}
      <div id="menu" class="mx-auto max-w-max bg-gray-900/70 p-2">
        <h2 class="mb-2 text-lg font-bold">Map</h2>

        <img
          src={terrainForest.imagePath}
          alt="Minimap of {terrainForest.name} area."
          class="w-full"
        />
      </div>
    {/if}
  </div>

  <div bind:this={elWorld} id="world" class="flex-grow overflow-auto bg-purple-900">
    {#if !isStarted || isFinished}
      <div id="info" class="mx-auto mt-80 max-w-max">
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

    <div bind:this={elPlayer} id="player">
      <div
        id="health-bar"
        class="absolute mt-2"
        style:left="{(elGameWindow?.clientWidth ?? 1000) / 2 - activePlayer.sprite.width / 2}px"
        style:top="{(elGameWindow?.clientHeight ?? 1000) / 2 + activePlayer.sprite.height / 2}px"
        style:width="{activePlayer.sprite.width}px"
      >
        <div class="sr-only flex flex-row gap-2">
          <span>health:</span>
          <span>{healthPercent}%</span>
          <span>{activePlayer.healthCurrent} / {activePlayer.healthMax}</span>
        </div>

        <div class="flex h-2 flex-row bg-gray-900">
          <div class="bg-rose-500" style="width: {healthPercent}%"></div>
        </div>
      </div>
    </div>

    <div id="weapons"></div>

    <div
      id="center-world"
      class="absolute h-4 w-4 bg-red-400"
      style:left="{(elWorld?.clientWidth ?? 1000) / 2}px"
      style:top="{(elWorld?.clientHeight ?? 1000) / 2}px"
    ></div>
  </div>

  <div
    id="center-window"
    class="absolute h-4 w-4 bg-lime-400"
    style:left="{(elGameWindow?.clientWidth ?? 1000) / 2}px"
    style:top="{(elGameWindow?.clientHeight ?? 1000) / 2}px"
  ></div>
</div>
