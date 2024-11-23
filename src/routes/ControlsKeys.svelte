<script lang="ts">
  interface GameAction {
    actionName: string;
    keyBindings: string[];
  }

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

  /*
    Parse actions to calc direction.
    Positive direction right, down.
    Set bindable props to return data to parent.
  */
  let {
    actionsActive = $bindable([]),
    isPaused = $bindable(false),
    dirX = $bindable(0),
    dirY = $bindable(0),
  }: {
    actionsActive: string[];
    isPaused: boolean;
    dirX: number;
    dirY: number;
  } = $props();

  $effect(() => {
    let x = 0;
    let y = 0;

    if (actionsActive.includes("left")) x -= 1;
    if (actionsActive.includes("right")) x += 1;

    if (actionsActive.includes("up")) y -= 1;
    if (actionsActive.includes("down")) y += 1;

    dirX = x;
    dirY = y;
  });

  function onkeydown(event: KeyboardEvent) {
    for (const { actionName, keyBindings } of controlKeys) {
      // if key not bound in action, go to next
      if (!keyBindings.includes(event.key)) continue;

      event.preventDefault();

      // already in `actionsActive`
      if (actionsActive.includes(actionName)) return;

      // add to `actionsActive`
      actionsActive.push(actionName);
    }
  }

  function onkeyup(event: KeyboardEvent) {
    for (const { actionName, keyBindings } of controlKeys) {
      if (!keyBindings.includes(event.key)) continue;

      event.preventDefault();

      // already removed from `actionsActive`
      if (!actionsActive.includes(actionName)) return;

      // remove from `actionsActive`
      actionsActive = actionsActive.filter((action) => action !== actionName);

      // `pause` triggered on key up
      if (actionName === "pause") isPaused = !isPaused;
    }
  }
</script>

<svelte:window {onkeydown} {onkeyup} />

{#if showBindings}
  <div id="bindings">
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
