<script lang="ts">
  // https://coherent-labs.com/blog/uitutorials/virtual-joystick/
  let {
    joystickAngle = $bindable(0),
    joystickTiltRatio = $bindable(0),
  }: {
    joystickAngle: number; // degrees
    joystickTiltRatio: number; // 0 to 1
  } = $props();

  const radiusJoystick = 60; // px

  // Pointer Events API provides hardware-agnostic notification from pointing devices including Mouse, Touch, pen/stylus.
  // Events fired on Document, HTMLElement.
  let isPointerDown = $state(false);

  let pointerDownX = $state(0);
  let pointerDownY = $state(0);

  let pointerMoveX = $state(0);
  let pointerMoveY = $state(0);

  let distanceX = $derived(pointerMoveX - pointerDownX);
  let distanceY = $derived(pointerMoveY - pointerDownY);

  let distance = $derived(Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2)));
  let distanceClamped = $derived(Math.min(distance, radiusJoystick));

  $effect(() => {
    // reset to defaults
    if (!isPointerDown) {
      joystickAngle = 0;
      joystickTiltRatio = 0;
      return;
    }

    joystickAngle = Math.atan2(distanceY, distanceX);
    joystickTiltRatio = distanceClamped / radiusJoystick;
  });

  function onpointerdown(event: PointerEvent) {
    if (!event.target) return;
    const el = event.target as HTMLElement;

    // if not clicking in the div
    if (el.id !== "joystick") return;

    isPointerDown = true;

    pointerDownX = event.x;
    pointerDownY = event.y;

    pointerMoveX = event.x;
    pointerMoveY = event.y;
  }

  function onpointermove(event: PointerEvent) {
    // if not dragging
    if (isPointerDown === false) return;

    pointerMoveX = event.x;
    pointerMoveY = event.y;
  }

  function onpointerup() {
    isPointerDown = false;

    pointerDownX = 0;
    pointerDownY = 0;

    pointerMoveX = 0;
    pointerMoveY = 0;
  }
</script>

<svelte:window {onpointerdown} {onpointermove} {onpointerup} />

<!-- touch-none for pointermove touch events to not get hijacked by browser -->
<div id="joystick" class="absolute left-0 top-0 z-40 h-screen w-screen touch-none overflow-clip">
  <div
    id="joystick-base"
    class="absolute rounded-full bg-rose-950/50"
    class:hidden={!isPointerDown}
    style:left="{pointerDownX - radiusJoystick}px"
    style:top="{pointerDownY - radiusJoystick}px"
    style:width="{radiusJoystick * 2}px"
    style:height="{radiusJoystick * 2}px"
    style:transform="rotate({joystickAngle}rad)"
  >
    <div
      id="joystick-lever"
      class="relative top-1/4 h-1/2 w-1/2 rounded-full bg-rose-500"
      style:left="{radiusJoystick / 2 + distanceClamped}px"
    ></div>
  </div>
</div>
