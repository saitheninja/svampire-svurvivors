<script lang="ts">
  interface GameAction {
    action: string;
    keyBindings: string[];
  }

  export let controlKeys: GameAction[] = [
    {
      action: "up",
      keyBindings: ["w", "ArrowUp"],
    },
    {
      action: "left",
      keyBindings: ["a", "ArrowLeft"],
    },
    {
      action: "down",
      keyBindings: ["s", "ArrowDown"],
    },
    {
      action: "right",
      keyBindings: ["d", "ArrowRight"],
    },
  ];

  export let showBindings = true;

  function onkeydown(event: KeyboardEvent) {
    const key = event.key;
    // console.log(key);

    for (const { action, keyBindings } of controlKeys) {
      for (const binding of keyBindings) {
        if (binding === key) {
          console.log("down", action, binding);
          event.preventDefault();
        }
      }
    }
  }

  function onkeyup(event: KeyboardEvent) {
    const key = event.key;
    // console.log(key);

    for (const { action, keyBindings } of controlKeys) {
      for (const binding of keyBindings) {
        if (binding === key) {
          console.log("up", action, binding);
          event.preventDefault();
        }
      }
    }
  }
</script>

<svelte:window {onkeydown} {onkeyup} />

{#if showBindings}
  <div>
    <p>Keybindings</p>

    <ul>
      {#each controlKeys as { action, keyBindings }}
        <li>
          {action}:

          <ul>
            {#each keyBindings as binding}
              <li>{binding}</li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
  </div>
{/if}
