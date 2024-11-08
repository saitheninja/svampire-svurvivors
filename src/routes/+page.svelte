<script lang="ts">
  let start = 0;
  let timestampPrev = 0;
  let timerMinutes = 0;
  let timerSeconds = 0;

  function draw(timestamp: number) {
    let secondsPassed = (timestamp - timestampPrev) / 1000;
    timestampPrev = timestamp;
    const fps = Math.round(1 / secondsPassed);
    console.log(fps);

    if (start === 0) start = timestamp;

    const elapsed = timestamp - start;
    const secondsSinceStart = Math.floor(elapsed / 1000);

    timerMinutes = Math.floor(secondsSinceStart / 60);
    timerSeconds = secondsSinceStart % 60;

    console.log(start, timestamp, elapsed, timerMinutes, timerSeconds);
  }

  function gameLoop(timestamp: number) {
    // timestamp: DOMHighResTimeStamp
    // The DOMHighResTimeStamp type is a double and is used to store a time value in milliseconds.
    draw(timestamp);

    window.requestAnimationFrame(gameLoop);
  }
</script>

<div>
  <h1>Svampire Svurvivors</h1>

  <p>
    It's like <a
      href="https://store.steampowered.com/app/1794680/Vampire_Survivors/"
      class="underline">Vampire Survivors</a
    >, but built with Svelte, for the web.
  </p>

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

<form onsubmit={() => window.requestAnimationFrame(gameLoop)}>
  <button>start game</button>
</form>
