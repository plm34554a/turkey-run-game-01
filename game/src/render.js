// Every pixel of Gobble Run is drawn here with canvas vector art: the turkey,
// the farmer, the farm, the oven and the carving knife, plus the HUD and the
// title and end screens. One coherent autumn palette from config.js.
import { CONFIG, PALETTE, stageAt, stageProgress } from './config.js';
import { clamp } from './random.js';

export const BUTTONS = {
  title: [],
  end: [],
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawButton(ctx, button, hover) {
  ctx.save();
  ctx.fillStyle = hover ? '#ff8a3c' : '#e8641f';
  roundRect(ctx, button.x, button.y, button.w, button.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#7a2e05';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
  ctx.restore();
}

export function drawButtonList(ctx, buttons, pointer) {
  for (const button of buttons) {
    const hover =
      pointer.x >= button.x &&
      pointer.x <= button.x + button.w &&
      pointer.y >= button.y &&
      pointer.y <= button.y + button.h;
    drawButton(ctx, button, hover);
  }
}

export function buttonAt(buttons, x, y) {
  return buttons.find((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) ?? null;
}

// ---------------------------------------------------------------- scenery

function drawSky(ctx, world) {
  const stage = stageAt(world.distance);
  const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.canvasHeight);
  grad.addColorStop(0, stage.sky[0]);
  grad.addColorStop(0.55, stage.sky[1]);
  grad.addColorStop(1, stage.sky[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

  // Low autumn sun with a soft halo.
  const sunX = 790;
  const sunY = 92;
  const halo = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 90);
  halo.addColorStop(0, 'rgba(255, 243, 196, 0.95)');
  halo.addColorStop(1, 'rgba(255, 243, 196, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 90, sunY - 90, 180, 180);
  ctx.fillStyle = PALETTE.sun;
  ellipse(ctx, sunX, sunY, 34, 34);

  // Drifting clouds.
  ctx.fillStyle = 'rgba(255, 244, 224, 0.85)';
  const cloudOffset = (world.distance * 6) % 1100;
  for (const [cx, cy, s] of [[180, 70, 1], [520, 46, 0.7], [860, 120, 0.85]]) {
    const x = ((cx - cloudOffset) % 1100 + 1100) % 1100 - 70;
    ellipse(ctx, x, cy, 46 * s, 16 * s);
    ellipse(ctx, x + 30 * s, cy + 6, 34 * s, 13 * s);
    ellipse(ctx, x - 32 * s, cy + 7, 30 * s, 12 * s);
  }
}

function drawHills(ctx, world) {
  const stage = stageAt(world.distance);
  const far = (world.distance * 3) % 960;
  ctx.fillStyle = stage.hill;
  ctx.beginPath();
  ctx.moveTo(0, CONFIG.groundY - 40);
  for (let x = 0; x <= 960; x += 60) {
    const hillX = x - far;
    ctx.lineTo(hillX, CONFIG.groundY - 96 - Math.sin((x + far) * 0.011) * 34);
  }
  ctx.lineTo(960, CONFIG.groundY - 40);
  ctx.closePath();
  ctx.fill();

  // The woods on the horizon grow as the escape distance closes.
  const woods = clamp((world.distance - 1100) / 400, 0, 1);
  if (woods > 0) {
    ctx.fillStyle = `rgba(46, 90, 32, ${0.55 + woods * 0.45})`;
    for (let i = 0; i < 26; i += 1) {
      const tx = ((i * 173 + 40) % 980) - 10;
      const th = 46 + ((i * 37) % 40) * woods;
      ctx.beginPath();
      ctx.moveTo(tx - 16, CONFIG.groundY - 30);
      ctx.lineTo(tx, CONFIG.groundY - 30 - th);
      ctx.lineTo(tx + 16, CONFIG.groundY - 30);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawGround(ctx, world) {
  const g = CONFIG.groundY;
  ctx.fillStyle = PALETTE.groundTop;
  ctx.fillRect(0, g, CONFIG.canvasWidth, 10);
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, g + 10, CONFIG.canvasWidth, CONFIG.canvasHeight - g - 10);
  // Grass tufts scrolling past.
  ctx.strokeStyle = PALETTE.grassDark;
  ctx.lineWidth = 3;
  const offset = (world.distance * 14) % 72;
  for (let x = -offset; x < CONFIG.canvasWidth; x += 72) {
    ctx.beginPath();
    ctx.moveTo(x, g + 2);
    ctx.lineTo(x + 6, g - 10);
    ctx.moveTo(x + 10, g + 2);
    ctx.lineTo(x + 14, g - 12);
    ctx.moveTo(x + 20, g + 2);
    ctx.lineTo(x + 24, g - 8);
    ctx.stroke();
  }
  // Dust puffs kicked up by the turkey's feet.
  ctx.fillStyle = 'rgba(214, 164, 102, 0.5)';
  for (let i = 0; i < 5; i += 1) {
    const px = 150 - ((world.time * 260 + i * 34) % 220);
    ellipse(ctx, px, g + 6 + (i % 2) * 8, 7 - i, 4);
  }
}

function drawSceneryItem(ctx, item, world) {
  const screenX = item.x - world.distance * 14 + item.jitter;
  if (screenX < -160 || screenX > CONFIG.canvasWidth + 160) return;
  const g = CONFIG.groundY;
  const s = item.size;
  ctx.save();
  ctx.translate(screenX, g);
  ctx.scale(s, s);
  if (item.kind === 'pumpkin') {
    ctx.fillStyle = '#e8641f';
    ellipse(ctx, 0, -16, 24, 18);
    ctx.fillStyle = '#f28c3c';
    ellipse(ctx, 0, -16, 14, 18);
    ctx.fillStyle = '#5d8a37';
    ctx.fillRect(-3, -38, 6, 10);
  } else if (item.kind === 'hay') {
    ctx.fillStyle = '#e8c25a';
    ctx.beginPath();
    ctx.arc(0, -18, 26, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c9a13b';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 9, -40);
      ctx.lineTo(i * 11, -20);
      ctx.stroke();
    }
  } else if (item.kind === 'tree') {
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(-6, -70, 12, 70);
    ctx.fillStyle = '#c96a1e';
    ellipse(ctx, 0, -84, 34, 26);
    ctx.fillStyle = '#e8641f';
    ellipse(ctx, -18, -70, 22, 18);
    ellipse(ctx, 18, -72, 20, 16);
  } else if (item.kind === 'bush') {
    ctx.fillStyle = PALETTE.grassDark;
    ellipse(ctx, 0, -10, 26, 12);
    ellipse(ctx, -16, -6, 16, 9);
    ellipse(ctx, 16, -6, 16, 9);
  } else if (item.kind === 'fencepost') {
    ctx.fillStyle = PALETTE.fence;
    ctx.fillRect(-4, -52, 8, 52);
    ctx.fillRect(-26, -46, 52, 6);
    ctx.fillRect(-26, -28, 52, 6);
  } else if (item.kind === 'barn') {
    ctx.fillStyle = '#a83226';
    ctx.fillRect(-90, -120, 180, 120);
    ctx.fillStyle = '#7e241b';
    ctx.beginPath();
    ctx.moveTo(-100, -118);
    ctx.lineTo(0, -168);
    ctx.lineTo(100, -118);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e8dcc8';
    ctx.lineWidth = 4;
    ctx.strokeRect(-28, -74, 56, 74);
    ctx.beginPath();
    ctx.moveTo(-28, -74);
    ctx.lineTo(28, 0);
    ctx.moveTo(28, -74);
    ctx.lineTo(-28, 0);
    ctx.stroke();
  } else if (item.kind === 'farmhouse') {
    ctx.fillStyle = '#f2e3c6';
    ctx.fillRect(-70, -90, 140, 90);
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.moveTo(-80, -88);
    ctx.lineTo(0, -128);
    ctx.lineTo(80, -88);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3f6fb5';
    ctx.fillRect(-52, -66, 26, 26);
    ctx.fillRect(26, -66, 26, 26);
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(-12, -46, 24, 46);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- actors

export function drawTurkey(ctx, turkey, world) {
  const t = turkey;
  const bob = Math.sin(t.runPhase * 2) * (t.onGround ? 3 : 0);
  const blink = t.invincibleTime > 0 && Math.floor(world.time * 12) % 2 === 0;
  ctx.save();
  ctx.translate(t.x + 32, t.y - 28 + bob);
  if (blink) ctx.globalAlpha = 0.35;
  if (t.dashTime > 0) ctx.translate(6, 0);
  const lean = t.onGround ? 0.06 : -0.18;
  ctx.rotate(lean);

  // Tail fan.
  const tailSpread = t.flap > 0 ? 1.25 : 1;
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.rotate((i * 0.34) / tailSpread);
    ctx.fillStyle = i % 2 === 0 ? PALETTE.featherBrown : '#7a4a21';
    ctx.beginPath();
    ctx.ellipse(-26, -14, 8, 24, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.featherGold;
    ctx.beginPath();
    ctx.ellipse(-26, -32, 4, 6, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Legs, scissoring as it runs.
  const legSwing = t.onGround ? Math.sin(t.runPhase * 2) * 10 : 8;
  ctx.strokeStyle = '#f2a007';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, 18);
  ctx.lineTo(-6 + legSwing, 28);
  ctx.moveTo(8, 18);
  ctx.lineTo(8 - legSwing, 28);
  ctx.stroke();

  // Body and wing.
  ctx.fillStyle = PALETTE.turkeyBody;
  ellipse(ctx, 0, 0, 30, 26);
  ctx.fillStyle = PALETTE.turkeyBelly;
  ellipse(ctx, 6, 8, 20, 15);
  const wingFlap = t.flap > 0 ? -0.7 : Math.sin(t.runPhase * 2) * 0.25;
  ctx.save();
  ctx.translate(-4, -4);
  ctx.rotate(wingFlap);
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath();
  ctx.ellipse(-8, 0, 18, 10, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Neck, head, beak, wattle and worried eye.
  ctx.fillStyle = PALETTE.turkeyHead;
  ctx.fillRect(20, -34, 10, 26);
  ellipse(ctx, 28, -38, 12, 11);
  ctx.fillStyle = PALETTE.turkeyBeak;
  ctx.beginPath();
  ctx.moveTo(38, -40);
  ctx.lineTo(50, -36);
  ctx.lineTo(38, -32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.turkeyWattle;
  ellipse(ctx, 36, -28, 4, 8);
  ctx.fillStyle = '#2b1a08';
  ellipse(ctx, 31, -41, 2.6, 3.4);
  ctx.fillStyle = '#fff';
  ellipse(ctx, 32, -42, 1, 1.4);
  // Panic sweat drop when the farmer is close.
  if (world.farmer.gap < 90) {
    ctx.fillStyle = '#bfe6ff';
    ctx.beginPath();
    ctx.ellipse(16, -52, 3, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Golden feather glow.
  if (t.featherTime > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(242, 193, 78, ${0.5 + Math.sin(world.time * 10) * 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(t.x + 32, t.y - 28, 48, 42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawFarmer(ctx, world) {
  const f = world.farmer;
  const t = world.turkey;
  const x = t.x - f.gap;
  const g = CONFIG.groundY;
  const bob = Math.abs(Math.sin(f.runPhase * 2)) * 4;
  ctx.save();
  ctx.translate(x, g - bob);

  // Legs pumping.
  const swing = Math.sin(f.runPhase * 2) * 14;
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-4, -44);
  ctx.lineTo(-4 + swing, 0);
  ctx.moveTo(6, -44);
  ctx.lineTo(6 - swing, 0);
  ctx.stroke();

  // Overalls, shirt and reaching arm.
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.fillRect(-14, -78, 30, 38);
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.fillRect(-15, -104, 32, 30);
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 8;
  const reach = 14 + f.reach * 22;
  ctx.beginPath();
  ctx.moveTo(12, -96);
  ctx.lineTo(12 + reach, -88 + Math.sin(f.runPhase * 2) * 3);
  ctx.stroke();
  ctx.fillStyle = PALETTE.farmerSkin;
  ellipse(ctx, 14 + reach, -88, 6, 6);

  // Head, straw hat and moustache.
  ctx.fillStyle = PALETTE.farmerSkin;
  ellipse(ctx, 2, -114, 13, 12);
  ctx.fillStyle = PALETTE.farmerHat;
  ellipse(ctx, 2, -124, 22, 6);
  ctx.fillRect(-8, -140, 20, 16);
  ctx.fillStyle = '#fff';
  ctx.fillRect(-8, -126, 20, 3);
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(-4, -110, 12, 4);
  // Angry eyes fixed on the turkey.
  ctx.fillStyle = '#2b1a08';
  ellipse(ctx, 6, -116, 2, 2.6);
  ellipse(ctx, 12, -116, 2, 2.6);
  ctx.restore();

  // Shout bubble when he closes in.
  if (f.gap < 110) {
    ctx.save();
    ctx.fillStyle = '#fff8e6';
    roundRect(ctx, x - 10, g - 196, 128, 34, 10);
    ctx.fill();
    ctx.strokeStyle = '#7a2e05';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#7a2e05';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.gap < 70 ? 'GOTCHA!' : 'COME BACK HERE!', x + 54, g - 178);
    ctx.restore();
  }
}

function drawObstacle(ctx, obstacle, world) {
  const x = obstacle.x;
  const g = obstacle.y;
  ctx.save();
  if (obstacle.kind === 'fence') {
    ctx.fillStyle = PALETTE.fence;
    ctx.fillRect(x, g - 56, 8, 56);
    ctx.fillRect(x + 38, g - 56, 8, 56);
    ctx.fillRect(x - 6, g - 48, 58, 8);
    ctx.fillRect(x - 6, g - 26, 58, 8);
    ctx.fillStyle = PALETTE.woodDark;
    ctx.fillRect(x - 6, g - 48, 58, 3);
  } else if (obstacle.kind === 'oven') {
    // A cast-iron oven, door glowing, chimney smoking.
    ctx.fillStyle = PALETTE.oven;
    roundRect(ctx, x, g - 78, 74, 78, 8);
    ctx.fill();
    ctx.fillStyle = '#2a2a32';
    ctx.fillRect(x + 10, g - 66, 54, 40);
    const glow = 0.6 + Math.sin(world.time * 5 + obstacle.bob) * 0.3;
    ctx.fillStyle = `rgba(255, 122, 47, ${glow})`;
    ctx.fillRect(x + 14, g - 62, 46, 32);
    ctx.strokeStyle = '#1c1c22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 14, g - 46);
    ctx.lineTo(x + 60, g - 46);
    ctx.stroke();
    ctx.fillStyle = PALETTE.oven;
    ctx.fillRect(x + 26, g - 96, 20, 20);
    ctx.fillStyle = 'rgba(200, 200, 210, 0.5)';
    ellipse(ctx, x + 36 + Math.sin(world.time * 2 + obstacle.bob) * 4, g - 106, 6, 5);
    ellipse(ctx, x + 36, g - 118, 8, 6);
    // Danger stripes on the base.
    ctx.fillStyle = '#ffd23f';
    for (let i = 0; i < 3; i += 1) ctx.fillRect(x + 8 + i * 24, g - 10, 12, 6);
  } else if (obstacle.kind === 'knife') {
    // A carving knife swinging down from above on a hook.
    const swing = Math.sin(obstacle.swing) * 0.5;
    ctx.translate(x + 15, g - 88);
    ctx.rotate(swing);
    ctx.strokeStyle = '#2b1a08';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.fillStyle = PALETTE.knifeHandle;
    roundRect(ctx, -6, 0, 12, 26, 4);
    ctx.fill();
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(-8, 24);
    ctx.lineTo(8, 24);
    ctx.lineTo(4, 80);
    ctx.lineTo(-2, 88);
    ctx.lineTo(-8, 80);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, 30);
    ctx.lineTo(-1, 76);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPickup(ctx, pickup) {
  const y = pickup.y + Math.sin(pickup.bob) * 5;
  ctx.save();
  ctx.translate(pickup.x, y);
  if (pickup.kind === 'corn') {
    ctx.rotate(0.5);
    ctx.fillStyle = PALETTE.corn;
    ellipse(ctx, 0, 0, 10, 16);
    ctx.strokeStyle = '#e8a91c';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 5, -12);
      ctx.lineTo(i * 5, 12);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.cornHusk;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(-14, 22);
    ctx.lineTo(0, 14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(14, 22);
    ctx.lineTo(0, 14);
    ctx.closePath();
    ctx.fill();
  } else {
    // Golden feather, slowly spinning.
    ctx.rotate(Math.sin(pickup.bob * 0.5) * 0.4);
    ctx.fillStyle = PALETTE.featherGold;
    ctx.beginPath();
    ctx.ellipse(0, -6, 8, 18, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ellipse(ctx, -2, -12, 3, 7);
    ctx.strokeStyle = '#c98d2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(0, 22);
    ctx.stroke();
  }
  ctx.restore();
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ellipse(ctx, p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawFloats(ctx, world) {
  ctx.save();
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  for (const fl of world.floats) {
    ctx.globalAlpha = clamp(fl.life, 0, 1);
    ctx.fillStyle = fl.color;
    ctx.strokeStyle = 'rgba(43, 26, 8, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(fl.text, fl.x, fl.y);
    ctx.fillText(fl.text, fl.x, fl.y);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- HUD

export function drawHud(ctx, world) {
  const distanceLeft = Math.max(0, CONFIG.escapeDistance - Math.floor(world.distance));
  ctx.save();
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, 12, 10, 300, 66, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudText;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(`SCORE  ${world.score}`, 26, 30);
  ctx.font = '17px Georgia, serif';
  ctx.fillText(`DISTANCE  ${Math.floor(world.distance)} m  ·  ${distanceLeft} m to the woods`, 26, 56);

  // Lives as little turkey heads.
  for (let i = 0; i < CONFIG.startLives; i += 1) {
    const lx = 348 + i * 34;
    const alive = i < world.lives;
    ctx.globalAlpha = alive ? 1 : 0.25;
    ctx.fillStyle = PALETTE.turkeyHead;
    ellipse(ctx, lx, 30, 11, 10);
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(lx + 9, 28);
    ctx.lineTo(lx + 17, 31);
    ctx.lineTo(lx + 9, 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2b1a08';
    ellipse(ctx, lx + 3, 27, 1.8, 2.2);
  }
  ctx.globalAlpha = 1;

  // Farmer danger meter.
  const danger = 1 - clamp(world.farmer.gap / 320, 0, 1);
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, 12, 84, 220, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#3a2410';
  roundRect(ctx, 20, 92, 140, 14, 7);
  ctx.fill();
  ctx.fillStyle = danger > 0.66 ? PALETTE.danger : danger > 0.33 ? '#ffb02e' : PALETTE.safe;
  roundRect(ctx, 20, 92, 140 * danger, 14, 7);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('FARMER', 168, 100);

  // Dash cooldown panel, top right.
  ctx.fillStyle = PALETTE.hudPanel;
  roundRect(ctx, CONFIG.canvasWidth - 232, 10, 220, 30, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'right';
  const dashReady = world.turkey.dashCooldown <= 0;
  ctx.fillText(
    dashReady ? 'DASH READY  [Shift]' : `DASH … ${world.turkey.dashCooldown.toFixed(1)}s`,
    CONFIG.canvasWidth - 24,
    26,
  );

  // Stage banner, centred in the open sky below the farmer meter.
  ctx.fillStyle = 'rgba(46, 24, 8, 0.45)';
  roundRect(ctx, CONFIG.canvasWidth / 2 - 90, 88, 180, 26, 13);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.fillText(stageAt(world.distance).name.toUpperCase(), CONFIG.canvasWidth / 2, 102);
  ctx.restore();
}

// ---------------------------------------------------------------- screens

function drawTitleScreen(ctx, world, pointer) {
  drawSky(ctx, world);
  drawHills(ctx, world);
  drawGround(ctx, world);
  for (const item of world.scenery) drawSceneryItem(ctx, item, world);
  // The hero turkey, big and centre-left, mid-gobble.
  const hero = { ...world.turkey, x: 210, y: CONFIG.groundY, runPhase: 1.2, flap: 0.4 };
  ctx.save();
  ctx.translate(240, 400);
  ctx.scale(1.5, 1.5);
  ctx.translate(-(hero.x + 32), -(hero.y - 28));
  drawTurkey(ctx, hero, world);
  ctx.restore();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(46, 24, 8, 0.55)';
  roundRect(ctx, 150, 36, 660, 150, 18);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('GOBBLE RUN', 480, 104);
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.font = 'italic bold 26px Georgia, serif';
  ctx.fillText('— A Turkey Escape —', 480, 148);
  ctx.fillStyle = '#ffe9c4';
  ctx.font = '18px Georgia, serif';
  ctx.fillText('Thanksgiving is coming. The farmer is coming faster. Run for the woods!', 480, 176);
  ctx.restore();

  BUTTONS.title = [
    { id: 'start', label: '▶  START THE ESCAPE', x: 330, y: 300, w: 300, h: 56 },
    { id: 'how', label: 'HOW TO PLAY', x: 330, y: 368, w: 300, h: 48 },
  ];
  drawButtonList(ctx, BUTTONS.title, pointer);

  ctx.save();
  ctx.fillStyle = 'rgba(46, 24, 8, 0.55)';
  roundRect(ctx, 140, 442, 680, 76, 12);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff3d6';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('SPACE / ↑ jump (twice for a double jump) · SHIFT / → dash · P pause · M mute', 480, 462);
  ctx.fillText('Grab corn for points, golden feathers for a burst of courage. Dodge fences, ovens and knives.', 480, 486);
  ctx.fillText('Reach the woods 1,500 m away — or become dinner.', 480, 510);
  ctx.restore();
}

function drawHowTo(ctx, pointer) {
  ctx.save();
  ctx.fillStyle = 'rgba(30, 16, 6, 0.82)';
  ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  ctx.fillStyle = '#fff3d6';
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText('HOW TO PLAY', 480, 80);
  ctx.font = '19px Georgia, serif';
  const lines = [
    'You are Giblet, the last turkey in the yard. The farmer wants you for dinner.',
    '',
    'SPACE / ↑ / W — jump. Press again mid-air for a double jump.',
    'SHIFT / → / X — dash. Slips under a swinging carving knife.',
    '↓ — duck low under a knife swing (only on the ground).',
    'P — pause. R — restart. M — mute the music.',
    '',
    'Fences and ovens: jump them. Knives: jump or dash under them.',
    'Corn is worth 50 points. A golden feather is worth 150 — and smashes',
    'straight through hazards while it lasts.',
    'Every stumble costs a life and lets the farmer close in. Three lives,',
    'then you are dinner. Reach the woods, 1,500 m away, to escape.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 480, 130 + i * 28));
  BUTTONS.title = [{ id: 'back', label: '←  BACK', x: 380, y: 452, w: 200, h: 48 }];
  drawButtonList(ctx, BUTTONS.title, pointer);
  ctx.restore();
}

function drawEndScreen(ctx, world, pointer) {
  const escaped = world.status === 'escaped';
  ctx.save();
  ctx.fillStyle = escaped ? 'rgba(30, 80, 30, 0.78)' : 'rgba(60, 16, 8, 0.78)';
  ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', 480, 110);
  ctx.fillStyle = PALETTE.hudAccent;
  ctx.font = 'italic bold 24px Georgia, serif';
  ctx.fillText(
    escaped
      ? 'Giblet vanishes into the woods. Thanksgiving is cancelled.'
      : world.cause === 'roasted'
        ? 'The oven wins. Giblet is on the menu.'
        : world.cause === 'carved'
          ? 'The carving knife wins. Giblet is on the menu.'
          : 'The farmer grabs Giblet by the drumstick. Dinner is served.',
    480,
    152,
  );
  ctx.fillStyle = '#fff3d6';
  ctx.font = '22px Georgia, serif';
  ctx.fillText(`Final score: ${world.score}`, 480, 216);
  ctx.font = '19px Georgia, serif';
  ctx.fillText(`Distance: ${Math.floor(world.distance)} m   ·   Corn: ${world.corn}   ·   Feathers: ${world.feathers}`, 480, 250);
  ctx.fillText(`Best combo: ${world.bestCombo}   ·   Jumps: ${world.jumps}   ·   Dashes: ${world.dashes}`, 480, 280);
  BUTTONS.end = [
    { id: 'again', label: '↻  RUN AGAIN  (R)', x: 330, y: 330, w: 300, h: 56 },
    { id: 'title', label: 'TITLE SCREEN', x: 330, y: 398, w: 300, h: 48 },
  ];
  drawButtonList(ctx, BUTTONS.end, pointer);
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Press R or click RUN AGAIN to try for a faster escape.', 480, 480);
  ctx.restore();
}

function drawPaused(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(30, 16, 6, 0.7)';
  ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  ctx.fillStyle = '#fff3d6';
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('PAUSED', 480, 250);
  ctx.font = '19px Georgia, serif';
  ctx.fillText('Press P to keep running. The farmer is catching his breath too.', 480, 292);
  ctx.restore();
}

// ---------------------------------------------------------------- frame

export function drawFrame(ctx, world, ui) {
  const { pointer } = ui;
  ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  if (world.status === 'title') {
    if (ui.showHow) drawHowTo(ctx, pointer);
    else drawTitleScreen(ctx, world, pointer);
    return;
  }
  drawSky(ctx, world);
  drawHills(ctx, world);
  for (const item of world.scenery) drawSceneryItem(ctx, item, world);
  drawGround(ctx, world);
  for (const pickup of world.pickups) drawPickup(ctx, pickup);
  for (const obstacle of world.obstacles) drawObstacle(ctx, obstacle, world);
  drawFarmer(ctx, world);
  drawTurkey(ctx, world.turkey, world);
  drawParticles(ctx, world);
  drawFloats(ctx, world);
  drawHud(ctx, world);
  if (world.status === 'paused') drawPaused(ctx);
  if (world.status === 'caught' || world.status === 'escaped') {
    drawEndScreen(ctx, world, pointer);
  }
}
