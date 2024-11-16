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

  interface Weapon {
    name: string;
    damage: number;
    spawnInterval: number; // milliseconds
    spriteEmoji: string;
  }

  const whip: Weapon = {
    name: "whip",
    damage: 2,
    spawnInterval: 1000,
    spriteEmoji: "🔗",
  };
  const sword: Weapon = {
    name: "sword",
    damage: 4,
    spawnInterval: 500,
    spriteEmoji: "🗡️",
  };

  const weaponsAll: Weapon[] = [whip, sword];

  interface Alive {
    name: string;
    colorClass: string;
    health: number;
    spriteEmoji: string;
    speed: number;
    weapons: Weapon[];
  }

  const player: Alive = {
    name: "player",
    colorClass: "bg-blue-900",
    health: 100,
    spriteEmoji: "🧔🏾",
    speed: 1,
    weapons: weaponsAll,
  };

  const enemySkeleton: Alive = {
    name: "skeleton",
    colorClass: "bg-lime-500",
    health: 1,
    spriteEmoji: "💀",
    speed: 2,
    weapons: [],
  };
  const enemyZombie: Alive = {
    name: "zombie",
    colorClass: "bg-lime-500",
    health: 4,
    spriteEmoji: "🧟",
    speed: 5,
    weapons: [],
  };
  const enemyGoblin: Alive = {
    name: "goblin",
    colorClass: "bg-red-500",
    health: 10,
    spriteEmoji: "👺",
    speed: 1,
    weapons: [],
  };
  // Witch
  // Dog
  // Dragonfly
  // Enemy pathfinding? Move towards middle?

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
  let isPaused = $state(false);

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

  // Attach `terrain` as backgroundImage for `el`.
  function setTerrain(el: HTMLElement, terrain: Terrain): void {
    // set dimensions
    el.style.width = `${terrain.width}px`;
    el.style.height = `${terrain.height}px`;

    // set background
    el.style.backgroundImage = `url(${terrain.imagePath})`;
    el.style.backgroundSize = `${terrain.width}px ${terrain.height}px`;
    el.style.backgroundRepeat = "no-repeat";
  }

  // Generate div for `alive`.
  function generateDiv(alive: Alive): HTMLDivElement {
    const elEmoji = document.createElement("span");
    elEmoji.classList.add("-ml-1");
    elEmoji.classList.add("text-5xl");
    elEmoji.textContent = alive.spriteEmoji;

    const elName = document.createElement("span");
    elName.classList.add("sr-only");
    elName.textContent = alive.name;

    const elSprite = document.createElement("div");
    // elSprite.classList.add(alive.colorClass);
    elSprite.classList.add("size-12");

    elSprite.appendChild(elEmoji);
    elSprite.appendChild(elName);

    const elDiv = document.createElement("div");
    elDiv.classList.add("absolute");
    elDiv.classList.add("max-w-full");
    elDiv.classList.add("max-h-full");

    elDiv.appendChild(elSprite);

    return elDiv;
  }

  // Spawn each enemy in `wave`, and attach it to `el`.
  function spawnEnemyWaveCircle(wave: Alive[]): void {
    // Roll for upgraded monster that drops treasure chest on defeat

    const distance = 300;
    const spread = 360 / wave.length;
    // size-12 = 3rem = 48px
    // const spriteOffset = 24;

    wave.forEach((enemy, i) => {
      // make sprite
      const elEnemy = generateDiv(enemy);

      // add to game
      if (!elTerrain) return;
      elTerrain.appendChild(elEnemy);

      // calc x, y
      const angle = spread * i;
      const rads = angle * (Math.PI / 180);
      const x = Math.round(Math.cos(rads) * distance);
      const y = Math.round(Math.sin(rads) * distance);

      // set x, y
      if (!elWorld) return;
      elEnemy.style.left = `${elWorld.scrollLeft + elWorld.clientWidth / 2 + x}px`;
      elEnemy.style.top = `${elWorld.scrollTop + elWorld.clientHeight / 2 + y}px`;
    });
  }




  // Check if div bounding boxes overlap.
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

  // Generate game state.
  // Attached to UI button.
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

    // close info window
    isInfoShown = false;

    // fullscreen
    elGameWindow.requestFullscreen();

    // load map
    setTerrain(elTerrain, terrainForest);

    // spawn player
    const elPlayer = generateDiv(player);
    elPlayer.id = "player";
    const spriteOffset = 24;
    elPlayer.style.left = `${elWorld.clientWidth / 2 - spriteOffset}px`;
    elPlayer.style.top = `${elWorld.clientHeight / 2 + spriteOffset}px`;

    // add to game
    elWorld.appendChild(elPlayer);

    // scroll to center
    elWorld.scrollTo({
      top: (elWorld.scrollHeight - elWorld.clientHeight) / 2,
      left: (elWorld.scrollWidth - elWorld.clientWidth) / 2,
    });

    // spawn enemies
    spawnEnemyWaveCircle(enemyWave);

    // start game loop
    window.requestAnimationFrame(gameLoop);
  }

  // Trigger game logic.
  function gameLoop(timestamp: number) {
    // timestamp: DOMHighResTimeStamp
    // The DOMHighResTimeStamp type is a double and is used to store a time value in milliseconds.

    // fps
    timeSincePrevFrame = timestamp - timestampPrev;
    timestampPrev = timestamp;

    // timer
    if (!isPaused) timeElapsed += timeSincePrevFrame;

    // parse inputs
    let moveX = 0;
    let moveY = 0;

    if (actionsActive.includes("left")) moveX = moveX - 1;
    if (actionsActive.includes("right")) moveX = moveX + 1;
    if (actionsActive.includes("down")) moveY = moveY + 1;
    if (actionsActive.includes("up")) moveY = moveY - 1;

    // player movement
    const distance = (player.speed / 2) * timeSincePrevFrame;

    // scroll world
    if (elWorld && !isPaused) {
      elWorld.scrollBy({
        top: moveY * distance,
        left: moveX * distance,
      });
    }

    // check collisions
    const elPlayer = document.getElementById("player");
    if (!elPlayer) return;
    if (!elTerrain) return;

    for (const child of elTerrain.children) {
      const isColliding = isCollidingCheck(elPlayer, child);

      if (isColliding) {
        child.classList.add("bg-red-300");
      } else {
        child.classList.remove("bg-red-300");
      }
    }

    window.requestAnimationFrame(gameLoop);
  }
</script>

<Controls bind:actionsActive />

<div id="game-window" bind:this={elGameWindow} class="flex h-screen flex-col bg-gray-900">
  <div id="top-ui" class="z-50 flex flex-shrink gap-2 bg-rose-950 py-1 align-middle">
    <img src={terrainForest.imagePath} alt="Minimap of {terrainForest.name} area." class="size-8" />

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

    <span class="text-cyan-500">scrollX: {elWorld ? elWorld.scrollLeft : "no"}</span>
    <span class="text-cyan-500">scrollY: {elWorld ? elWorld.scrollTop : "no"}</span>
    <!-- <span class="text-cyan-500">width: {elWorld?.clientWidth ?? "no"}</span> -->
    <!-- <span class="text-cyan-500">height: {elWorld?.clientHeight ?? "no"}</span> -->

    <span class="text-cyan-500">actions: {actionsActive}</span>

    <form
      onsubmit={(event) => {
        event.preventDefault();

        spawnEnemyWaveCircle(enemyWave);
      }}
    >
      <button class="bg-rose-900 px-4 py-1 font-extrabold">spawn enemies</button>
    </form>

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
  </div>

  {#if isInfoShown === true}
    <div id="info" class="mx-auto my-auto max-w-max">
      <h1 class="text-center text-xl font-extrabold">Svampire Svurvivors</h1>

      <form
        id="form-start-game"
        onsubmit={(event) => {
          event.preventDefault();
          startGame();
        }}
        class="mx-auto max-w-max"
      >
        <button
          class="m-4 border-b-8 border-red-900 bg-rose-600 px-8 py-2 font-extrabold text-white shadow-md shadow-red-900"
          >start game</button
        >
      </form>

      <details>
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
            <li><a href="https://hack.sveltesociety.dev/2024/rules">SvelteHack Rules</a></li>
            <li>
              <a href="https://hack.sveltesociety.dev/2023/winners">SvelteHack Winnners 2013</a>
            </li>
          </ul>
        </div>

        <div>
          <p>TODO</p>

          <ul class="list-disc">
            <li>keyboard & touch controls</li>
            <li>enemy spawns, waves</li>
            <li>boss monsters</li>
            <li>globals: health, score, timer, experience, gold</li>
            <li>weapons</li>
            <li>power ups</li>
            <li>map</li>
            <li>arrows pointing to power ups</li>
            <li>map tiles editor</li>
            <li>camera that follows player</li>
          </ul>
        </div>
      </details>
    </div>
  {/if}

  <div bind:this={elWorld} id="world" class="flex-grow overflow-auto bg-purple-900">
    <div bind:this={elTerrain} id="terrain" class="relative mx-auto">
      <!-- enemies go here -->
    </div>

    <!-- player goes here -->
  </div>
</div>
