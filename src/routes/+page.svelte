<script lang="ts">
  import Controls from "./Controls.svelte";

  interface Map {
    name: string;
    imagePath: string;
    height: number;
    width: number;
  }
  const mapForest: Map = {
    name: "forest",
    imagePath: "./map-forest.svg",
    height: 8000,
    width: 8000,
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
    health: number;
    spriteEmoji: string;
    speed: number;
    weapons: Weapon[];
  }

  const player: Alive = {
    name: "player",
    health: 100,
    spriteEmoji: "🧔🏾",
    speed: 10,
    weapons: weaponsAll,
  };

  const enemySkeleton: Alive = {
    name: "skeleton",
    health: 1,
    spriteEmoji: "💀",
    speed: 2,
    weapons: [],
  };
  const enemyZombie: Alive = {
    name: "zombie",
    health: 4,
    spriteEmoji: "🧟",
    speed: 5,
    weapons: [],
  };
  const enemyGoblin: Alive = {
    name: "goblin",
    health: 10,
    spriteEmoji: "👺",
    speed: 1,
    weapons: [],
  };
  // Witch
  // Dog
  // Dragonfly
  // Enemy pathfinding? Move towards middle?
  const enemiesAll = [enemySkeleton, enemyZombie, enemyGoblin];

  // game window
  let elGameWindow: HTMLDivElement | undefined = $state();
  let clientWidth = $state(0);
  let clientHeight = $state(0);

  // timer
  let timestampStart = $state(0);
  let timerMinutes = $state(0);
  let timerSeconds = $state(0);

  // fps
  let timestampPrev = $state(0);
  let fps = $state(0);

  // controls
  let actionsActive: string[] = $state([]);

  function setMap(el: HTMLElement, map: Map) {
    el.style.backgroundImage = `url(${map.imagePath})`;
    el.style.backgroundSize = `${map.width}px ${map.height}px`;
    el.style.backgroundPositionX = `${map.width / 2}px`;
    el.style.backgroundPositionY = `${map.height / 2}px`;
  }

  function startGame() {
    // div doesn't exist yet
    if (!elGameWindow) {
      console.error(`No element with id "game-window".`);
      return;
    }

    // load map
    setMap(elGameWindow, mapForest);

    // fullscreen
    elGameWindow.requestFullscreen();

    // start game loop
    window.requestAnimationFrame((timestamp) => {
      // start timer
      if (timestampStart === 0) timestampStart = timestamp;

      // start game
      window.requestAnimationFrame(gameLoop);
    });
  }

  function draw(timestamp: number) {
    // fps
    let secondsPassed = (timestamp - timestampPrev) / 1000;
    timestampPrev = timestamp;

    fps = Math.round(1 / secondsPassed);

    // timer
    const elapsed = timestamp - timestampStart;
    const secondsSinceStart = Math.floor(elapsed / 1000);

    timerMinutes = Math.floor(secondsSinceStart / 60);
    timerSeconds = secondsSinceStart % 60;

    // scroll background
    if (!elGameWindow) return;
    let bgX = elGameWindow.style.backgroundPositionX;
    let bgY = elGameWindow.style.backgroundPositionY;

    bgX.replace("px", "");
    bgY.replace("px", "");

    let bgXInt = parseInt(bgX);
    let bgYInt = parseInt(bgY);

    let map = mapForest;

    bgXInt = Math.max(map.width - clientWidth / 2, bgXInt + 1);
    bgYInt = Math.max(map.height - clientHeight / 2, bgYInt + 1);

    elGameWindow.style.backgroundPositionX = `${bgXInt}px`;
    elGameWindow.style.backgroundPositionY = `${bgYInt}px`;
  }

  function gameLoop(timestamp: number) {
    // timestamp: DOMHighResTimeStamp
    // The DOMHighResTimeStamp type is a double and is used to store a time value in milliseconds.
    draw(timestamp);

    window.requestAnimationFrame(gameLoop);
  }
</script>

<Controls bind:actionsActive />

<div>
  <h1>Svampire Svurvivors</h1>

  <div>
    <p>
      It's like <a
        href="https://store.steampowered.com/app/1794680/Vampire_Survivors/"
        class="underline">Vampire Survivors</a
      >, but built with Svelte, for the web.
    </p>

    <p>I am so funny haha.</p>
  </div>

  <div>
    <p>Links:</p>

    <ul>
      <li><a href="https://hack.sveltesociety.dev/2024/rules">SvelteHack Rules</a></li>
      <li><a href="https://hack.sveltesociety.dev/2023/winners">SvelteHack Winnners 2013</a></li>
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
</div>

<form id="form-start-game" onsubmit={() => startGame()}>
  <button
    class="m-4 border-b-8 border-red-900 bg-rose-600 px-4 py-2 text-white shadow-md shadow-red-900"
    >start game</button
  >
</form>

<div
  bind:this={elGameWindow}
  bind:clientWidth
  bind:clientHeight
  id="game-window"
  class="grid h-full w-full grid-cols-1"
>
  <div id="top-ui" class="z-50 flex flex-row gap-2 bg-rose-950">
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

    <span class="text-green-500">width: {clientWidth}px height:{clientHeight}px</span>

    {#if elGameWindow}
      <span class="text-cyan-500">window: {elGameWindow}</span>
      <span class="text-cyan-500">X: {elGameWindow.style.backgroundPositionX}px</span>
      <span class="text-cyan-500">Y: {elGameWindow.style.backgroundPositionY}px</span>
    {/if}

    <span class="text-cyan-500">actions: {actionsActive}</span>
  </div>

  <div id="player" class="z-10 m-auto size-8 bg-red-500">
    <span class="text-xl">{player.spriteEmoji}</span>
    <span class="sr-only">{player.name}</span>

    {#each player.weapons as weapon}
      <div class="absolute z-20">
        <span>{weapon.spriteEmoji}</span>
        <span class="sr-only">{weapon.name}</span>
      </div>
    {/each}
  </div>

  {#each enemiesAll as enemy}
    <div class="z-0 m-auto">
      <span>{enemy.spriteEmoji}</span>
      <span class="sr-only">{enemy.name}</span>

      {#each enemy.weapons as weapon}
        <div class="absolute">
          <span>{weapon.spriteEmoji}</span>
          <span class="sr-only">{weapon.name}</span>
        </div>
      {/each}
    </div>
  {/each}
</div>
