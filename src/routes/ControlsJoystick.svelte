<script lang="ts">
  let {
    joystickAngle = $bindable(0),
    joystickTiltRatio = $bindable(0),
  }: {
    joystickAngle: number; // degrees
    joystickTiltRatio: number; // 0 to 1
  } = $props();

  const radiusJoystick = 80; // px

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
  let angleJoystick = $derived(Math.atan2(distanceY, distanceX) * (180 / Math.PI));

  $effect(() => {
    if (!isPointerDown) {
      joystickAngle = 0;
      joystickTiltRatio = 0;
      return;
    }

    joystickAngle = angleJoystick;
    joystickTiltRatio = distanceClamped / radiusJoystick;
  });

  function onpointerdown(event: PointerEvent) {
    // if (!event.target) return;
    // const el = event.target as HTMLElement;

    // if not clicking in world div
    // if (el.id !== "world") return;

    isPointerDown = true;

    pointerDownX = event.x;
    pointerDownY = event.y;

    pointerMoveX = event.x;
    pointerMoveY = event.y;
  }

  function onpointermove(event: PointerEvent) {
    // not dragging
    if (isPointerDown === false) return;

    pointerMoveX = event.offsetX;
    pointerMoveY = event.offsetY;
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

<!-- touch-none for pointermove touch events to not get hijacked -->
<div id="joystick" class="absolute z-50 h-full w-full touch-none">
  <div
    id="joystick-base"
    class="absolute rounded-full bg-teal-900/50"
    class:hidden={!isPointerDown}
    style="
  top: {pointerDownY - radiusJoystick}px;
  left: {pointerDownX - radiusJoystick}px;
  width: {radiusJoystick * 2}px;
  height: {radiusJoystick * 2}px;
  transform: rotate({angleJoystick}deg);
  "
  >
    <div
      id="joystick-lever"
      class="relative top-1/4 h-1/2 w-1/2 rounded-full bg-teal-500"
      style="left: {radiusJoystick / 2 + distanceClamped}px;"
    >
      {distanceClamped}
      {Math.round(angleJoystick)}
    </div>
  </div>
</div>
