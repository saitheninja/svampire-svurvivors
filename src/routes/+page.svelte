<script lang="ts">
  import Controls from "./Controls.svelte";

  }

  }

  // timer
  let start = 0;
  let timerMinutes = 0;
  let timerSeconds = 0;

  // fps
  let timestampPrev = 0;
  let fps = 0;

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

<Controls />

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

<form onsubmit={() => window.requestAnimationFrame(gameLoop)}>
  <button>start game</button>
</form>
  <div id="top-ui">
    <time
      id="timer"
      datetime="PT{timerMinutes}M{timerSeconds}S"
      class="flex flex-row text-blue-500"
    >
      <span>{timerMinutes.toString().length === 1 ? "0" : ""}{timerMinutes}</span>
      <span class="mx-0">:</span>
      <span>{timerSeconds.toString().length === 1 ? "0" : ""}{timerSeconds}</span>
    </time>

    <span class="text-blue-500">{fps} fps</span>
  </div>
  </div>
