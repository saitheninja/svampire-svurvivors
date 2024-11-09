<script lang="ts">
  const controlKeys = {
    up: ["w", "ArrowUp"],
    left: ["a", "ArrowLeft"],
    down: ["s", "ArrowDown"],
    right: ["d", "ArrowRight"],
  };

  function onkeydown(event: KeyboardEvent) {
    const key = event.key;
    // console.log(key);

    if (controlKeys.up.includes(key)) {
      console.log("up");
      event.preventDefault();
    }
    if (controlKeys.down.includes(key)) {
      console.log("down");
      event.preventDefault();
    }
    if (controlKeys.left.includes(key)) {
      console.log("left");
      event.preventDefault();
    }
    if (controlKeys.right.includes(key)) {
      console.log("right");
      event.preventDefault();
    }
  }

  function onkeyup(event: KeyboardEvent) {
    const key = event.key;

    // if (!keys.includes(key)) return;

    // event.preventDefault();

    if (controlKeys.up.includes(key)) {
      //
    }
    if (controlKeys.down.includes(key)) {
      //
    }
    if (controlKeys.left.includes(key)) {
      //
    }
    if (controlKeys.right.includes(key)) {
      //
    }
  }
</script>

<svelte:window {onkeydown} {onkeyup} />
