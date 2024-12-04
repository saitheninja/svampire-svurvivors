<script lang="ts">
  import ControlsJoystick from "./ControlsJoystick.svelte";
  import ControlsKeys from "./ControlsKeys.svelte";

  import { enemyWave, player, mapForest, playerLevels, pickupXp } from "./data";
  import { generateDiv, isCollidingCheck, roundTo3Places, setMap } from "./engine";

  import type { Alive, Weapon } from "./engine";

  const durationGameEnd = 30 * 60 * 1000; // minutes * seconds * milliseconds

  // when filled, treasure chests won't offer that type
  const slotsWeapons = 6;
  const slotsAccessories = 6;

  // current game state
  let elGameWindow: HTMLDivElement | undefined = $state();
  let elTerrain: HTMLDivElement | undefined = $state();
  let elPlayer: HTMLDivElement | undefined = $state();

  let isStarted = $state(false);
  let isFinished = $state(false);

  let spawnId = 0;
  let enemiesKilled = $state(0);

  // active game objects
  let activeEnemies: Alive[] = $state([]);
  let activePlayer: Alive = $state(structuredClone(player));
  let activeWeapons: Weapon[] = $state([]);
  let activeExperiencePickups: HTMLElement[] = $state([]);

  let healthPercent = $derived(
    Math.round((activePlayer.healthCurrent / activePlayer.healthMax) * 100),
  );

  let playerLevel = $state(1);
  let playerLevelXp = $state(0);

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
   * Spawn each enemy in `wave`, and attach it to `el`.
   * Uses element with id `enemies`.
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
      newEnemy.el = generateDiv(newEnemy.sprite, spawnId);

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
      let isColliding = false;

      for (let i2 = 0; i2 < activeEnemies.length; i2++) {
        // same enemy
        if (i1 === i2) continue;

        const elOther = activeEnemies[i2].el;
        if (!elOther) continue;

        const check = isCollidingCheck(el, elOther);
        if (!check) continue;

        isColliding = true;
        break;
      }

      if (!isColliding) return;

      // move el back to original position
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    });
  }

  /*
   * Spawn experience pickup. Called when enemy is killed.
   */
  function spawnExperienceGem(enemy: Alive): void {
    if (!elTerrain) {
      console.error(`No div with id "terrain".`);
      return;
    }
    if (!enemy.el) {
      console.error(`No enemy el.`);
      return;
    }

    const el = generateDiv(pickupXp, spawnId);

    el.style.left = enemy.el.style.left;
    el.style.top = enemy.el.style.top;
    el.style.rotate = "45deg"; // point at top

    activeExperiencePickups.push(el);
    elTerrain.appendChild(el);
  }

  /*
   * Check enemies overlap with player weapons.
   */
  function checkEnemiesHit(activeEnemies: Alive[], activeWeapons: Weapon[]): Alive[] {
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

      // remove el if dead
      if (enemy.healthCurrent > 0) return;
      enemy.el?.remove();
      enemiesKilled += 1;

      spawnExperienceGem(enemy);
    });

    // remove if health 0 or below
    activeEnemies = activeEnemies.filter((enemy) => enemy.healthCurrent > 0);

    return activeEnemies;
  }

  /*
   * Check player overlaps with enemies.
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
   * Add new weapons. Remove expired weapons.
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
      newWeapon.el = generateDiv(weapon.sprite, spawnId);

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
   * Check if player overlaps with xp pickup.
   */
  function checkExperiencePickup(): void {
    activeExperiencePickups.forEach((pickup) => {
      if (!activePlayer.el) {
        console.error("No activePlayer el.");
        return;
      }

      // check if player collides
      const isCollidingPlayer = isCollidingCheck(pickup, activePlayer.el);
      if (!isCollidingPlayer) return;

      // add to total xp
      playerLevelXp += 1;

      // remove el
      pickup.remove();
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
   * Check timer, player health.
   */
  function checkGameOver(): boolean {
    if (timeElapsed > durationGameEnd) return true;
    if (activePlayer && activePlayer.healthCurrent <= 0) return true;

    return false;
  }

  /*
   * Trigger game logic.
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
      activeEnemies = checkEnemiesHit(activeEnemies, activeWeapons);
      checkPlayerHit();
      checkExperiencePickup();
      checkLevelUp();
    }

    // new frame
    window.requestAnimationFrame(gameLoop);
  }

  /*
   * Make new player object & sprite el on start.
   */
  function spawnPlayer(): void {
    // make fresh copy of player data, and transfer elPlayer
    activePlayer = structuredClone(player);

    // make player sprite
    const elSprite = generateDiv(activePlayer.sprite, spawnId);
    activePlayer.el = elSprite;

    // add to game
    if (!elPlayer) {
      console.error(`No element with id "player".`);
      return;
    }
    elPlayer.insertBefore(elSprite, elPlayer.firstElementChild);
  }

  /*
   * Generate game state.
   * Attached to UI button.
   */
  function startGame(): void {
    // div doesn't exist yet
    if (!elGameWindow) {
      console.error(`No element with id "game-window".`);
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
    playerLevelXp = 0;
    playerLevel = 1;

    // fullscreen
    // fullscreen game-window sets height, width
    // elGameWindow.requestFullscreen();

    // set map
    setMap(elGameWindow, elTerrain, mapForest);

    const top = (elGameWindow.scrollHeight - elGameWindow.clientHeight) / 2;
    const left = (elGameWindow.scrollWidth - elGameWindow.clientWidth) / 2;

    // scroll to center
    elGameWindow.scrollTo({
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

        <span class="text-blue-700">{fps} fps</span>

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

        <img src={mapForest.terrain.path} alt="Minimap of {mapForest.name} area." class="w-full" />
      </div>
    {/if}
  </div>

  <div bind:this={elTerrain} id="terrain" class="relative">
    <div id="enemies" class="absolute left-0 top-0 h-full w-full"></div>
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
        <span>{activePlayer.healthCurrent} / {activePlayer.healthMax}</span>
      </div>

      <div id="health-bar-percent" class="flex h-2 flex-row bg-gray-900">
        <div class="bg-rose-500" style="width: {healthPercent}%"></div>
      </div>
    </div>

    <div id="weapons" class="z-10"></div>
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
