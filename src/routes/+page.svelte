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
    health: number;
    spriteEmoji: string;
    speed: number;
    weapons: Weapon[];
  }

  const player: Alive = {
    name: "player",
    health: 100,
    spriteEmoji: "🧔🏾",
    speed: 50,
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

  // game
  let elGameWindow: HTMLDivElement | undefined = $state();
  let elPlayer: HTMLDivElement | undefined = $state();

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
    // set image properties
    el.style.backgroundImage = `url(${map.imagePath})`;
    el.style.backgroundSize = `${map.width}px ${map.height}px`;

    // set position to center
    el.style.backgroundPositionX = `${(map.width + el.clientWidth) / 2}px`;
    el.style.backgroundPositionY = `${(map.height + el.clientHeight) / 2}px`;
  }

  function startGame() {
    // div doesn't exist yet
    if (!elGameWindow) {
      console.error(`No element with id "game-window".`);
      return;
    }
    if (!elPlayer) {
      console.error(`No element with id "player".`);
      return;
    }

    // fullscreen
    elGameWindow.requestFullscreen();

    // load map
    setMap(elPlayer, mapForest);

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
    if (!elPlayer) return;
    let bgX = elPlayer.style.backgroundPositionX; // 4000px
    let bgY = elPlayer.style.backgroundPositionY;

    bgX.replace("px", "");
    bgY.replace("px", "");

    let bgXInt = parseInt(bgX);
    let bgYInt = parseInt(bgY);

    let map = mapForest;

    // parse inputs
    let moveX = 0;
    let moveY = 0;

    if (actionsActive.includes("left")) {
      moveX = moveX + 1;
    }
    if (actionsActive.includes("right")) {
      moveX = moveX - 1;
    }

    if (actionsActive.includes("down")) {
      moveY = moveY - 1;
    }
    if (actionsActive.includes("up")) {
      moveY = moveY + 1;
    }

    // add movement
    bgXInt = bgXInt + moveX;
    bgYInt = bgYInt + moveY;

    const widthMin = 0;
    const widthMax = map.width - elPlayer.clientWidth / 2;

    const heightMin = 0;
    const heightMax = map.height - elPlayer.clientHeight / 2;

    if (bgXInt < widthMin) bgXInt = widthMin;
    if (bgXInt > widthMax) bgXInt = widthMax;

    if (bgYInt < heightMin) bgYInt = heightMin;
    if (bgYInt > heightMax) bgYInt = heightMax;

    elPlayer.style.backgroundPositionX = `${bgXInt}px`;
    elPlayer.style.backgroundPositionY = `${bgYInt}px`;
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
    class="m-4 border-b-8 border-red-900 bg-rose-600 px-4 py-2 font-extrabold text-white shadow-md shadow-red-900"
    >start game</button
  >
</form>

<div id="game-window" bind:this={elGameWindow} class="flex flex-col bg-gray-800">
  <div id="top-ui" class="z-50 flex h-max flex-row gap-2 bg-rose-950">
    <img src={mapForest.imagePath} alt="Minimap of area {mapForest.name}" class="my-1 size-8" />

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

    <span class="text-cyan-500">X: {elPlayer?.style.backgroundPositionX ?? ""}</span>
    <span class="text-cyan-500">Y: {elPlayer?.style.backgroundPositionY ?? ""}</span>

    <span class="text-cyan-500">actions: {actionsActive}</span>
  </div>

  <div
    bind:this={elPlayer}
    id="player"
    class="z-10 grid h-full w-full grid-cols-1 items-center bg-purple-900"
  >
    <div id="player-sprite" class="mx-auto size-12 bg-blue-800">
      <span class="-ml-1 text-5xl">{player.spriteEmoji}</span>
      <span class="sr-only">{player.name}</span>
    </div>

    <!-- {#each player.weapons as weapon} -->
    <!--   <div class="absolute z-20"> -->
    <!--     <span>{weapon.spriteEmoji}</span> -->
    <!--     <span class="sr-only">{weapon.name}</span> -->
    <!--   </div> -->
    <!-- {/each} -->
  </div>

  <!-- {#each enemiesAll as enemy} -->
  <!--   <div class="z-0 m-auto"> -->
  <!--     <span>{enemy.spriteEmoji}</span> -->
  <!--     <span class="sr-only">{enemy.name}</span> -->
  <!---->
  <!--     {#each enemy.weapons as weapon} -->
  <!--       <div class="absolute"> -->
  <!--         <span>{weapon.spriteEmoji}</span> -->
  <!--         <span class="sr-only">{weapon.name}</span> -->
  <!--       </div> -->
  <!--     {/each} -->
  <!--   </div> -->
  <!-- {/each} -->
</div>
