<script lang="ts">
  import Controls from "./Controls.svelte";

  interface Terrain {
    name: string;
    imagePath: string;
    height: number;
    width: number;
  }

  const terrainForest: Terrain = {
    name: "forest",
    imagePath: "./terrain-forest.svg",
    height: 4000,
    width: 4000,
  };

  interface Sprite {
    name: string;
    colorBg: string;
    colorHit: string;
    emoji: string;
    fontSize: number; // px
    height: number; // px
    width: number; // px
  }

  interface Weapon {
    name: string;
    damage: number;
    durationActive: number; // milliseconds
    durationActiveElapsed: number;
    durationCooldown: number;
    durationCooldownElapsed: number;
    sprite: Sprite;
    el?: HTMLDivElement;
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

  interface Alive {
    name: string;
    healthCurrent: number;
    healthMax: number;
    speed: number;
    weapons: Weapon[];
    sprite: Sprite;
    el?: HTMLDivElement;
  }

  const player: Alive = {
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

  // game
  let elGameWindow: HTMLDivElement | undefined = $state();
  let elWorld: HTMLDivElement | undefined = $state();
  let elTerrain: HTMLDivElement | undefined = $state();
  let isInfoShown = $state(true);
  let activeEnemies: Alive[] = $state([]);
  let activePlayer: Alive | undefined = $state();
  let activeWeapons: Weapon[] = $state([]);
  let spawnId = 0;

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

  /*
  Attach `terrain` as backgroundImage for `el`.
  */
  function setTerrain(el: HTMLElement, terrain: Terrain): void {
    // set dimensions
    el.style.width = `${terrain.width}px`;
    el.style.height = `${terrain.height}px`;

    // set background
    el.style.backgroundImage = `url(${terrain.imagePath})`;
    el.style.backgroundSize = `${terrain.width}px ${terrain.height}px`;
    el.style.backgroundRepeat = "no-repeat";
  }

  /*
  Generate div for given sprite .
  */
  function generateDiv(sprite: Sprite): HTMLDivElement {
    const elEmoji = document.createElement("span");
    elEmoji.textContent = sprite.emoji;
    elEmoji.style.fontSize = `${sprite.fontSize}px`;

    const elName = document.createElement("span");
    elName.textContent = sprite.name;
    elName.classList.add("sr-only");

    const elDiv = document.createElement("div");
    elDiv.style.position = "absolute";
    elDiv.style.width = `${sprite.width}px`;
    elDiv.style.height = `${sprite.height}px`;
    elDiv.style.overflow = "clip";
    // bg color with alpha 50%
    elDiv.style.backgroundColor = sprite.colorBg.replace(")", " / 0.5)");

    //  center emoji in div
    elEmoji.style.marginLeft = `${-sprite.fontSize / 10}px`;
    elEmoji.style.marginTop = `${-sprite.fontSize / 4}px`;
    elDiv.style.display = "flex";
    elDiv.style.flexDirection = "row";

    elDiv.appendChild(elEmoji);
    elDiv.appendChild(elName);

    spawnId += 1;
    elDiv.id = `${spawnId}`;
    // console.log(spawnId);

    return elDiv;
  }

  /*
  Spawn each enemy in `wave`, and attach it to `el`.
  */
  function spawnEnemyWaveCircle(wave: Alive[]): void {
    // Roll for upgraded monster that drops treasure chest on defeat

    const distance = 300;
    const spread = 360 / wave.length;

    wave.forEach((enemy, i) => {
      let newEnemy = structuredClone(enemy);

      // make el
      newEnemy.el = generateDiv(newEnemy.sprite);

      // calc x, y
      const angle = spread * i;
      const rads = angle * (Math.PI / 180);
      const x = Math.round(Math.cos(rads) * distance);
      const y = Math.round(Math.sin(rads) * distance);

      // set x, y
      if (!elWorld) return;
      newEnemy.el.style.left = `${elWorld.scrollLeft + elWorld.clientWidth / 2 + x}px`;
      newEnemy.el.style.top = `${elWorld.scrollTop + elWorld.clientHeight / 2 + y}px`;

      // add to world
      const elEnemies = document.getElementById("enemies");
      if (!elEnemies) {
        console.error(`No div with id "enemies".`);
        return;
      }
      elEnemies.appendChild(newEnemy.el);

      // add to list of active enemies
      activeEnemies.push(newEnemy);
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
  Calc player movement and scroll world.
  */
  function movePlayer(): void {
    if (!elWorld) return;
    if (!activePlayer) return;

    // player movement
    const distancePlayer = (activePlayer.speed / 2) * timeSincePrevFrame;

    // scroll world
    elWorld.scrollBy({
      left: dirX * distancePlayer,
      top: dirY * distancePlayer,
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
      if (!activePlayer) return;
      if (activePlayer.healthCurrent <= 0) return;
      activePlayer.healthCurrent = activePlayer.healthCurrent - 1;
    }

    // new frame
    window.requestAnimationFrame(gameLoop);
  }

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

    // reset timer
    timeElapsed = 0;

    // close info window
    isInfoShown = false;

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

    // fresh player object
    spawnPlayer();

    // spawn enemies
    spawnEnemyWaveCircle(enemyWave);

    // start game loop
    window.requestAnimationFrame(gameLoop);
  }
</script>

<Controls bind:actionsActive bind:isPaused bind:dirX bind:dirY />

<div id="game-window" bind:this={elGameWindow} class="flex h-screen flex-col bg-gray-900">
  <div id="top-ui" class="z-50 flex flex-shrink gap-2 bg-rose-950 py-1 align-middle">
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
        spawnEnemyWaveCircle(enemyWave);
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

    <div class="flex-row">
      {#if activePlayer}
        <span>{"❤️".repeat(activePlayer.healthCurrent)}</span>
        <span>{"🖤".repeat(activePlayer.healthMax - activePlayer.healthCurrent)}</span>
        <span>{activePlayer.healthCurrent}/{activePlayer.healthMax}</span>

        <!-- <span>💙</span> -->
      {/if}
    </div>
  </div>

  <div bind:this={elWorld} id="world" class="flex-grow overflow-auto bg-purple-900">
    {#if isInfoShown === true}
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

        <details class="space-y-4">
          <summary>
            <span>
              It's like <a
                href="https://store.steampowered.com/app/1794680/Vampire_Survivors/"
                class="underline">Vampire Survivors</a
              >, but built with Svelte, for the web.
            </span>

            <span>I am so funny haha.</span>
          </summary>

          <div>
            <p>Links:</p>

            <ul>
              <li>
                <a href="https://hack.sveltesociety.dev/2024/rules">SvelteHack Rules</a>
              </li>

              <li>
                <a href="https://hack.sveltesociety.dev/2023/winners">SvelteHack Winnners 2013</a>
              </li>

              <li>
                Previous winner, <a href="https://hack.sveltesociety.dev/2023/winners"
                  >Wolfenstein 3D</a
                >
              </li>
            </ul>
          </div>

          <div>
            <p>TODO:</p>

            <ul class="list-disc">
              <li>globals: health, score, timer, experience, gold</li>
              <li>touch controls</li>
              <li>boss monsters</li>
              <li>weapons</li>
              <li>map</li>
              <li>power ups</li>
              <li>arrows pointing to power ups</li>
              <li>map tiles editor</li>
            </ul>
          </div>
        </details>
      </div>
    {/if}

    <div bind:this={elTerrain} id="terrain" class="relative mx-auto">
      <div class="absolute h-full w-full" id="enemies"></div>
    </div>

    <!-- player goes here -->
    <div id="weapons"></div>
  </div>
</div>
