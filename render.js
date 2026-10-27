import {
  state, view, WORLD, FLOORS, WALLS, PROPS, CLOSETS, MESS, INGREDIENTS, FRIENDS,
  clamp, rand,
} from './state.js';
import { drawOutside } from './outside.js';

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');

export function resize() {
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.w = window.innerWidth;
  view.h = window.innerHeight;
  canvas.width = Math.round(view.w * view.dpr);
  canvas.height = Math.round(view.h * view.dpr);
  canvas.style.width = view.w + 'px';
  canvas.style.height = view.h + 'px';
  view.scale = clamp(Math.max(view.w / 1150, view.h / 780), 0.5, 3);
}

function rr(x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function cameraClamp(value, viewSize, worldSize) {
  if (viewSize >= worldSize) return (worldSize - viewSize) / 2;
  return clamp(value, 0, worldSize - viewSize);
}

export function snapCamera() {
  let target = state.player;
  if (state.mode === 'title') target = { x: 520, y: 340 };
  if (state.mode === 'burning') target = { x: 800, y: 440 };
  if (state.cat.convulsing) target = state.cat;
  const vw = view.w / view.scale;
  const vh = view.h / view.scale;
  state.camera.x = cameraClamp(target.x - vw / 2, vw, WORLD.w);
  state.camera.y = cameraClamp(target.y - vh / 2, vh, WORLD.h);
}

export function render() {
  let shakeX = 0;
  let shakeY = 0;
  if (state.shake > 0.01) {
    const magnitude = state.shake * 20;
    shakeX = (Math.random() * 2 - 1) * magnitude;
    shakeY = (Math.random() * 2 - 1) * magnitude;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(view.dpr, view.dpr);
  ctx.translate(shakeX, shakeY);
  ctx.fillStyle = '#05060a';
  ctx.fillRect(0, 0, view.w, view.h);

  ctx.save();
  ctx.scale(view.scale, view.scale);
  ctx.translate(-state.camera.x, -state.camera.y);
  if (state.scene === 'outside') drawOutside(ctx);
  else drawInterior();
  ctx.restore();

  drawDarkness();
  drawRedTint();
  ctx.restore();
}

function drawDarkness() {
  const cam = state.camera;
  let source = state.player;
  if (state.mode === 'title') source = { x: 640, y: 240 };
  if (state.mode === 'burning') source = { x: 800, y: 430 };
  const lx = (source.x - cam.x) * view.scale;
  const ly = (source.y - cam.y) * view.scale;
  let radius = 340;
  if (state.scene === 'outside') radius = 440;
  if (state.mode === 'hidden') radius = 230;
  radius *= view.scale;

  const gradient = ctx.createRadialGradient(lx, ly, radius * 0.08, lx, ly, radius);
  gradient.addColorStop(0, 'rgba(2,3,7,0)');
  gradient.addColorStop(0.42, 'rgba(3,4,9,0.1)');
  gradient.addColorStop(0.78, 'rgba(3,4,9,0.56)');
  gradient.addColorStop(1, 'rgba(2,3,7,0.93)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.w, view.h);

  if (state.scene === 'outside') {
    const warm = ctx.createRadialGradient(
      800 * view.scale - cam.x * view.scale,
      430 * view.scale - cam.y * view.scale,
      20,
      800 * view.scale - cam.x * view.scale,
      430 * view.scale - cam.y * view.scale,
      330 * view.scale,
    );
    warm.addColorStop(0, state.fire ? 'rgba(255,120,40,.2)' : 'rgba(255,200,120,.08)');
    warm.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, view.w, view.h);
  }
}

function drawRedTint() {
  let alpha = state.redFlash;
  if (state.mode === 'chase') alpha = Math.max(alpha, state.danger * 0.24);
  if (state.mode === 'burning') alpha = Math.max(alpha, 0.16 + state.danger * 0.18);
  if (alpha <= 0.004) return;
  const gradient = ctx.createRadialGradient(
    view.w / 2, view.h / 2, view.h * 0.15,
    view.w / 2, view.h / 2, view.h * 0.85,
  );
  gradient.addColorStop(0, `rgba(190,20,50,${alpha * 0.25})`);
  gradient.addColorStop(1, `rgba(110,0,25,${alpha})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.w, view.h);
}

function drawInterior() {
  drawFloor();
  drawRugs();
  drawWalls();
  drawWallArt();
  drawLamps();
  for (const prop of PROPS) drawProp(prop);
  for (const item of MESS) drawMess(item);
  for (const item of INGREDIENTS) drawIngredient(item);
  for (const friend of FRIENDS) drawFriendHint(friend);
  drawPlayer();
  drawFollowers();
  drawCat();
  drawParticles();
  drawDust();
  drawWorldMarkers();
}

function drawFloor() {
  for (const f of FLOORS) {
    ctx.save();
    rr(f.x, f.y, f.w, f.h, 3);
    ctx.clip();
    if (f.kind === 'kitchen') {
      const tile = 42;
      for (let y = f.y; y < f.y + f.h; y += tile) {
        for (let x = f.x; x < f.x + f.w; x += tile) {
          const alt = ((x - f.x) / tile + (y - f.y) / tile) % 2 === 0;
          ctx.fillStyle = alt ? '#2f353f' : '#262c35';
          ctx.fillRect(x, y, tile, tile);
        }
      }
      ctx.strokeStyle = 'rgba(255,255,255,.035)';
      ctx.lineWidth = 1;
      for (let x = f.x; x <= f.x + f.w; x += tile) {
        ctx.beginPath();
        ctx.moveTo(x, f.y);
        ctx.lineTo(x, f.y + f.h);
        ctx.stroke();
      }
      for (let y = f.y; y <= f.y + f.h; y += tile) {
        ctx.beginPath();
        ctx.moveTo(f.x, y);
        ctx.lineTo(f.x + f.w, y);
        ctx.stroke();
      }
    } else if (f.kind === 'bathroom') {
      const tile = 30;
      ctx.fillStyle = '#23393b';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeStyle = 'rgba(140,205,205,.08)';
      ctx.lineWidth = 1;
      for (let x = f.x; x <= f.x + f.w; x += tile) {
        ctx.beginPath();
        ctx.moveTo(x, f.y);
        ctx.lineTo(x, f.y + f.h);
        ctx.stroke();
      }
      for (let y = f.y; y <= f.y + f.h; y += tile) {
        ctx.beginPath();
        ctx.moveTo(f.x, y);
        ctx.lineTo(f.x + f.w, y);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = f.kind === 'living' ? '#32242d' : f.kind === 'hall' ? '#2b2029' : '#3a2a29';
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeStyle = f.kind === 'bedroom' ? 'rgba(20,12,16,.55)' : 'rgba(16,10,16,.5)';
      ctx.lineWidth = 2;
      for (let y = f.y + 24; y < f.y + f.h; y += 34) {
        ctx.beginPath();
        ctx.moveTo(f.x, y);
        ctx.lineTo(f.x + f.w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,.025)';
      for (let x = f.x + 40; x < f.x + f.w; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, f.y);
        ctx.lineTo(x, f.y + f.h);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 2;
    rr(f.x, f.y, f.w, f.h, 3);
    ctx.stroke();
  }
}

function drawRugs() {
  ctx.save();
  rr(188, 716, 438, 186, 22);
  ctx.fillStyle = '#45283a';
  ctx.fill();
  ctx.strokeStyle = '#74465e';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,214,230,.18)';
  ctx.lineWidth = 2;
  for (let x = 220; x < 600; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, 734);
    ctx.lineTo(x + 22, 884);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  rr(752, 160, 96, 780, 8);
  ctx.fillStyle = '#4a1e2b';
  ctx.fill();
  ctx.strokeStyle = '#77334a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,210,170,.22)';
  for (let y = 190; y < 920; y += 54) {
    ctx.beginPath();
    ctx.moveTo(766, y);
    ctx.lineTo(834, y + 18);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  rr(1160, 810, 210, 82, 10);
  ctx.fillStyle = '#2a4a4a';
  ctx.fill();
  ctx.strokeStyle = '#4b7d7b';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(390, 372, 86, 58, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(90,55,75,.45)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(180,130,160,.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawWalls() {
  for (const w of WALLS) {
    ctx.fillStyle = '#140f19';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#2b2137';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
    ctx.strokeStyle = 'rgba(255,255,255,.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w.x + 2, w.y + 2);
    ctx.lineTo(w.x + w.w - 2, w.y + 2);
    ctx.stroke();
  }
}

function drawWallArt() {
  const frames = [
    { x: 300, y: 505, w: 80, h: 12, color: '#51304a' },
    { x: 1090, y: 505, w: 90, h: 12, color: '#3f4654' },
    { x: 736, y: 300, w: 10, h: 74, color: '#4d2537' },
    { x: 854, y: 620, w: 10, h: 74, color: '#453052' },
  ];
  for (const f of frames) {
    ctx.fillStyle = f.color;
    ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.strokeRect(f.x, f.y, f.w, f.h);
  }
}

function drawLamps() {
  const lamps = [
    { x: 632, y: 376, r: 130, color: 'rgba(255,196,110,.1)' },
    { x: 1180, y: 470, r: 150, color: 'rgba(255,226,160,.09)' },
    { x: 600, y: 905, r: 150, color: 'rgba(180,150,255,.07)' },
    { x: 1150, y: 720, r: 120, color: 'rgba(120,220,220,.06)' },
    { x: 800, y: 500, r: 170, color: 'rgba(255,210,140,.055)' },
  ];
  for (const lamp of lamps) {
    const gradient = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, lamp.r);
    gradient.addColorStop(0, lamp.color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawProp(p) {
  ctx.save();
  const x = p.x;
  const y = p.y;
  const w = p.w;
  const h = p.h;

  if (p.kind !== 'door') {
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 2, w * 0.48, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (p.kind === 'bed') {
    ctx.fillStyle = '#2d1a1a';
    rr(x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#5d3a35';
    rr(x + 5, y + 5, w - 10, h - 10, 6);
    ctx.fill();
    ctx.fillStyle = '#d9c9a7';
    rr(x + 13, y + 14, w - 26, h - 30, 8);
    ctx.fill();
    ctx.fillStyle = '#2f6d6c';
    rr(x + 13, y + 58, w - 26, h - 73, 7);
    ctx.fill();
    ctx.fillStyle = '#f1e8d5';
    rr(x + 24, y + 22, 74, 30, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,10,12,.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  } else if (p.kind === 'desk') {
    ctx.fillStyle = '#59392d';
    rr(x, y + 18, w, h - 18, 5);
    ctx.fill();
    ctx.fillStyle = '#7a513d';
    rr(x + 3, y + 3, w - 6, 22, 4);
    ctx.fill();
    ctx.fillStyle = '#e8c86f';
    ctx.beginPath();
    ctx.arc(x + 42, y + 34, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3c2934';
    ctx.fillRect(x + w - 52, y + 26, 38, 9);
    ctx.fillStyle = '#8f6b4c';
    ctx.fillRect(x + 12, y + h - 12, 8, 12);
    ctx.fillRect(x + w - 20, y + h - 12, 8, 12);
  } else if (p.kind === 'closet') {
    const isCat = p.id === 'catCloset';
    const highlight = state.phase === 'chase' && state.mode === 'chase';
    ctx.fillStyle = '#22141e';
    rr(x, y, w, h, 5);
    ctx.fill();
    ctx.fillStyle = isCat ? '#3c213c' : '#382b36';
    rr(x + 3, y + 3, w - 6, h - 6, 4);
    ctx.fill();
    ctx.strokeStyle = isCat ? '#71436f' : '#5b4558';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 6);
    ctx.lineTo(x + w / 2, y + h - 6);
    ctx.stroke();
    ctx.fillStyle = '#d8b66b';
    ctx.beginPath();
    ctx.arc(x + w / 2 - 7, y + h / 2 + 5, 3, 0, Math.PI * 2);
    ctx.arc(x + w / 2 + 7, y + h / 2 + 5, 3, 0, Math.PI * 2);
    ctx.fill();
    if (isCat && (state.mode === 'title' || state.phase === 'intro')) {
      const glow = 0.55 + Math.sin(state.time * 2.5) * 0.25;
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = 'rgba(255,215,80,.9)';
      ctx.fillStyle = `rgba(255,220,90,${glow})`;
      ctx.beginPath();
      ctx.ellipse(x + w / 2 - 12, y + 38, 5, 8, 0, 0, Math.PI * 2);
      ctx.ellipse(x + w / 2 + 12, y + 38, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (highlight) {
      const pulse = 0.4 + Math.sin(state.time * 5) * 0.25;
      ctx.strokeStyle = `rgba(255,236,180,${pulse})`;
      ctx.lineWidth = 3;
      rr(x - 4, y - 4, w + 8, h + 8, 7);
      ctx.stroke();
    }
  } else if (p.kind === 'fridge') {
    ctx.fillStyle = '#aeb9c2';
    rr(x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#d8e1e5';
    rr(x + 4, y + 4, w - 8, h * 0.38, 5);
    ctx.fill();
    ctx.strokeStyle = '#7a858d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h * 0.43);
    ctx.lineTo(x + w - 4, y + h * 0.43);
    ctx.stroke();
    ctx.fillStyle = '#59666d';
    ctx.fillRect(x + w - 15, y + 20, 5, 30);
    ctx.fillRect(x + w - 15, y + 76, 5, 26);
    ctx.fillStyle = '#d25353';
    ctx.beginPath();
    ctx.arc(x + 22, y + 26, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'counter') {
    ctx.fillStyle = '#3b2b28';
    rr(x, y, w, h, 4);
    ctx.fill();
    ctx.fillStyle = '#8a7965';
    rr(x - 3, y - 5, w + 6, 16, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.14)';
    ctx.strokeRect(x + 10, y + 24, w - 20, h - 34);
    ctx.fillStyle = '#b8a281';
    ctx.fillRect(x + 16, y + 20, 24, 8);
  } else if (p.kind === 'stove') {
    ctx.fillStyle = '#2a2a30';
    rr(x, y, w, h, 5);
    ctx.fill();
    ctx.fillStyle = '#3b3b44';
    rr(x + 4, y + 4, w - 8, h - 8, 4);
    ctx.fill();
    const burners = [
      [x + 28, y + 28], [x + 78, y + 28], [x + 28, y + 72], [x + 78, y + 72],
    ];
    for (const [bx, by] of burners) {
      ctx.fillStyle = '#1b1b20';
      ctx.beginPath();
      ctx.arc(bx, by, 13, 0, Math.PI * 2);
      ctx.fill();
      if (state.cooking && Math.random() < 0.7) {
        ctx.fillStyle = 'rgba(255,150,50,.55)';
        ctx.beginPath();
        ctx.arc(bx, by, 8 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#c7a35d';
    ctx.fillRect(x + 20, y + h - 14, 18, 5);
    ctx.fillRect(x + 46, y + h - 14, 18, 5);
  } else if (p.kind === 'sink') {
    ctx.fillStyle = '#4d525a';
    rr(x, y, w, h, 5);
    ctx.fill();
    ctx.fillStyle = '#c5d2d4';
    rr(x + 8, y + 8, w - 16, h - 22, 6);
    ctx.fill();
    ctx.fillStyle = '#6f8b8e';
    rr(x + 18, y + 18, w - 36, h - 42, 5);
    ctx.fill();
    ctx.strokeStyle = '#d4e0e2';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 10);
    ctx.lineTo(x + w / 2, y + 26);
    ctx.stroke();
  } else if (p.kind === 'table') {
    ctx.fillStyle = '#5a3d31';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7b5842';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 - 4, w / 2 - 8, h / 2 - 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8d0bd';
    ctx.beginPath();
    ctx.arc(x + w / 2 + 24, y + h / 2 - 4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a4a3c';
    ctx.beginPath();
    ctx.arc(x + w / 2 + 24, y + h / 2 - 4, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'sofa') {
    ctx.fillStyle = '#3a2d4a';
    rr(x, y, w, h, 12);
    ctx.fill();
    ctx.fillStyle = '#584070';
    rr(x + 10, y + 8, w - 20, h - 20, 9);
    ctx.fill();
    ctx.fillStyle = '#6c508a';
    rr(x + 18, y + 16, w / 2 - 22, h - 30, 8);
    ctx.fill();
    rr(x + w / 2 + 4, y + 16, w / 2 - 22, h - 30, 8);
    ctx.fill();
    ctx.fillStyle = '#241b30';
    ctx.fillRect(x + 6, y + h - 12, 16, 20);
    ctx.fillRect(x + w - 22, y + h - 12, 16, 20);
  } else if (p.kind === 'tv') {
    ctx.fillStyle = '#19161d';
    rr(x, y, w, h, 6);
    ctx.fill();
    ctx.fillStyle = '#0d1117';
    rr(x + 8, y + 7, w - 16, h - 14, 3);
    ctx.fill();
    ctx.fillStyle = `rgba(90,190,220,${0.08 + Math.random() * 0.09})`;
    ctx.fillRect(x + 12, y + 10, w - 24, h - 20);
    ctx.strokeStyle = 'rgba(180,230,255,.18)';
    ctx.lineWidth = 1;
    for (let yy = y + 13; yy < y + h - 10; yy += 4) {
      ctx.beginPath();
      ctx.moveTo(x + 12, yy);
      ctx.lineTo(x + w - 12, yy);
      ctx.stroke();
    }
    ctx.fillStyle = '#2a2630';
    ctx.fillRect(x + w / 2 - 14, y + h - 3, 28, 7);
  } else if (p.kind === 'coffee') {
    ctx.fillStyle = '#4c332a';
    rr(x, y, w, h, 8);
    ctx.fill();
    ctx.fillStyle = '#78513e';
    rr(x + 5, y + 4, w - 10, h - 12, 7);
    ctx.fill();
    ctx.fillStyle = '#e8e0cd';
    ctx.beginPath();
    ctx.arc(x + 44, y + 28, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3428';
    ctx.beginPath();
    ctx.arc(x + 44, y + 28, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#59424f';
    ctx.fillRect(x + 92, y + 18, 28, 7);
    ctx.fillRect(x + 98, y + 30, 16, 6);
  } else if (p.kind === 'bookshelf') {
    ctx.fillStyle = '#2b1c1b';
    rr(x, y, w, h, 4);
    ctx.fill();
    const colors = ['#b05252', '#c49a4a', '#5b8b74', '#6b6aa9', '#a06a8c'];
    for (let row = 0; row < 3; row++) {
      const yy = y + 10 + row * 28;
      ctx.fillStyle = '#4b342c';
      ctx.fillRect(x + 6, yy + 22, w - 12, 5);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = colors[(i + row) % colors.length];
        ctx.fillRect(x + 10 + i * 14, yy + 4 + rand(-1, 2), rand(5, 10), 18);
      }
    }
  } else if (p.kind === 'tub') {
    ctx.fillStyle = '#d6e2e3';
    rr(x, y, w, h, 26);
    ctx.fill();
    ctx.fillStyle = '#6fb3bf';
    rr(x + 12, y + 14, w - 24, h - 28, 20);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.44)';
    ctx.beginPath();
    ctx.ellipse(x + 52, y + 40, 20, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2d24d';
    ctx.beginPath();
    ctx.arc(x + 152, y + 54, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d17b32';
    ctx.beginPath();
    ctx.moveTo(x + 160, y + 52);
    ctx.lineTo(x + 168, y + 54);
    ctx.lineTo(x + 160, y + 57);
    ctx.fill();
  } else if (p.kind === 'toilet') {
    ctx.fillStyle = '#c9d7d8';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + 6, w / 2, h / 2 - 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8f1f1';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2 + 4, w / 2 - 12, h / 2 - 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9fb1b3';
    ctx.fillRect(x + w / 2 - 16, y + 2, 32, 13);
  } else if (p.kind === 'door') {
    ctx.fillStyle = '#4c2d22';
    rr(x, y, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = '#2a160f';
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = '#d8b66b';
    ctx.beginPath();
    ctx.arc(x + w - 14, y + h / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (state.phase === 'escape') {
      ctx.strokeStyle = `rgba(255,237,180,${0.5 + Math.sin(state.time * 4) * 0.25})`;
      ctx.lineWidth = 3;
      rr(x - 4, y - 4, w + 8, h + 8, 6);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawMess(item) {
  if (item.collected) return;
  const t = state.time;
  const bob = Math.sin(t * 3 + item.x * 0.02) * 2;
  ctx.save();
  ctx.translate(item.x, item.y + bob);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath();
  ctx.ellipse(0, 9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (item.kind === 'clothes') {
    ctx.fillStyle = '#c76f91';
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(-4, -11);
    ctx.lineTo(0, -6);
    ctx.lineTo(4, -11);
    ctx.lineTo(10, -8);
    ctx.lineTo(7, 0);
    ctx.lineTo(9, 8);
    ctx.lineTo(-9, 8);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#873f5d';
    ctx.fillRect(-4, -5, 8, 5);
  } else if (item.kind === 'toy') {
    ctx.fillStyle = '#d3a33f';
    rr(-9, -8, 18, 16, 3);
    ctx.fill();
    ctx.fillStyle = '#4a3046';
    ctx.fillRect(-5, -4, 4, 4);
    ctx.fillRect(2, -4, 4, 4);
    ctx.fillStyle = '#af6c30';
    ctx.fillRect(-12, -2, 3, 7);
    ctx.fillRect(9, -2, 3, 7);
  } else if (item.kind === 'paper') {
    ctx.fillStyle = '#e7dfc9';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b7ad92';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.lineTo(4, -3);
    ctx.moveTo(-3, 2);
    ctx.lineTo(3, 1);
    ctx.stroke();
  } else if (item.kind === 'sock') {
    ctx.fillStyle = '#7a8ec9';
    rr(-6, -10, 10, 18, 5);
    ctx.fill();
    ctx.fillStyle = '#e6e0cd';
    ctx.fillRect(-6, -7, 10, 4);
    ctx.fillStyle = '#7a8ec9';
    rr(2, 3, 9, 7, 4);
    ctx.fill();
  } else {
    ctx.fillStyle = '#8d9499';
    rr(-6, -9, 12, 18, 3);
    ctx.fill();
    ctx.fillStyle = '#c9ced1';
    rr(-5, -8, 4, 16, 2);
    ctx.fill();
    ctx.fillStyle = '#b44949';
    ctx.fillRect(-6, -1, 12, 4);
  }
  ctx.restore();
  drawItemSparkle(item.x, item.y - 18, '#c9a8ff');
}

function drawIngredient(item) {
  if (item.collected) return;
  const bob = Math.sin(state.time * 3 + item.x * 0.02) * 2;
  ctx.save();
  ctx.translate(item.x, item.y + bob);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (item.kind === 'egg') {
    ctx.fillStyle = '#f3ead6';
    ctx.beginPath();
    ctx.ellipse(0, -2, 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.beginPath();
    ctx.ellipse(-2, -5, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.kind === 'flour') {
    ctx.fillStyle = '#c9a77a';
    rr(-8, -11, 16, 21, 3);
    ctx.fill();
    ctx.fillStyle = '#eee2cb';
    ctx.fillRect(-6, -4, 12, 8);
    ctx.fillStyle = '#7a5c3a';
    ctx.font = 'bold 5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HARINA', 0, 1);
  } else {
    ctx.fillStyle = '#e9eef0';
    rr(-7, -11, 14, 21, 2);
    ctx.fill();
    ctx.fillStyle = '#5aa0c8';
    ctx.fillRect(-7, -4, 14, 8);
    ctx.fillStyle = '#2b4a61';
    ctx.beginPath();
    ctx.moveTo(-7, -11);
    ctx.lineTo(0, -16);
    ctx.lineTo(7, -11);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  drawItemSparkle(item.x, item.y - 20, '#ffd27a');
}

function drawItemSparkle(x, y, color) {
  const t = state.time;
  const pulse = 0.6 + Math.sin(t * 4 + x * 0.03) * 0.3;
  ctx.save();
  ctx.globalAlpha = pulse * 0.75;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  const size = 5 + Math.sin(t * 3 + y) * 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = pulse * 0.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFriendHint(friend) {
  if (friend.found) return;
  const t = state.time;
  const x = friend.x;
  const y = friend.y;
  const pulse = 0.4 + Math.sin(t * 3 + friend.x) * 0.2;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, 38);
  gradient.addColorStop(0, `rgba(70,180,255,${pulse * 0.4})`);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = pulse + 0.35;
  ctx.fillStyle = '#8bdcff';
  ctx.beginPath();
  ctx.ellipse(x, y, 6, 4, Math.sin(t * 2) * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a1a22';
  ctx.beginPath();
  ctx.arc(x, y - 1, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawItemSparkle(x + 10, y - 16, '#5ec8ff');
}

function drawPlayer() {
  if (state.mode === 'title' || state.player.hidden) return;
  const p = state.player;
  const t = state.time;
  const bob = p.moving ? Math.sin(p.walk) * 2 : Math.sin(t * 2) * 0.7;
  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 20, 17, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const angle = Math.atan2(p.dir.y, p.dir.x);
  ctx.save();
  ctx.translate(p.x, p.y - 6);
  ctx.rotate(angle);
  const cone = ctx.createLinearGradient(0, 0, 190, 0);
  cone.addColorStop(0, 'rgba(255,242,202,.16)');
  cone.addColorStop(0.55, 'rgba(255,232,170,.07)');
  cone.addColorStop(1, 'rgba(255,232,170,0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(190, -64);
  ctx.lineTo(190, 64);
  ctx.lineTo(0, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const legSwing = p.moving ? Math.sin(p.walk) * 5 : 0;
  ctx.strokeStyle = '#24253b';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x - 5, p.y + 7);
  ctx.lineTo(p.x - 6 + legSwing * 0.45, p.y + 20);
  ctx.moveTo(p.x + 5, p.y + 7);
  ctx.lineTo(p.x + 6 - legSwing * 0.45, p.y + 20);
  ctx.stroke();

  ctx.fillStyle = '#2e8f8a';
  rr(p.x - 12, p.y - 12 + bob, 24, 27, 8);
  ctx.fill();
  ctx.strokeStyle = '#0d2224';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.13)';
  rr(p.x - 8, p.y - 8 + bob, 8, 14, 4);
  ctx.fill();

  ctx.fillStyle = '#303f5d';
  rr(p.x - 9, p.y + 1 + bob, 18, 8, 3);
  ctx.fill();

  const hx = p.x + p.dir.x * 3;
  const hy = p.y - 19 + bob + p.dir.y * 2;
  ctx.fillStyle = '#e5b28d';
  ctx.beginPath();
  ctx.arc(hx, hy, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a241c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#3a241c';
  ctx.beginPath();
  ctx.arc(hx, hy - 4, 10.7, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(hx - 10.5, hy - 5, 21, 3);

  const ex = p.dir.x * 3.2;
  const ey = p.dir.y * 2.4;
  ctx.fillStyle = '#141018';
  ctx.beginPath();
  ctx.arc(hx - 3.5 + ex, hy + 1 + ey, 1.4, 0, Math.PI * 2);
  ctx.arc(hx + 3.5 + ex, hy + 1 + ey, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCat() {
  const cat = state.cat;
  if (!cat.visible) return;
  const t = state.time;
  let sx = 0;
  let sy = 0;
  let rot = 0;
  if (cat.convulsing) {
    sx = (Math.random() - 0.5) * 12;
    sy = (Math.random() - 0.5) * 10;
    rot = (Math.random() - 0.5) * 0.24;
  }
  const bob = Math.sin(t * 2.2) * 2;
  const chase = state.phase === 'chase' && state.mode !== 'hidden';
  const eyeColor = chase ? '#ff4d4d' : '#ffe36a';

  ctx.save();
  ctx.translate(cat.x + sx, cat.y + bob + sy);
  ctx.rotate(rot);

  ctx.fillStyle = 'rgba(0,0,0,.5)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 34, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  if (chase) {
    const aura = ctx.createRadialGradient(0, -42, 8, 0, -42, 90);
    aura.addColorStop(0, 'rgba(200,20,40,.24)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -42, 90, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#0a0810';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(20, -20);
  ctx.bezierCurveTo(62, -40 + Math.sin(t * 3) * 8, 54, 2, 82, -8);
  ctx.stroke();

  ctx.fillStyle = '#0b0911';
  rr(-22, -48, 44, 52, 16);
  ctx.fill();
  ctx.strokeStyle = '#2a1838';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = '#0b0911';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-14, -2);
  ctx.lineTo(-24, 14);
  ctx.moveTo(14, -2);
  ctx.lineTo(24, 14);
  ctx.stroke();
  ctx.strokeStyle = '#2a1838';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (cat.convulsing) {
    ctx.strokeStyle = '#0b0911';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-19, -36);
    ctx.lineTo(-48, -56 + Math.random() * 16);
    ctx.moveTo(19, -36);
    ctx.lineTo(48, -56 + Math.random() * 16);
    ctx.stroke();
  }

  const headY = -70;
  ctx.fillStyle = '#0b0911';
  ctx.beginPath();
  ctx.arc(0, headY, 29, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2f1c40';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#0b0911';
  ctx.beginPath();
  ctx.moveTo(-26, headY - 16);
  ctx.lineTo(-19, headY - 48);
  ctx.lineTo(-4, headY - 26);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(26, headY - 16);
  ctx.lineTo(19, headY - 48);
  ctx.lineTo(4, headY - 26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a2450';
  ctx.lineWidth = 2;
  ctx.stroke();

  const blink = Math.sin(t * 1.7) > 0.93 && !chase && !cat.convulsing;
  if (!blink) {
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = eyeColor;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(-11, headY - 2, 7, cat.convulsing ? 10 : 8, 0, 0, Math.PI * 2);
    ctx.ellipse(11, headY - 2, 7, cat.convulsing ? 10 : 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#160a10';
    ctx.beginPath();
    ctx.ellipse(-11 + (chase ? 2 : 0), headY - 1, 2, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(11 + (chase ? 2 : 0), headY - 1, 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = '#1a0710';
  ctx.beginPath();
  ctx.ellipse(0, headY + 16, 15, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f1e6cf';
  ctx.beginPath();
  ctx.moveTo(-10, headY + 14);
  ctx.lineTo(-6, headY + 21);
  ctx.lineTo(-2, headY + 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, headY + 14);
  ctx.lineTo(8, headY + 21);
  ctx.lineTo(12, headY + 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#3b1a5c';
  ctx.beginPath();
  ctx.ellipse(0, headY - 26, 36, 8, -0.08, 0, Math.PI * 2);
  ctx.fill();
  rr(-21, headY - 76, 42, 52, 6);
  ctx.fill();
  ctx.fillStyle = '#a11f38';
  ctx.fillRect(-21, headY - 47, 42, 10);
  ctx.strokeStyle = '#1b0c2a';
  ctx.lineWidth = 2;
  rr(-21, headY - 76, 42, 52, 6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  rr(-16, headY - 71, 7, 40, 3);
  ctx.fill();

  ctx.restore();
}

function drawFollowers() {
  state.followers.forEach((f, i) => drawBlob(f.x, f.y, i));
}

function drawBlob(x, y, index) {
  const t = state.time;
  const wob = Math.sin(t * 3 + index * 1.9) * 2.5;
  const r = 15 + Math.sin(t * 2.6 + index) * 1.5;
  ctx.save();
  ctx.translate(x, y + wob);
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath();
  ctx.ellipse(0, 15, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 18;
  ctx.shadowColor = 'rgba(70,190,255,.65)';
  const gradient = ctx.createRadialGradient(-5, -7, 2, 0, 0, r + 4);
  gradient.addColorStop(0, '#b8efff');
  gradient.addColorStop(0.45, '#5ec8ff');
  gradient.addColorStop(1, '#2a6fb0');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(8,35,55,.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r + 2, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f6feff';
  ctx.beginPath();
  ctx.ellipse(2, -4, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0d2738';
  ctx.beginPath();
  ctx.arc(4, -3, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(5, -5, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2b5e7e';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 5, 5, 0.15, Math.PI - 0.15);
  ctx.stroke();

  ctx.strokeStyle = '#5ec8ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, -13);
  ctx.lineTo(-8, -20);
  ctx.moveTo(6, -13);
  ctx.lineTo(9, -20);
  ctx.stroke();
  ctx.fillStyle = '#a8e8ff';
  ctx.beginPath();
  ctx.arc(-8, -21, 2, 0, Math.PI * 2);
  ctx.arc(9, -21, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawParticles() {
  for (const p of state.particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha * (p.type === 'smoke' ? 0.25 : 0.85);
    ctx.fillStyle = p.color;
    if (p.type === 'ember') {
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'smoke') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.6 - alpha * 0.6), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawDust() {
  ctx.save();
  for (const d of state.dust) {
    ctx.globalAlpha = clamp(d.life / d.maxLife, 0, 1) * 0.32;
    ctx.fillStyle = '#e9dbff';
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWorldMarkers() {
  if (state.phase === 'missions' && state.cat.visible && state.catReady) {
    const bob = Math.sin(state.time * 4) * 5;
    ctx.save();
    ctx.font = 'bold 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 16;
    ctx.shadowColor = 'rgba(255,220,100,.9)';
    ctx.fillStyle = '#ffe36a';
    ctx.fillText('!', state.cat.x, state.cat.y - 118 + bob);
    ctx.restore();
  }
  if (state.phase === 'chase' && state.mode === 'chase') {
    const t = state.time;
    for (const closet of CLOSETS) {
      const pulse = 0.5 + Math.sin(t * 5 + closet.x) * 0.3;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ffe8b0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(closet.spot.x, closet.spot.y, 34 + Math.sin(t * 3) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

window.addEventListener('resize', resize);
resize();
