// The run itself: the turkey, the chasing farmer, the hazards and pickups,
// the scrolling farm, and every rule that turns a stumble into a life lost.
// Nothing here draws; render.js reads this state and paints it.
import { CONFIG, stageAt } from './config.js';
import { clamp, makeRng, pick, range } from './random.js';

export const OBSTACLE_DEFS = {
  fence: { width: 46, height: 56, score: 20 },
  oven: { width: 74, height: 78, score: 40 },
  knife: { width: 30, height: 88, score: 40 },
};

export function createWorld(seed = 20261127) {
  const rng = makeRng(seed);
  return {
    seed,
    rng,
    time: 0,
    distance: 0, // metres run
    speed: CONFIG.baseSpeed,
    score: 0,
    lives: CONFIG.startLives,
    status: 'title', // title | playing | paused | caught | escaped
    turkey: {
      x: 210,
      y: CONFIG.groundY,
      vy: 0,
      width: 64,
      height: 56,
      onGround: true,
      jumpsUsed: 0,
      dashTime: 0,
      dashCooldown: 0,
      ducking: false,
      stumbleTime: 0,
      invincibleTime: 0,
      featherTime: 0,
      runPhase: 0,
      flap: 0,
    },
    farmer: {
      gap: CONFIG.farmerBaseGap,
      runPhase: 0,
      reach: 0, // 0..1, how far his grabbing arm is stretched
      grumble: 0,
    },
    obstacles: [],
    pickups: [],
    particles: [],
    floats: [], // floating score text
    scenery: makeScenery(rng),
    nextSpawnX: 900,
    stageName: STAGES_FIRST,
    bestCombo: 0,
    combo: 0,
    corn: 0,
    feathers: 0,
    jumps: 0,
    dashes: 0,
    cause: '',
  };
}

const STAGES_FIRST = 'The Farmyard';

function makeScenery(rng) {
  // Fixed decorations along the road: barns, pumpkins, trees, hay bales.
  const items = [];
  let x = 120;
  while (x < 4200) {
    const kind = pick(rng, ['pumpkin', 'hay', 'tree', 'tree', 'bush', 'fencepost']);
    items.push({ kind, x, jitter: range(rng, -14, 14), size: range(rng, 0.8, 1.3) });
    x += range(rng, 170, 420);
  }
  // The barn and the farmhouse sit near the start, before the run leaves home.
  items.push({ kind: 'barn', x: 60, jitter: 0, size: 1 });
  items.push({ kind: 'farmhouse', x: 560, jitter: 0, size: 1 });
  return items;
}

export function resetWorld(world, seed) {
  const fresh = createWorld(seed ?? world.seed);
  Object.keys(fresh).forEach((key) => {
    world[key] = fresh[key];
  });
  world.status = 'playing';
}

function spawnObstacle(world, x) {
  const stage = stageAt(world.distance);
  const kind = pick(world.rng, stage.hazards);
  const def = OBSTACLE_DEFS[kind];
  const obstacle = {
    kind,
    x,
    y: CONFIG.groundY,
    width: def.width,
    height: def.height,
    passed: false,
    swing: world.rng() * Math.PI * 2,
    bob: world.rng() * Math.PI * 2,
  };
  world.obstacles.push(obstacle);
  // Knives sometimes travel in pairs, ovens sometimes guard a fence.
  if (kind === 'knife' && world.rng() < 0.12) {
    world.obstacles.push({
      kind: 'knife',
      x: x + 110,
      y: CONFIG.groundY,
      width: def.width,
      height: def.height,
      passed: false,
      swing: world.rng() * Math.PI * 2,
      bob: 0,
    });
  }
  if (kind === 'oven' && world.rng() < 0.2) {
    world.obstacles.push({
      kind: 'fence',
      x: x + 110,
      y: CONFIG.groundY,
      width: OBSTACLE_DEFS.fence.width,
      height: OBSTACLE_DEFS.fence.height,
      passed: false,
      swing: 0,
      bob: 0,
    });
  }
}

function spawnPickup(world, x) {
  const stage = stageAt(world.distance);
  if (world.rng() > stage.pickups) return;
  const kind = world.rng() < 0.14 ? 'feather' : 'corn';
  const high = world.rng() < 0.45;
  world.pickups.push({
    kind,
    x,
    y: high ? CONFIG.groundY - 132 : CONFIG.groundY - 58,
    taken: false,
    bob: world.rng() * Math.PI * 2,
  });
  // Corn comes in little arcs of three when the road is clear.
  if (kind === 'corn' && world.rng() < 0.5) {
    world.pickups.push({ kind, x: x + 44, y: CONFIG.groundY - 96, taken: false, bob: 0 });
    world.pickups.push({ kind, x: x + 88, y: CONFIG.groundY - 58, taken: false, bob: 1.2 });
  }
}

export function startJump(world, audio) {
  const t = world.turkey;
  if (t.dashTime > 0) return;
  if (t.onGround) {
    t.vy = CONFIG.jumpVelocity;
    t.onGround = false;
    t.jumpsUsed = 1;
    t.flap = 1;
    world.jumps += 1;
    audio.jump();
  } else if (t.jumpsUsed < 2) {
    t.vy = CONFIG.doubleJumpVelocity;
    t.jumpsUsed = 2;
    t.flap = 1;
    world.jumps += 1;
    audio.doubleJump();
    burst(world, t.x + 20, t.y + 40, 6, '#fff3d6');
  }
}

export function startDash(world, audio) {
  const t = world.turkey;
  if (t.dashCooldown > 0 || t.dashTime > 0) return;
  t.dashTime = CONFIG.dashTime;
  t.dashCooldown = CONFIG.dashCooldown;
  world.dashes += 1;
  audio.dash();
  burst(world, t.x - 10, t.y + 30, 8, '#ffd23f');
}

export function burst(world, x, y, count, color) {
  for (let i = 0; i < count; i += 1) {
    world.particles.push({
      x,
      y,
      vx: range(world.rng, -120, 120),
      vy: range(world.rng, -180, 40),
      life: range(world.rng, 0.3, 0.7),
      maxLife: 0.7,
      color,
      size: range(world.rng, 3, 7),
    });
  }
}

function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color, life: 1 });
}

function hitObstacle(world, obstacle, audio) {
  const t = world.turkey;
  if (t.invincibleTime > 0 || t.featherTime > 0) {
    // A golden feather smashes straight through a hazard.
    obstacle.passed = true;
    world.score += OBSTACLE_DEFS[obstacle.kind].score * 2;
    addFloat(world, obstacle.x, obstacle.y - 90, `SMASH +${OBSTACLE_DEFS[obstacle.kind].score * 2}`, '#ffd23f');
    burst(world, obstacle.x, obstacle.y - 40, 14, '#ffd23f');
    audio.feather();
    return;
  }
  world.lives -= 1;
  world.combo = 0;
  t.invincibleTime = CONFIG.invincibleTime;
  t.stumbleTime = 0.6;
  world.farmer.gap = Math.max(40, world.farmer.gap - 70);
  world.farmer.reach = 1;
  burst(world, t.x + 30, t.y + 20, 16, '#ff4d2e');
  audio.hit();
  if (world.lives <= 0) {
    world.status = 'caught';
    world.cause = obstacle.kind === 'oven' ? 'roasted' : obstacle.kind === 'knife' ? 'carved' : 'tripped';
    audio.caught();
    audio.stopMusic();
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function updateWorld(world, dt, audio) {
  const t = world.turkey;
  const f = world.farmer;
  world.time += dt;

  // Speed grows with distance; a stumble or a dash bends it briefly.
  const targetSpeed = Math.min(
    CONFIG.maxSpeed,
    CONFIG.baseSpeed + world.distance * CONFIG.speedRamp,
  );
  const featherBoost = t.featherTime > 0 ? 1.18 : 1;
  const stumbleFactor = t.stumbleTime > 0 ? CONFIG.stumbleSlow : 1;
  const dashFactor = t.dashTime > 0 ? 1.6 : 1;
  world.speed = targetSpeed * featherBoost * stumbleFactor * dashFactor;

  const dx = world.speed * dt;
  world.distance += dx / 14; // 14 px ≈ 1 metre
  t.runPhase += dt * (6 + world.speed / 60);
  f.runPhase += dt * (7 + world.speed / 55);
  f.reach = Math.max(0, f.reach - dt * 1.6);

  // Timers.
  t.dashTime = Math.max(0, t.dashTime - dt);
  t.dashCooldown = Math.max(0, t.dashCooldown - dt);
  t.stumbleTime = Math.max(0, t.stumbleTime - dt);
  t.invincibleTime = Math.max(0, t.invincibleTime - dt);
  t.featherTime = Math.max(0, t.featherTime - dt);
  t.flap = Math.max(0, t.flap - dt * 2.4);

  // Vertical motion.
  t.vy += CONFIG.gravity * dt;
  t.y += t.vy * dt;
  if (t.y >= CONFIG.groundY) {
    t.y = CONFIG.groundY;
    t.vy = 0;
    t.onGround = true;
    t.jumpsUsed = 0;
  } else {
    t.onGround = false;
  }
  t.ducking = !t.onGround ? false : t.ducking;

  // The farmer gains on every stumble and falls behind on every clean stretch.
  if (t.stumbleTime > 0) {
    f.gap -= CONFIG.farmerCloseRate * dt;
  } else {
    f.gap += CONFIG.farmerFallBack * dt * (world.speed / CONFIG.baseSpeed);
  }
  f.gap = clamp(f.gap, 0, 320);
  if (f.gap <= CONFIG.farmerCatchGap && world.status === 'playing') {
    world.status = 'caught';
    world.cause = 'caught';
    world.lives = 0;
    audio.caught();
    audio.stopMusic();
    return;
  }

  // Spawn hazards and pickups ahead of the screen.
  world.nextSpawnX -= dx;
  if (world.nextSpawnX < CONFIG.canvasWidth + 80) {
    const stage = stageAt(world.distance);
    // Never pack hazards tighter than one jump's landing room: the gap must
    // leave space to land after clearing the previous obstacle.
    const gap = Math.max(
      range(world.rng, stage.spawnGap[0], stage.spawnGap[1]),
      world.speed * 0.85,
    );
    spawnObstacle(world, CONFIG.canvasWidth + 60);
    spawnPickup(world, CONFIG.canvasWidth + 60 + gap * 0.55);
    world.nextSpawnX = CONFIG.canvasWidth + 60 + gap;
  }

  const turkeyBox = {
    x: t.x,
    y: t.y - (t.ducking ? 40 : t.height),
    width: t.width,
    height: t.ducking ? 40 : t.height,
  };

  // Move, collide and score the obstacles.
  for (const obstacle of world.obstacles) {
    obstacle.x -= dx;
    obstacle.swing += dt * 3;
    if (!obstacle.passed && obstacle.x + obstacle.width < t.x) {
      obstacle.passed = true;
      world.score += OBSTACLE_DEFS[obstacle.kind].score;
      world.combo += 1;
      world.bestCombo = Math.max(world.bestCombo, world.combo);
      addFloat(world, t.x + 40, t.y - 80, `+${OBSTACLE_DEFS[obstacle.kind].score}`, '#fff3d6');
    }
    if (world.status !== 'playing') continue;
    const box = {
      x: obstacle.x + (obstacle.kind === 'knife' ? 6 : 4),
      y: obstacle.y - obstacle.height + (obstacle.kind === 'knife' ? 8 : 0),
      width: obstacle.width - (obstacle.kind === 'knife' ? 12 : 8),
      height: obstacle.height - (obstacle.kind === 'knife' ? 8 : 0),
    };
    // Dashing slips under a swinging knife; jumping clears fences and ovens.
    // An obstacle already passed (or smashed) cannot hit twice.
    const duckingUnderKnife = obstacle.kind === 'knife' && t.dashTime > 0;
    if (!obstacle.passed && !duckingUnderKnife && overlaps(turkeyBox, box)) {
      hitObstacle(world, obstacle, audio);
      obstacle.passed = true;
    }
  }
  world.obstacles = world.obstacles.filter((o) => o.x > -160);

  // Pickups drift toward a nearby turkey and are collected on touch.
  for (const pickup of world.pickups) {
    pickup.x -= dx;
    pickup.bob += dt * 4;
    const px = pickup.x;
    const py = pickup.y + Math.sin(pickup.bob) * 5;
    const nearX = Math.abs(px - (t.x + 30)) < CONFIG.pickupMagnet;
    const nearY = Math.abs(py - (t.y - 28)) < 80;
    if (nearX && nearY && !pickup.taken) {
      pickup.x += (t.x + 30 - pickup.x) * dt * 10;
    }
    if (!pickup.taken && overlaps(turkeyBox, { x: px - 16, y: py - 16, width: 32, height: 32 })) {
      pickup.taken = true;
      if (pickup.kind === 'corn') {
        world.score += CONFIG.cornScore;
        world.corn += 1;
        addFloat(world, px, py - 24, `+${CONFIG.cornScore}`, '#ffd23f');
        audio.pickup();
      } else {
        world.score += CONFIG.featherScore;
        world.feathers += 1;
        t.featherTime = CONFIG.featherBoost;
        t.invincibleTime = Math.max(t.invincibleTime, CONFIG.featherBoost);
        addFloat(world, px, py - 24, `GOLDEN FEATHER +${CONFIG.featherScore}`, '#ffd23f');
        burst(world, px, py, 14, '#f2c14e');
        audio.feather();
      }
    }
  }
  world.pickups = world.pickups.filter((p) => p.x > -60 && !p.taken);

  // Particles and floating text fade out.
  for (const p of world.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 500 * dt;
    p.life -= dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  for (const fl of world.floats) {
    fl.y -= 42 * dt;
    fl.life -= dt * 0.9;
  }
  world.floats = world.floats.filter((fl) => fl.life > 0);

  // The woods: reaching them ends the run as an escape.
  if (world.distance >= CONFIG.escapeDistance) {
    world.status = 'escaped';
    world.score += 500;
    audio.escaped();
    audio.stopMusic();
    burst(world, t.x + 30, t.y - 20, 30, '#7ddb4f');
  }
}
