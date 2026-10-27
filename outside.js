import { state, view, WORLD, HOUSE, HOUSE_DOOR, rand, clamp } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawTree(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#2a1e1c';
  ctx.fillRect(-8, -40, 16, 100);
  ctx.fillStyle = '#1b2a1c';
  ctx.beginPath();
  ctx.arc(-24, -54, 34, 0, Math.PI * 2);
  ctx.arc(20, -68, 40, 0, Math.PI * 2);
  ctx.arc(2, -100, 36, 0, Math.PI * 2);
  ctx.arc(34, -34, 30, 0, Math.PI * 2);
  ctx.arc(-30, -20, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHouse(ctx, t) {
  const { x, y, w, h } = HOUSE;
  const fire = state.fire;
  const glow = 0.55 + Math.sin(t * 4.2) * 0.2;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.38)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h + 18, w * 0.55, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = fire ? '#2a1a16' : '#2b2228';
  ctx.fillRect(x, y + 150, w, h - 150);

  ctx.fillStyle = fire ? '#241512' : '#342a30';
  ctx.beginPath();
  ctx.moveTo(x - 45, y + 170);
  ctx.lineTo(x + w / 2, y - 40);
  ctx.lineTo(x + w + 45, y + 170);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = fire ? 'rgba(255,120,40,.35)' : 'rgba(255,255,255,.06)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#1c1316';
  ctx.fillRect(x + w - 180, y - 10, 48, 110);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(x + w - 180, y - 10, 48, 110);

  ctx.fillStyle = 'rgba(0,0,0,.22)';
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(x + 60 + i * 68, y + 210, 44, 6);
  }

  const windows = [
    { x: x + 110, y: y + 220, w: 110, h: 100 },
    { x: x + 330, y: y + 220, w: 110, h: 100 },
    { x: x + 560, y: y + 220, w: 110, h: 100 },
  ];
  for (const win of windows) {
    const warm = fire ? `rgba(255,${90 + Math.random() * 60},30,.92)` : 'rgba(255,196,106,.72)';
    ctx.fillStyle = warm;
    ctx.fillRect(win.x, win.y, win.w, win.h);
    ctx.strokeStyle = '#1b1110';
    ctx.lineWidth = 5;
    ctx.strokeRect(win.x, win.y, win.w, win.h);
    ctx.beginPath();
    ctx.moveTo(win.x + win.w / 2, win.y);
    ctx.lineTo(win.x + win.w / 2, win.y + win.h);
    ctx.moveTo(win.x, win.y + win.h / 2);
    ctx.lineTo(win.x + win.w, win.y + win.h / 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    ctx.fillRect(win.x + 8, win.y + 8, win.w * 0.25, win.h - 16);
  }

  const doorX = HOUSE_DOOR.x;
  const doorY = y + h - 118;
  ctx.fillStyle = fire ? '#3a1c12' : '#4c2d22';
  ctx.fillRect(doorX - 48, doorY, 96, 118);
  ctx.strokeStyle = '#1a0e0a';
  ctx.lineWidth = 5;
  ctx.strokeRect(doorX - 48, doorY, 96, 118);
  ctx.fillStyle = '#d8b66b';
  ctx.beginPath();
  ctx.arc(doorX + 32, doorY + 58, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.34)';
  ctx.fillRect(HOUSE.x, y + h - 12, 260, 12);
  ctx.fillRect(HOUSE.x + w - 260, y + h - 12, 260, 12);

  ctx.fillStyle = '#3c302e';
  ctx.fillRect(doorX - 70, y + h - 10, 140, 16);
  ctx.fillStyle = '#2a2220';
  ctx.fillRect(doorX - 82, y + h + 6, 164, 12);

  if (fire) {
    for (const win of windows) {
      const flameHeight = 60 + Math.sin(t * 9 + win.x) * 26;
      const grad = ctx.createLinearGradient(0, win.y, 0, win.y - flameHeight);
      grad.addColorStop(0, 'rgba(255,220,80,.98)');
      grad.addColorStop(0.5, 'rgba(255,110,30,.9)');
      grad.addColorStop(1, 'rgba(200,20,10,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(win.x + 6, win.y + win.h);
      ctx.quadraticCurveTo(win.x - 14, win.y + 20, win.x + win.w / 2, win.y - flameHeight);
      ctx.quadraticCurveTo(win.x + win.w + 14, win.y + 20, win.x + win.w - 6, win.y + win.h);
      ctx.closePath();
      ctx.fill();
    }
    const roofGrad = ctx.createLinearGradient(0, y - 30, 0, y + 120);
    roofGrad.addColorStop(0, 'rgba(255,180,60,0)');
    roofGrad.addColorStop(1, 'rgba(255,100,20,.5)');
    ctx.fillStyle = roofGrad;
    ctx.beginPath();
    ctx.moveTo(x - 45, y + 170);
    ctx.lineTo(x + w / 2, y - 40);
    ctx.lineTo(x + w + 45, y + 170);
    ctx.closePath();
    ctx.fill();

    const glowGrad = ctx.createRadialGradient(x + w / 2, y + 260, 30, x + w / 2, y + 260, 430);
    glowGrad.addColorStop(0, 'rgba(255,150,50,.3)');
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 260, 430, 0, Math.PI * 2);
    ctx.fill();
  }

  if (fire && state.burnTimer > 2.4) {
    const win = windows[1];
    ctx.save();
    ctx.translate(win.x + win.w / 2, win.y + 62);
    ctx.fillStyle = '#08060a';
    ctx.beginPath();
    ctx.arc(0, 12, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-24, -6);
    ctx.lineTo(-16, -36);
    ctx.lineTo(-2, -16);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(24, -6);
    ctx.lineTo(16, -36);
    ctx.lineTo(2, -16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(255,220,70,${glow})`;
    ctx.beginPath();
    ctx.ellipse(-8, 10, 5, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(8, 10, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3b1a5c';
    ctx.fillRect(-18, -44, 36, 22);
    ctx.fillStyle = '#a11f38';
    ctx.fillRect(-18, -30, 36, 6);
    ctx.restore();
    ctx.save();
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,230,180,${0.7 + Math.sin(t * 7) * 0.2})`;
    ctx.fillText('¡MIAU!', win.x + win.w / 2 + 40, win.y - 12);
    ctx.restore();
  }
}

function drawGasCan(ctx, t) {
  if (state.gasTaken) return;
  ctx.save();
  ctx.translate(300, 760 + Math.sin(t * 3) * 2);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath();
  ctx.ellipse(0, 18, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b8402f';
  rr(ctx, -15, -18, 30, 36, 6);
  ctx.fill();
  ctx.strokeStyle = '#5f1d17';
  ctx.lineWidth = 3;
  rr(ctx, -15, -18, 30, 36, 6);
  ctx.stroke();
  ctx.strokeStyle = '#d9c9a7';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(5, -18);
  ctx.lineTo(15, -32);
  ctx.lineTo(24, -32);
  ctx.stroke();
  ctx.fillStyle = '#e6dcc4';
  ctx.fillRect(-7, -8, 14, 7);
  ctx.restore();
}

function drawMatches(ctx, t) {
  if (state.matchesTaken) return;
  ctx.save();
  ctx.translate(1300, 800 + Math.sin(t * 3 + 2) * 2);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9a760';
  rr(ctx, -13, -10, 26, 20, 3);
  ctx.fill();
  ctx.strokeStyle = '#6c4b26';
  ctx.lineWidth = 2;
  rr(ctx, -13, -10, 26, 20, 3);
  ctx.stroke();
  ctx.fillStyle = '#7a2f2a';
  ctx.fillRect(-9, -5, 18, 4);
  ctx.fillStyle = '#e7ddc3';
  ctx.fillRect(-6, 2, 12, 3);
  ctx.restore();
}

function drawPlayerOutside(ctx, t) {
  const p = state.player;
  const bob = p.moving ? Math.sin(p.walk) * 2 : Math.sin(t * 2) * 0.7;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 20, 17, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const angle = Math.atan2(p.dir.y, p.dir.x);
  ctx.save();
  ctx.translate(p.x, p.y - 6);
  ctx.rotate(angle);
  const cone = ctx.createLinearGradient(0, 0, 200, 0);
  cone.addColorStop(0, 'rgba(255,242,202,.17)');
  cone.addColorStop(1, 'rgba(255,232,170,0)');
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(200, -68);
  ctx.lineTo(200, 68);
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
  rr(ctx, p.x - 12, p.y - 12 + bob, 24, 27, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.13)';
  rr(ctx, p.x - 8, p.y - 8 + bob, 8, 14, 4);
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
  ctx.fillStyle = '#141018';
  const ex = p.dir.x * 3.2;
  const ey = p.dir.y * 2.4;
  ctx.beginPath();
  ctx.arc(hx - 3.5 + ex, hy + 1 + ey, 1.4, 0, Math.PI * 2);
  ctx.arc(hx + 3.5 + ex, hy + 1 + ey, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFriendsOutside(ctx, t) {
  state.followers.forEach((f, i) => {
    const wob = Math.sin(t * 3 + i * 1.9) * 2.5;
    ctx.save();
    ctx.translate(f.x, f.y + wob);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    const gradient = ctx.createRadialGradient(-4, -6, 2, 0, 0, 18);
    gradient.addColorStop(0, '#b8efff');
    gradient.addColorStop(0.5, '#5ec8ff');
    gradient.addColorStop(1, '#2a6fb0');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6feff';
    ctx.beginPath();
    ctx.ellipse(2, -4, 6, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d2738';
    ctx.beginPath();
    ctx.arc(4, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawOutsideParticles(ctx) {
  for (const p of state.particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha * (p.type === 'smoke' ? 0.24 : 0.9);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.type === 'smoke' ? p.size * (1.6 - alpha * 0.6) : p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawOutside(ctx) {
  const t = state.time;

  const sky = ctx.createLinearGradient(0, 0, 0, 700);
  sky.addColorStop(0, '#060914');
  sky.addColorStop(0.55, '#101426');
  sky.addColorStop(1, '#1a1d24');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WORLD.w, 700);

  if (state.stars.length === 0) {
    for (let i = 0; i < 130; i++) {
      state.stars.push({
        x: rand(0, WORLD.w), y: rand(0, 520), r: rand(0.5, 1.8), a: rand(0.2, 0.9),
      });
    }
  }
  for (const s of state.stars) {
    ctx.globalAlpha = s.a * (0.7 + Math.sin(t * 1.4 + s.x) * 0.3);
    ctx.fillStyle = '#dfe8ff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const moon = ctx.createRadialGradient(1290, 150, 10, 1290, 150, 110);
  moon.addColorStop(0, 'rgba(240,235,210,.95)');
  moon.addColorStop(1, 'rgba(240,235,210,0)');
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(1290, 150, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#efe9d2';
  ctx.beginPath();
  ctx.arc(1290, 150, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(170,165,145,.28)';
  ctx.beginPath();
  ctx.arc(1274, 138, 9, 0, Math.PI * 2);
  ctx.arc(1306, 164, 12, 0, Math.PI * 2);
  ctx.arc(1298, 128, 5, 0, Math.PI * 2);
  ctx.fill();

  const ground = ctx.createLinearGradient(0, 600, 0, 1000);
  ground.addColorStop(0, '#22271f');
  ground.addColorStop(1, '#11130f');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 600, WORLD.w, 400);

  ctx.strokeStyle = 'rgba(120,150,100,.12)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 220; i++) {
    const gx = (i * 97) % WORLD.w;
    const gy = 620 + ((i * 43) % 350);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + 3, gy - 8);
    ctx.stroke();
  }

  ctx.fillStyle = '#4c4636';
  ctx.beginPath();
  ctx.moveTo(760, 620);
  ctx.lineTo(860, 620);
  ctx.lineTo(980, 1000);
  ctx.lineTo(620, 1000);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,230,180,.1)';
  ctx.lineWidth = 3;
  ctx.stroke();

  drawTree(ctx, 180, 610, 0.9);
  drawTree(ctx, 1420, 580, 1.1);

  ctx.strokeStyle = '#2b2b22';
  ctx.lineWidth = 7;
  for (let x = 130; x < 1480; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, 960);
    ctx.lineTo(x, 872);
    ctx.stroke();
  }
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(120, 888);
  ctx.lineTo(1480, 888);
  ctx.moveTo(120, 944);
  ctx.lineTo(1480, 944);
  ctx.stroke();

  drawHouse(ctx, t);
  drawGasCan(ctx, t);
  drawMatches(ctx, t);
  drawPlayerOutside(ctx, t);
  drawFriendsOutside(ctx, t);

  if (!state.gasTaken) {
    ctx.save();
    ctx.globalAlpha = 0.7 + Math.sin(t * 4) * 0.2;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffc46b';
    ctx.fillText('!', 300, 720);
    ctx.restore();
  }
  if (!state.matchesTaken) {
    ctx.save();
    ctx.globalAlpha = 0.7 + Math.sin(t * 4 + 2) * 0.2;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffc46b';
    ctx.fillText('!', 1300, 760);
    ctx.restore();
  }
  if (state.gasTaken && state.matchesTaken && !state.fire) {
    ctx.save();
    ctx.globalAlpha = 0.65 + Math.sin(t * 4) * 0.2;
    ctx.strokeStyle = '#ffd28a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(HOUSE_DOOR.x, HOUSE_DOOR.y, 54 + Math.sin(t * 3) * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawOutsideParticles(ctx);
}
