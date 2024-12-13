<script lang="ts">
  import ControlsJoystick from "./ControlsJoystick.svelte";
  import ControlsKeys from "./ControlsKeys.svelte";

  import { gameRound1, player, playerLevels, pickupXp } from "./data";
  import {
    checkCollisionsOnEnemies,
    checkCollisionsOnPlayer,
    checkWeapons,
    isColliding,
    isGameOver,
    generateDivEl,
    roundTo3Places,
    setMap,
  } from "./engine";

  import type { GameRound, GameObject, Alive } from "./engine";

  // ControlsKeys bindings
  let actionsActive: string[] = $state([]);
  let dirX = $state(0);
  let dirY = $state(0);
  let isPaused = $state(false);
  // ControlsJoystick bindings
  let joystickAngle = $state(0); // rads
  let joystickTiltRatio = $state(0); // 0 to 1

  // game state
  let activeRound = $state(structuredClone(gameRound1));
  let activePlayer = $state(structuredClone(player));
  let activeEnemies: Alive[] = $state([]);
  let activePickupsItems: GameObject[] = $state([]);
  let activePickupsXp: GameObject[] = $state([]);

  let elGameWindow: HTMLDivElement | undefined = $state();
  let elTerrain: HTMLDivElement | undefined = $state();
  let elEnemies: HTMLDivElement | undefined = $state();
  let elPickupsItems: HTMLDivElement | undefined = $state();
  let elPickupsXp: HTMLDivElement | undefined = $state();
  let elPlayer: HTMLDivElement | undefined = $state();
  let elWeapons: HTMLDivElement | undefined = $state();

  let isStarted = $state(false);
  let isFinished = $state(false);

  let healthPercent = $derived(
    Math.round((activePlayer.health.current / activePlayer.health.max) * 100),
  );

  let playerLevel = $state(1);
  let playerLevelXp = $state(0);

  // fps
  let timestampPrev = 0;
  let timeSincePrevFrame = 0;
  let fps = $state(0);

  // timer
  let timerMinutes = $derived(Math.floor(activeRound.durationTimer.current / 1000 / 60));
  let timerSeconds = $derived(Math.floor((activeRound.durationTimer.current / 1000) % 60));

  /*
   * Spawn each enemy in `wave`, and attach it to `elEnemies`.
   * Uses element with id `enemies`.
   */
  function spawnEnemyWaveCircle(
    enemies: Alive[],
    elEnemies: HTMLDivElement,
    round: GameRound,
  ): void {
    // Roll for upgraded monster that drops treasure chest on defeat

    const wave = round.enemyWaves[0];

    const distance = 300;
    const spread = 360 / wave.length;

    wave.forEach((enemy, i) => {
      // make new enemy
      // structured clone doesn't work
      const newEnemy = JSON.parse(JSON.stringify(enemy));
      newEnemy.el = generateDivEl(newEnemy.sprite, round);

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
      enemies.push(newEnemy);
    });
  }

  /*
   * Calc player movement and scroll world.
   */
  function movePlayer(): void {
    if (!elGameWindow) return;
    if (!activePlayer) return;

    // if no direction inputs
    if (!dirX && !dirY && !joystickTiltRatio) return;

    const distanceMax = (activePlayer.speed / 2) * timeSincePrevFrame;

    let distance = 0;
    let angle = 0;

    // keyboard
    if (dirX || dirY) {
      distance = distanceMax;
      angle = Math.atan2(dirY, dirX);
    }

    // joystick overrides keyboard
    if (joystickTiltRatio) {
      distance = distanceMax * joystickTiltRatio;
      angle = (joystickAngle * Math.PI) / 180;
    }

    const left = distance * Math.cos(angle);
    const top = distance * Math.sin(angle);

    const roundedLeft = roundTo3Places(left);
    const roundedTop = roundTo3Places(top);

    // scroll world
    elGameWindow.scrollBy({
      left: roundedLeft,
      top: roundedTop,
    });
  }

  /*
   * Enemies move towards player.
   */
  function moveEnemies(): void {
    if (!elGameWindow) return;

    // get player position
    const playerX = elGameWindow.scrollLeft + elGameWindow.clientWidth / 2;
    const playerY = elGameWindow.scrollTop + elGameWindow.clientHeight / 2;

    activeEnemies.forEach(({ el, speed }, i1) => {
      if (!el) return;

      // get current position
      const left = parseFloat(el.style.left);
      const top = parseFloat(el.style.top);

      // calc diff with player
      const diffX = left - playerX;
      const diffY = top - playerY;
      const distanceToPlayer = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
      const angleToPlayer = Math.atan2(diffY, diffX);

      // calc max travel distance
      const distanceMaxMove = speed * timeSincePrevFrame;

      // prep move
      let leftMove = 0;
      let topMove = 0;

      if (distanceMaxMove >= distanceToPlayer) {
        // move to player position
        leftMove = playerX;
        topMove = playerY;
      } else {
        // calc new position
        const moveX = Math.cos(angleToPlayer) * distanceMaxMove;
        const moveY = Math.sin(angleToPlayer) * distanceMaxMove;

        leftMove = left - moveX;
        topMove = top - moveY;
      }

      // move el
      el.style.left = `${leftMove}px`;
      el.style.top = `${topMove}px`;

      // if new position will overlap with another enemy, move back to original position
      let isOccupied = false;

      for (let i2 = 0; i2 < activeEnemies.length; i2++) {
        // same enemy
        if (i1 === i2) continue;

        const elOther = activeEnemies[i2].el;
        if (!elOther) continue;

        const check = isColliding(el, elOther);
        if (!check) continue;

        isOccupied = true;
        break;
      }

      if (!isOccupied) return;

      // move el back to original position
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    });
  }

  /*
   * Check if player overlaps with xp pickup.
   */
  function checkXpPickups(): void {
    activePickupsXp.forEach((pickup) => {
      if (!pickup.el) {
        console.error("No pickupXp el.");
        return;
      }
      if (!activePlayer.el) {
        console.error("No activePlayer el.");
        return;
      }

      if (!isColliding(pickup.el, activePlayer.el)) return;

      // add to total xp
      playerLevelXp = playerLevelXp + 1; // pickup.value;

      // remove el
      pickup.el?.remove();
    });
  }

  /*
   * Check if player has enough xp to level up.
   */
  function checkLevelUp(): void {
    // max level currently defined
    if (playerLevel >= 10) return;

    const xpToNext = playerLevels[playerLevel - 1].xpToNext;

    if (xpToNext > playerLevelXp) return;

    playerLevelXp = playerLevelXp - xpToNext;
    playerLevel += 1;
  }

  /*
   * Trigger game logic.
   */
  function gameLoop(timestamp: number) {
    // timestamp: DOMHighResTimeStamp
    // The DOMHighResTimeStamp type is a double and is used to store a time value in milliseconds.

    if (!elPickupsXp) {
      console.error(`No div with id "pickups-xp".`);
      return;
    }

    // calc fps
    timeSincePrevFrame = timestamp - timestampPrev;
    timestampPrev = timestamp;
    fps = Math.round(1000 / timeSincePrevFrame);

    // check game over
    isFinished = isGameOver(activeRound, activePlayer);
    if (isFinished) return;

    if (!isPaused) {
      activeRound.durationTimer.current += timeSincePrevFrame;

      movePlayer();
      activePlayer = checkWeapons(activePlayer, activeRound, timeSincePrevFrame);

      moveEnemies();
      activeEnemies = checkCollisionsOnEnemies(
        activeEnemies,
        activePlayer.activeWeapons,
        activeRound,
        activePickupsXp,
        pickupXp,
        elPickupsXp,
      );

      activePlayer = checkCollisionsOnPlayer(activePlayer, activeEnemies, timeSincePrevFrame);
      checkXpPickups();
      checkLevelUp();

      // let activeEnemiesNew: Alive[] = [];
      // activeEnemies.forEach((enemy) => {
      //   activeEnemiesNew.push(checkWeapons(enemy, activeRound, timeSincePrevFrame));
      // });
    }

    // new frame
    window.requestAnimationFrame(gameLoop);
  }

  /*
   * Generate game state.
   * Attached to UI button.
   */
  function startGame(): void {
    // el doesn't exist yet
    if (!elGameWindow) {
      console.error(`No element with id "game-window".`);
      return;
    }
    if (!elTerrain) {
      console.error(`No element with id "terrain".`);
      return;
    }
    if (!elEnemies) {
      console.error(`No div with id "enemies".`);
      return;
    }
    if (!elPickupsItems) {
      console.error(`No div with id "pickups-items".`);
      return;
    }
    if (!elPickupsXp) {
      console.error(`No div with id "pickups-xp".`);
      return;
    }
    if (!elPlayer) {
      console.error(`No element with id "player".`);
      return;
    }
    if (!elWeapons) {
      console.error(`No div with id "weapons".`);
      return;
    }

    // reset game state
    activeRound = structuredClone(gameRound1);
    activeEnemies = [];
    activePickupsItems = [];
    activePickupsXp = [];
    elEnemies.replaceChildren(); // empty a node of all its children
    elPickupsItems.replaceChildren();
    elPickupsXp.replaceChildren();
    elWeapons.replaceChildren();
    isFinished = false;
    isPaused = false;
    isStarted = true; // hide info el, use joystick
    playerLevelXp = 0;
    playerLevel = 1;

    // fullscreen
    // fullscreen game-window sets height, width
    // elGameWindow.requestFullscreen();

    setMap(elGameWindow, elTerrain, activeRound.map);

    // new player object & sprite el
    // after terrain load because of height, width
    activePlayer = structuredClone(player);
    activePlayer.el = generateDivEl(activePlayer.sprite, activeRound);

    elPlayer.replaceChildren();
    elPlayer.appendChild(activePlayer.el);

    spawnEnemyWaveCircle(activeEnemies, elEnemies, activeRound);

    // start game loop
    window.requestAnimationFrame(gameLoop);
  }
</script>

<ControlsKeys bind:actionsActive bind:dirX bind:dirY bind:isPaused />

<div id="game-window" bind:this={elGameWindow} class="h-screen w-screen overflow-auto bg-gray-900">
  <div
    id="top-ui"
    class="absolute left-0 top-0 z-50 p-1"
    style:width="{elGameWindow?.clientWidth ?? 1000}px"
  >
    <div id="experience-bar" class="mb-2 rounded-lg border-2 border-yellow-300 bg-gray-900 p-1">
      <div class="flex w-full flex-row justify-between">
        <h1 class="text-xl font-extrabold">Svampire Svurvivors</h1>

        <span class="font-bold">Level {playerLevel}</span>
      </div>

      {#if activePlayer}
        {@const xpToNext = playerLevels[playerLevel - 1].xpToNext}
        {@const experiencePercent = (playerLevelXp / xpToNext) * 100}

        <div class="sr-only flex flex-row gap-2">
          <span>experience:</span>
          <span>{Math.round(experiencePercent)}%</span>
          <span>{playerLevelXp} / xpToNext}</span>
        </div>

        <div class="flex h-6 flex-row bg-gray-600">
          <div class="rounded bg-blue-500" style="width: {experiencePercent}%"></div>
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-3 grid-rows-1">
      <div class="flex flex-col gap-1 justify-self-start text-center">
        <div class="flex flex-row gap-1">
          {#each player.weapons as { sprite }}
            <span class="w-6 overflow-clip border-2 border-white/30">{sprite.emoji}</span>
          {/each}
        </div>

        <div class="flex flex-row gap-1">
          {#each Array(player.capacityWeapons) as slot, i}
            <span class="w-6 border-2 border-white/30">{slot}{i + 1}</span>
          {/each}
        </div>

        <div class="flex flex-row gap-1">
          {#each Array(player.capacityAccessories) as slot, i}
            <span class="w-6 border-2 border-dotted border-white/30">{slot}{i + 1}</span>
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
        <!-- <span>{0} 🪙</span> -->
        <span>{activeRound.logs.enemiesKilled?.length ?? 0} 💀</span>

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

            if (!elEnemies) {
              console.error(`No div with id "enemies".`);
              return;
            }

            spawnEnemyWaveCircle(activeEnemies, elEnemies, activeRound);
          }}
        >
          <button class="bg-rose-900 px-4 py-1 font-extrabold">spawn enemies</button>
        </form>

        <span class="text-blue-700">{fps} fps</span>

        <span class="text-blue-700"
          >pickups: {activePickupsItems.length}
          {#each activePickupsItems as { sprite }}
            <span>{sprite.emoji}</span>
          {/each}
        </span>

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
          src={gameRound1.map.terrain.path}
          alt="Minimap of {gameRound1.map.name} area."
          class="w-full"
        />
      </div>
    {/if}
  </div>

  <div bind:this={elTerrain} id="terrain" class="relative">
    <div bind:this={elEnemies} id="enemies" class="absolute left-0 top-0 h-full w-full"></div>
    <div bind:this={elPickupsXp} id="pickups-xp" class="absolute left-0 top-0 h-full w-full"></div>
    <div
      bind:this={elPickupsItems}
      id="pickups-items"
      class="absolute left-0 top-0 z-20 h-full w-full"
    ></div>
  </div>

  <div
    id="center-window"
    class="absolute"
    style:left="{(elGameWindow?.clientWidth ?? 1000) / 2}px"
    style:top="{(elGameWindow?.clientHeight ?? 1000) / 2}px"
  >
    <div
      bind:this={elPlayer}
      id="player"
      class="absolute"
      style:left="{-activePlayer.sprite.width / 2}px"
      style:top="{-activePlayer.sprite.height / 2}px"
      style:height="{activePlayer.sprite.height}px"
      style:width="{activePlayer.sprite.width}px"
    ></div>

    <div
      id="health-bar"
      class="absolute mt-2"
      class:hidden={!isStarted}
      style:top="{activePlayer.sprite.height / 2}px"
      style:left="{-activePlayer.sprite.width / 2}px"
      style:width="{activePlayer.sprite.width}px"
    >
      <div id="health-bar-text" class="sr-only flex flex-row gap-2">
        <span>health:</span>
        <span>{healthPercent}%</span>
        <span>{activePlayer.health.current} / {activePlayer.health.max}</span>
      </div>

      <div id="health-bar-percent" class="flex h-2 flex-row bg-gray-900">
        <div class="bg-rose-500" style="width: {healthPercent}%"></div>
      </div>
    </div>

    <div bind:this={elWeapons} id="weapons" class="z-10"></div>
  </div>
</div>

{#if !isStarted || isFinished}
  <div
    id="start-screen"
    class="absolute left-0 top-0 z-50 h-screen w-screen place-items-center content-center space-y-6 bg-rose-950/70"
  >
    <h1 class="text-center text-6xl font-extrabold">Svampire Svurvivors</h1>

    <form
      id="form-start-game"
      onsubmit={(event) => {
        event.preventDefault();
        startGame();
      }}
    >
      <button
        class="border-b-8 border-red-900 bg-rose-600 px-8 py-2 font-extrabold text-white shadow-md shadow-red-900"
        >start game</button
      >
    </form>

    <!-- <div> -->
    <!--   <p>TODO:</p> -->
    <!---->
    <!--   <ul class="list-disc"> -->
    <!--     <li>globals: score, experience, gold</li> -->
    <!--     <li>map</li> -->
    <!--     <li>power ups</li> -->
    <!--     <li>arrows pointing to power ups</li> -->
    <!--   </ul> -->
    <!-- </div> -->
  </div>
{:else if !isPaused}
  <ControlsJoystick bind:joystickAngle bind:joystickTiltRatio />
{/if}
