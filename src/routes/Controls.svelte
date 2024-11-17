<script lang="ts">
  interface GameAction {
    actionName: string;
    keyBindings: string[];
  }

  let {
    actionsActive = $bindable([]),
    isPaused = $bindable(false),
  }: {
    actionsActive: string[];
    isPaused: boolean;
  } = $props();

  const controlKeys: GameAction[] = [
    {
      actionName: "up",
      keyBindings: ["w", "ArrowUp"],
    },
    {
      actionName: "left",
      keyBindings: ["a", "ArrowLeft"],
    },
    {
      actionName: "down",
      keyBindings: ["s", "ArrowDown"],
    },
    {
      actionName: "right",
      keyBindings: ["d", "ArrowRight"],
    },
    {
      actionName: "pause",
      keyBindings: ["p"],
    },
  ];
  const showBindings = false;

  function onkeydown(event: KeyboardEvent) {
    const key = event.key;
    // console.log(key);

    for (const { actionName, keyBindings } of controlKeys) {
      if (keyBindings.includes(key)) {
        // console.log("down", actionName, key);
        event.preventDefault();

        if (actionsActive.includes(actionName)) return;
        actionsActive.push(actionName);
      }
    }
  }

  function onkeyup(event: KeyboardEvent) {
    const key = event.key;
    // console.log(key);

    for (const { actionName, keyBindings } of controlKeys) {
      if (keyBindings.includes(key)) {
        // console.log("up", actionName, key);
        event.preventDefault();

        if (!actionsActive.includes(actionName)) return;
        actionsActive = actionsActive.filter((action) => action !== actionName);

        // pause on key up
        if (actionName === "pause") isPaused = !isPaused;
      }
    }
  }
</script>

<svelte:window {onkeydown} {onkeyup} />

{#if showBindings}
  <div>
    <p>Keybindings</p>

    <ul>
      {#each controlKeys as { actionName, keyBindings }}
        <li>
          {actionName}:

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
