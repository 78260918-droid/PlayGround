const $ = (id) => document.getElementById(id);

export const ui = {
  title: $('title'),
  start: $('startBtn'),
  hud: $('hud'),
  panelTitle: $('panelTitle'),
  missionList: $('missionList'),
  objective: $('objectiveText'),
  prompt: $('prompt'),
  promptText: $('promptText'),
  dialogue: $('dialogue'),
  speaker: $('speaker'),
  dialogueText: $('dialogueText'),
  toast: $('toast'),
  cookHud: $('cookHud'),
  cookFill: $('cookFill'),
  hideHud: $('hideHud'),
  hideFill: $('hideFill'),
  jumpscare: $('jumpscare'),
  pause: $('pause'),
  resume: $('resumeBtn'),
  restart: $('restartBtn'),
  ending: $('ending'),
  endingText: $('endingText'),
  again: $('againBtn'),
  mute: $('muteBtn'),
  touchUI: $('touchUI'),
  stick: $('stick'),
  knob: $('knob'),
  action: $('actionBtn'),
  redFlash: $('redFlash'),
  grain: $('grain'),
};

export const WORLD = { w: 1600, h: 1000 };
export const PLAYER_R = 15;

export const FLOORS = [
  { x: 80, y: 80, w: 640, h: 450, kind: 'bedroom' },
  { x: 880, y: 80, w: 640, h: 450, kind: 'kitchen' },
  { x: 80, y: 530, w: 640, h: 430, kind: 'living' },
  { x: 880, y: 530, w: 640, h: 430, kind: 'bathroom' },
  { x: 720, y: 80, w: 160, h: 880, kind: 'hall' },
];

export const WALLS = [
  { x: 62, y: 62, w: 1476, h: 18 },
  { x: 62, y: 80, w: 18, h: 898 },
  { x: 1520, y: 80, w: 18, h: 898 },
  { x: 62, y: 960, w: 698, h: 18 },
  { x: 840, y: 960, w: 698, h: 18 },
  { x: 711, y: 80, w: 18, h: 170 },
  { x: 711, y: 350, w: 18, h: 350 },
  { x: 711, y: 800, w: 18, h: 160 },
  { x: 871, y: 80, w: 18, h: 170 },
  { x: 871, y: 350, w: 18, h: 350 },
  { x: 871, y: 800, w: 18, h: 160 },
  { x: 80, y: 521, w: 631, h: 18 },
  { x: 889, y: 521, w: 631, h: 18 },
];

export const PROPS = [
  { id: 'bed', kind: 'bed', x: 120, y: 110, w: 240, h: 150, solid: true },
  { id: 'desk', kind: 'desk', x: 520, y: 350, w: 160, h: 70, solid: true },
  { id: 'catCloset', kind: 'closet', x: 600, y: 94, w: 100, h: 94, solid: true, closet: true, name: 'el armario del Gato', spot: { x: 650, y: 218 } },
  { id: 'fridge', kind: 'fridge', x: 900, y: 200, w: 90, h: 120, solid: true },
  { id: 'counter', kind: 'counter', x: 1010, y: 100, w: 210, h: 80, solid: true },
  { id: 'stove', kind: 'stove', x: 1260, y: 100, w: 110, h: 100, solid: true, stove: true },
  { id: 'sinkK', kind: 'sink', x: 1400, y: 100, w: 90, h: 80, solid: true },
  { id: 'kitchenTable', kind: 'table', x: 1080, y: 320, w: 160, h: 110, solid: true },
  { id: 'pantry', kind: 'closet', x: 1410, y: 390, w: 100, h: 110, solid: true, closet: true, name: 'la despensa', spot: { x: 1460, y: 530 } },
  { id: 'sofa', kind: 'sofa', x: 150, y: 610, w: 230, h: 95, solid: true },
  { id: 'tv', kind: 'tv', x: 470, y: 555, w: 210, h: 55, solid: true },
  { id: 'coffee', kind: 'coffee', x: 320, y: 760, w: 150, h: 65, solid: true },
  { id: 'livingCloset', kind: 'closet', x: 84, y: 780, w: 96, h: 116, solid: true, closet: true, name: 'el armario de la sala', spot: { x: 214, y: 836 } },
  { id: 'bookshelf', kind: 'bookshelf', x: 560, y: 800, w: 130, h: 100, solid: true },
  { id: 'tub', kind: 'tub', x: 920, y: 570, w: 200, h: 110, solid: true },
  { id: 'sinkB', kind: 'sink', x: 1400, y: 570, w: 90, h: 80, solid: true },
  { id: 'toilet', kind: 'toilet', x: 1270, y: 850, w: 85, h: 70, solid: true },
  { id: 'bathCloset', kind: 'closet', x: 1418, y: 760, w: 96, h: 116, solid: true, closet: true, name: 'el armario del baño', spot: { x: 1466, y: 906 } },
  { id: 'frontDoor', kind: 'door', x: 760, y: 940, w: 80, h: 26, solid: true, door: true },
];

export const CLOSETS = PROPS.filter((p) => p.closet);
export const STOVE = PROPS.find((p) => p.stove);
export const FRONT_DOOR = PROPS.find((p) => p.door);

export const MESS = [
  { id: 'm1', x: 430, y: 402, label: 'ropa sucia', kind: 'clothes', collected: false },
  { id: 'm2', x: 200, y: 462, label: 'juguete roto', kind: 'toy', collected: false },
  { id: 'm3', x: 480, y: 240, label: 'papel arrugado', kind: 'paper', collected: false },
  { id: 'm4', x: 160, y: 322, label: 'calcetín solitario', kind: 'sock', collected: false },
  { id: 'm5', x: 620, y: 300, label: 'lata vacía', kind: 'can', collected: false },
];

export const INGREDIENTS = [
  { id: 'i1', x: 1010, y: 250, label: 'huevo', kind: 'egg', collected: false },
  { id: 'i2', x: 1180, y: 252, label: 'harina', kind: 'flour', collected: false },
  { id: 'i3', x: 1420, y: 260, label: 'leche', kind: 'milk', collected: false },
];

export const FRIENDS = [
  {
    id: 'b1', x: 265, y: 736, name: 'AZUL RARO #1', found: false,
    lines: ['¡Hola! Estaba debajo del sofá.', 'El Gato dice que soy su amigo. Yo solo quería comer migas.'],
  },
  {
    id: 'b2', x: 1020, y: 712, name: 'AZUL RARO #2', found: false,
    lines: ['Estaba en la bañera. El agua ya estaba fría.', '¿Tienes una toalla? No. Vale. Sigo aquí.'],
  },
  {
    id: 'b3', x: 1460, y: 530, name: 'AZUL RARO #3', found: false,
    lines: ['Shhh. Estaba en la despensa.', 'No le digas al Gato que me comí su pastel. Bueno, el de antes.'],
  },
];

export const YARD = { x1: 150, y1: 610, x2: 1450, y2: 945 };
export const HOUSE = { x: 420, y: 108, w: 760, h: 492 };
export const HOUSE_DOOR = { x: 800, y: 618 };

export const quests = {
  clean: { done: false, count: 0, total: 5 },
  cook: { done: false, count: 0, total: 3 },
  friends: { done: false, count: 0, total: 3 },
};

export const state = {
  mode: 'title',
  phase: 'intro',
  scene: 'inside',
  paused: false,
  time: 0,
  player: { x: 330, y: 420, dir: { x: 0, y: 1 }, moving: false, hidden: false, stepTimer: 0, walk: 0 },
  cat: { x: 430, y: 875, visible: false, convulsing: false, chaseGrace: 0, searchTimer: 0, huntTarget: null },
  hideCloset: null,
  camera: { x: 430, y: 310 },
  shake: 0,
  redFlash: 0,
  danger: 0,
  toastTimer: 0,
  hideTimer: 0,
  hideDuration: 9,
  catching: false,
  cooking: false,
  allComplete: false,
  catReady: false,
  gasTaken: false,
  matchesTaken: false,
  fire: false,
  burnTimer: 0,
  endingShown: false,
  objective: 'Algo te observa desde el armario.',
  followers: [],
  particles: [],
  dust: [],
  stars: [],
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function circleRect(cx, cy, cr, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  return (cx - nx) ** 2 + (cy - ny) ** 2 < cr * cr;
}

export function insideFloor(x, y) {
  return FLOORS.some((f) => x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h);
}

export function canStand(x, y) {
  if (state.scene === 'outside') {
    return x >= YARD.x1 && x <= YARD.x2 && y >= YARD.y1 && y <= YARD.y2;
  }
  if (!insideFloor(x, y)) return false;
  for (const w of WALLS) if (circleRect(x, y, PLAYER_R, w)) return false;
  for (const p of PROPS) if (p.solid && circleRect(x, y, PLAYER_R, p)) return false;
  return true;
}

export const view = { w: 0, h: 0, dpr: 1, scale: 1 };
