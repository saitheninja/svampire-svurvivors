<script lang="ts">
  import Controls from "./Controls.svelte";

  interface Map {
    name: string;
    height: number;
    width: number;
    imagePath: string;
  }
  const mapForest: Map = {
    name: "forest",
    height: 8000,
    width: 8000,
    imagePath: "./map-forest.svg",
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
  }

  let elGameWindow: HTMLDivElement;
  let clientWidth = $state(0);
  let clientHeight = $state(0);

  function startGame() {
    // start game loop
    window.requestAnimationFrame(gameLoop);

    // fullscreen
    elGameWindow.requestFullscreen();
  }

  // timer
  let start = $state(0);
  let timerMinutes = $state(0);
  let timerSeconds = $state(0);

  // fps
  let timestampPrev = $state(0);
  let fps = $state(0);

  // controls
  let actionsActive: string[] = $state([]);

  function draw(timestamp: number) {
    // fps
    let secondsPassed = (timestamp - timestampPrev) / 1000;
    timestampPrev = timestamp;

    fps = Math.round(1 / secondsPassed);

    // timer
    if (start === 0) start = timestamp;

    const elapsed = timestamp - start;
    const secondsSinceStart = Math.floor(elapsed / 1000);

    timerMinutes = Math.floor(secondsSinceStart / 60);
    timerSeconds = secondsSinceStart % 60;

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

<form onsubmit={() => startGame()}>
  <button>start game</button>
</form>

<div
  bind:this={elGameWindow}
  bind:clientWidth
  bind:clientHeight
  id="game-window"
  class="grid h-full grid-cols-1"
>
  <div id="top-ui" class="z-50 flex flex-row gap-2">
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

    <span class="text-green-500">{clientWidth} {clientHeight}</span>

    <span>{JSON.stringify(actionsActive)}</span>
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
