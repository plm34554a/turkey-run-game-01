// Gobble Run — the frame loop and the state machine: title, playing, paused,
// caught and escaped. Input is read once per frame; the world advances in
// fixed steps so the run feels the same on any display.
import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, resetWorld, startDash, startJump, updateWorld } from './world.js';
import { BUTTONS, buttonAt, drawFrame } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();
const world = createWorld();
const ui = { pointer: input.pointer, showHow: false };

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? '20261127') || 20261127;

// A read-only handle for automated play-testing (harmless in the shipped game).
window.__gobble = world;

if (shot) {
  // Screenshot mode: freeze a chosen moment instead of waiting for a player.
  applyShot(world, shot, seed);
} else {
  audio.startMusic();
}

function startRun() {
  resetWorld(world, world.seed);
  ui.showHow = false;
  audio.unlock();
  audio.startMusic();
  audio.gobble();
}

function backToTitle() {
  resetWorld(world, world.seed);
  world.status = 'title';
  ui.showHow = false;
  audio.startMusic();
}

function clickButtons(buttons) {
  if (!input.pointer.clicked) return null;
  const hit = buttonAt(buttons, input.pointer.x, input.pointer.y);
  if (hit) audio.click();
  return hit;
}

function stepTitle() {
  const hit = clickButtons(BUTTONS.title);
  if (hit?.id === 'start' || input.wasPressed('confirm') || input.wasPressed('jump')) {
    startRun();
  } else if (hit?.id === 'how') {
    ui.showHow = true;
  } else if (hit?.id === 'back') {
    ui.showHow = false;
  }
}

function stepPlaying(dt) {
  if (input.wasPressed('pause')) {
    world.status = 'paused';
    return;
  }
  if (input.wasPressed('restart')) {
    startRun();
    return;
  }
  if (input.wasPressed('mute')) audio.toggleMute();
  if (input.wasPressed('jump')) startJump(world, audio);
  if (input.wasPressed('dash')) startDash(world, audio);
  world.turkey.ducking = input.isDown('duck');
  updateWorld(world, dt, audio);
  if (world.status === 'caught' || world.status === 'escaped') {
    // Leave the end screen up; the music stays off until a new run starts.
  }
}

function stepPaused() {
  if (input.wasPressed('pause') || input.wasPressed('confirm')) {
    world.status = 'playing';
  }
  if (input.wasPressed('restart')) startRun();
}

function stepEnd() {
  const hit = clickButtons(BUTTONS.end);
  if (hit?.id === 'again' || input.wasPressed('restart') || input.wasPressed('confirm')) {
    startRun();
  } else if (hit?.id === 'title') {
    backToTitle();
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!shot) {
    if (world.status === 'title') stepTitle();
    else if (world.status === 'playing') stepPlaying(dt);
    else if (world.status === 'paused') stepPaused();
    else stepEnd();
  }

  drawFrame(ctx, world, ui);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
