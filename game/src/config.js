// Gobble Run — tuning, palette and stage data. One place for every number the
// rest of the game reads, so the run can be re-balanced without touching logic.
export const CONFIG = {
  title: 'Gobble Run',
  subtitle: 'A Turkey Escape',
  canvasWidth: 960,
  canvasHeight: 540,
  groundY: 452,
  gravity: 3000,
  jumpVelocity: -1050,
  doubleJumpVelocity: -850,
  dashSpeed: 620,
  dashTime: 0.3,
  dashCooldown: 1.1,
  baseSpeed: 300,
  maxSpeed: 520,
  speedRamp: 0.35, // extra px/s per metre run
  farmerBaseGap: 150, // px between turkey and farmer at the start
  farmerCatchGap: 34,
  farmerCloseRate: 26, // px/s the farmer gains when the turkey stumbles
  farmerFallBack: 46, // px/s the farmer loses while the turkey runs clean
  stumbleSlow: 0.55, // speed multiplier for 0.6 s after a hit
  invincibleTime: 1.4,
  escapeDistance: 1500, // metres to the woods
  startLives: 3,
  cornScore: 50,
  featherScore: 150,
  featherBoost: 2.2, // seconds of invincibility + speed from a golden feather
  pickupMagnet: 90,
};

// Autumn farm palette, one coherent set used by every draw call.
export const PALETTE = {
  skyTop: '#ffd9a0',
  skyMid: '#ffbe78',
  skyBottom: '#f79d5c',
  sun: '#fff3c4',
  hillFar: '#d98a4b',
  hillNear: '#b96a32',
  ground: '#8a5a2b',
  groundTop: '#a9713a',
  grass: '#7fae4c',
  grassDark: '#5d8a37',
  wood: '#6b4423',
  woodDark: '#4e2f16',
  fence: '#8a5a2b',
  turkeyBody: '#7a4a21',
  turkeyBelly: '#c98d4e',
  turkeyHead: '#d96a3b',
  turkeyWattle: '#e03131',
  turkeyBeak: '#f2a007',
  featherBrown: '#5a3a1a',
  featherGold: '#f2c14e',
  farmerShirt: '#3f6fb5',
  farmerOveralls: '#2f4d7d',
  farmerHat: '#e8d27a',
  farmerSkin: '#f2c79b',
  oven: '#3c3c46',
  ovenDoor: '#ff7a2f',
  knifeBlade: '#dfe6ee',
  knifeHandle: '#3a2a1a',
  corn: '#ffd23f',
  cornHusk: '#5d8a37',
  hudPanel: 'rgba(46, 24, 8, 0.72)',
  hudText: '#fff3d6',
  hudAccent: '#ffd23f',
  danger: '#ff4d2e',
  safe: '#7ddb4f',
};

// The run crosses three stretches of ground; each stage changes the scenery,
// the hazards that spawn and how crowded the road gets.
export const STAGES = [
  {
    name: 'The Farmyard',
    from: 0,
    to: 400,
    sky: ['#ffd9a0', '#ffbe78', '#f79d5c'],
    hill: '#d98a4b',
    spawnGap: [340, 540],
    hazards: ['fence', 'knife'],
    pickups: 0.55,
  },
  {
    name: 'The Kitchen Yard',
    from: 400,
    to: 950,
    sky: ['#ffc98f', '#fb9e5e', '#e87a4a'],
    hill: '#c97a3e',
    spawnGap: [280, 460],
    hazards: ['fence', 'oven', 'knife'],
    pickups: 0.5,
  },
  {
    name: 'The Woods Edge',
    from: 950,
    to: 1500,
    sky: ['#ffe6b0', '#ffc27a', '#f08a4e'],
    hill: '#a86a2e',
    spawnGap: [250, 420],
    hazards: ['fence', 'oven', 'knife', 'oven'],
    pickups: 0.45,
  },
];

export function stageAt(distance) {
  for (const stage of STAGES) {
    if (distance < stage.to) return stage;
  }
  return STAGES[STAGES.length - 1];
}

export function stageProgress(distance) {
  const stage = stageAt(distance);
  return (distance - stage.from) / (stage.to - stage.from);
}
