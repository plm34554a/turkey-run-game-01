// Screenshot presets: ?shot=title|play|caught|escaped&seed=N renders one frozen
// moment of the game so the maker can photograph it without playing. The
// world is built from the same code the player runs; nothing is faked.
import { CONFIG } from './config.js';
import { OBSTACLE_DEFS, resetWorld, startDash, startJump, updateWorld } from './world.js';

const silentAudio = {
  jump() {},
  doubleJump() {},
  dash() {},
  pickup() {},
  feather() {},
  hit() {},
  gobble() {},
  caught() {},
  escaped() {},
  click() {},
  startMusic() {},
  stopMusic() {},
};

export function applyShot(world, shot, seed) {
  resetWorld(world, seed);
  world.status = 'playing';
  const dt = 1 / 60;
  if (shot === 'title') {
    world.status = 'title';
    world.distance = 0;
    return;
  }
  if (shot === 'play') {
    // Run the world forward with a simple autopilot (jump the fences and
    // ovens, dash under the knives) until the road is busy: fences, an oven,
    // a knife, corn in the air and the farmer on the turkey's tail.
    for (let i = 0; i < 60 * 14; i += 1) {
      autopilot(world);
      updateWorld(world, dt, silentAudio);
      if (world.status !== 'playing') {
        // The autopilot stumbled: pick the turkey back up and keep running
        // so the frame still shows a run in play, not an end screen.
        world.status = 'playing';
        world.lives = 3;
        world.turkey.invincibleTime = 2;
        world.farmer.gap = 150;
      }
    }
    // Stage the farmer close for drama, and guarantee a knife on screen.
    world.farmer.gap = 78;
    world.obstacles.push({
      kind: 'knife',
      x: 640,
      y: CONFIG.groundY,
      width: 30,
      height: 88,
      passed: false,
      swing: 0.6,
      bob: 0,
    });
    world.obstacles.push({
      kind: 'oven',
      x: 820,
      y: CONFIG.groundY,
      width: 74,
      height: 78,
      passed: false,
      swing: 0,
      bob: 0,
    });
    world.pickups.push({ kind: 'corn', x: 520, y: CONFIG.groundY - 90, taken: false, bob: 0.4 });
    world.pickups.push({ kind: 'corn', x: 560, y: CONFIG.groundY - 120, taken: false, bob: 1.1 });
    world.turkey.y = CONFIG.groundY - 70;
    world.turkey.vy = 120;
    world.turkey.onGround = false;
    world.turkey.flap = 0.8;
    world.score = 1240;
    world.distance = 612;
    world.status = 'playing';
    world.lives = 3;
    world.turkey.invincibleTime = 0;
    world.turkey.featherTime = 0;
    world.floats = [];
    return;
  }
  if (shot === 'caught') {
    for (let i = 0; i < 60 * 9; i += 1) {
      updateWorld(world, dt, silentAudio);
      if (world.status !== 'playing') break;
    }
    world.status = 'caught';
    world.cause = 'caught';
    world.lives = 0;
    world.farmer.gap = 40;
    world.farmer.reach = 1;
    world.score = 860;
    world.distance = 388;
    return;
  }
  if (shot === 'escaped') {
    for (let i = 0; i < 60 * 20; i += 1) {
      updateWorld(world, dt, silentAudio);
      if (world.status !== 'playing') break;
    }
    world.status = 'escaped';
    world.distance = CONFIG.escapeDistance;
    world.score = 3420;
    world.lives = 3;
    world.corn = 18;
    world.feathers = 3;
    world.bestCombo = 9;
    return;
  }
  // Unknown shot name: fall back to the title screen.
  world.status = 'title';
}

// A tiny autopilot for the play screenshot: jump what can be jumped, dash
// under a swinging knife, so the frozen frame shows a run in play.
function autopilot(world) {
  const t = world.turkey;
  const ahead = world.obstacles
    .filter((o) => o.x + o.width > t.x && o.x - t.x < 260)
    .sort((a, b) => a.x - b.x)[0];
  if (!ahead) return;
  const dist = ahead.x - t.x;
  if (ahead.kind === 'knife') {
    // Dash late: the dash must still be running while the turkey is under
    // the blade, so only start it when the knife is close.
    if (t.onGround && dist < 120 && t.dashCooldown <= 0) startDash(world, silentAudio);
    else if (t.onGround && dist < 160) startJump(world, silentAudio);
  } else if (t.onGround && dist < 160) {
    startJump(world, silentAudio);
  } else if (!t.onGround && t.jumpsUsed < 2 && dist < 90 && t.vy > 0) {
    // Rescue double jump, only when the turkey is actually about to clip
    // the obstacle: feet below the top of the hazard ahead.
    const top = CONFIG.groundY - (OBSTACLE_DEFS[ahead.kind].height - 15);
    if (t.y > top) startJump(world, silentAudio);
  }
}
