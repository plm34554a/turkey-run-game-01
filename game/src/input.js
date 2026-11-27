// Keyboard and mouse input, shared by the menu screens and the run.
// Keys are edge-triggered through `pressed` so a jump fires once per press,
// and the pointer position is kept in canvas coordinates for button clicks.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const pointer = { x: 0, y: 0, down: false, clicked: false };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  const keyMap = {
    Space: 'jump',
    ArrowUp: 'jump',
    KeyW: 'jump',
    ArrowDown: 'duck',
    KeyS: 'duck',
    ArrowRight: 'dash',
    ShiftLeft: 'dash',
    ShiftRight: 'dash',
    KeyX: 'dash',
    KeyP: 'pause',
    KeyR: 'restart',
    Enter: 'confirm',
    Escape: 'pause',
    KeyM: 'mute',
  };

  function onKeyDown(event) {
    const action = keyMap[event.code];
    if (!action) return;
    if (event.code === 'Space' || event.code.startsWith('Arrow')) {
      event.preventDefault();
    }
    if (!event.repeat) {
      keys.add(action);
      pressed.add(action);
    }
  }

  function onKeyUp(event) {
    const action = keyMap[event.code];
    if (action) keys.delete(action);
  }

  function onPointerMove(event) {
    const point = canvasPoint(event);
    pointer.x = point.x;
    pointer.y = point.y;
  }

  function onPointerDown(event) {
    const point = canvasPoint(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.down = true;
    pointer.clicked = true;
  }

  function onPointerUp() {
    pointer.down = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    keys,
    pointer,
    // True once, on the frame the action was pressed.
    wasPressed(action) {
      return pressed.has(action);
    },
    isDown(action) {
      return keys.has(action);
    },
    // Call at the end of every frame so edges do not linger.
    endFrame() {
      pressed.clear();
      pointer.clicked = false;
    },
  };
}
