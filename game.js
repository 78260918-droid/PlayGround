import {
  ui, state, view, quests, WORLD, CLOSETS, MESS, INGREDIENTS, FRIENDS,
  clamp, rand, dist, wait, canStand,
} from './state.js';
import { audio } from './audio.js';
import { render, snapCamera } from './render.js';

let dialogueState = null;
let isTouch = false;
const keys = new Set();
const touchInput = { x: 0, y: 0, active: false };

/* ------------------------------------------------------------------ */
/* UI helpers                                                         */
/* ------------------------------------------------------------------ */

function setObjective(text) {
  state.objective = text;
  ui.objective.textContent = text;
}

function toast(text, duration = 2600) {
  ui.toast.textContent = text;
  ui.toast.classList.add('show');
  state.toastTimer = duration / 1000;
}

function renderQuests() {
  if (state.phase === 'outside') {
    ui.panelTitle.textContent = 'VENGANZA';
    ui.missionList.innerHTML =
      `<li class="${state.gasTaken ? 'done' : ''}"><span class="mark">${state.gasTaken ? '✓' : '○'}</span><span>Gasolina</span></li>` +
      `<li class="${state.matchesTaken ? 'done' : ''}"><span class="mark">${state.matchesTaken ? '✓' : '○'}</span><span>Fósforos</span></li>`;
  } else if (state.phase === 'chase' || state.phase === 'escape') {
    ui.panelTitle.textContent = 'SOBREVIVE';
    ui.missionList.innerHTML =
      `<li class="done"><span class="mark">✓</span><span>Las tres misiones</span></li>` +
      `<li class="${state.phase === 'escape' ? 'done' : ''}"><span class="mark">${state.phase === 'escape' ? '✓' : '○'}</span><span>${state.phase === 'escape' ? 'Sal de la casa' : 'Escóndete en un armario'}</span></li>`;
  } else {
    ui.panelTitle.textContent = 'MISIONES DEL GATO';
    const cookText = quests.cook.done
      ? 'Pastel de atún listo'
      : quests.cook.count < 3
        ? `Cocinar: ${quests.cook.count}/3 ingredientes`
        : 'Cocinar: usa la cocina';
    ui.missionList.innerHTML =
      `<li class="${quests.clean.done ? 'done' : ''}"><span class="mark">${quests.clean.done ? '✓' : '○'}</span><span>Ordenar el cuarto: ${quests.clean.count}/5</span></li>` +
      `<li class="${quests.cook.done ? 'done' : ''}"><span class="mark">${quests.cook.done ? '✓' : '○'}</span><span>${cookText}</span></li>` +
      `<li class="${quests.friends.done ? 'done' : ''}"><span class="mark">${quests.friends.done ? '✓' : '○'}</span><span>Amigos azules: ${quests.friends.count}/3</span></li>`;
  }
  ui.objective.textContent = state.objective;
}

function renderDialogue() {
  if (!dialogueState) return;
  const line = dialogueState.lines[dialogueState.index] || '';
  ui.dialogueText.textContent = line.slice(0, Math.floor(dialogueState.chars));
  ui.speaker.textContent = dialogueState.speaker;
}

function say(speaker, lines) {
  if (!Array.isArray(lines)) lines = [lines];
  return new Promise((resolve) => {
    dialogueState = { speaker, lines, index: 0, chars: 0, resolve };
    ui.dialogue.classList.remove('hidden');
    ui.prompt.classList.add('hidden');
    renderDialogue();
    audio.tone(520, 0.06, 'sine', 0.03);
  });
}

function advanceDialogue() {
  if (!dialogueState) return;
  const line = dialogueState.lines[dialogueState.index] || '';
  if (dialogueState.chars < line.length) {
    dialogueState.chars = line.length;
    renderDialogue();
    return;
  }
  dialogueState.index += 1;
  if (dialogueState.index >= dialogueState.lines.length) {
    const finish = dialogueState.resolve;
    dialogueState = null;
    ui.dialogue.classList.add('hidden');
    ui.dialogueText.textContent = '';
    finish();
    return;
  }
  dialogueState.chars = 0;
  renderDialogue();
  audio.tone(560, 0.05, 'sine', 0.025);
}

async function flavor(speaker, lines) {
  const previous = state.mode;
  if (state.mode === 'play' || state.mode === 'chase') state.mode = 'cutscene';
  await say(speaker, lines);
  if (state.mode === 'cutscene') state.mode = previous;
}

/* ------------------------------------------------------------------ */
/* Input                                                              */
/* ------------------------------------------------------------------ */

function action() {
  if (state.mode === 'title' || state.mode === 'ending' || state.paused) return;
  if (dialogueState) {
    advanceDialogue();
    return;
  }
  if (state.mode === 'cutscene' || state.mode === 'hidden' || state.mode === 'burning') return;
  if (state.cooking) return;
  const target = nearestInteraction();
  if (target) target.act();
}

function togglePause() {
  if (state.mode === 'title' || state.mode === 'ending' || state.mode === 'cutscene' || state.mode === 'hidden' || state.mode === 'burning') return;
  state.paused = !state.paused;
  ui.pause.classList.toggle('hidden', !state.paused);
  if (state.paused) {
    touchInput.active = false;
    touchInput.x = 0;
    touchInput.y = 0;
    ui.knob.style.transform = '';
  }
}

function setupInput() {
  window.addEventListener('keydown', (event) => {
    const k = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter'].includes(k)) event.preventDefault();
    keys.add(k);
    if (k === 'escape') {
      togglePause();
      return;
    }
    if (k === 'e' || k === ' ' || k === 'enter') {
      if (dialogueState) advanceDialogue();
      else action();
    }
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
  });

  window.addEventListener('blur', () => {
    keys.clear();
    touchInput.active = false;
    touchInput.x = 0;
    touchInput.y = 0;
    ui.knob.style.transform = '';
  });

  ui.dialogue.addEventListener('click', () => advanceDialogue());
  ui.action.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    action();
  });

  let stickPointer = null;
  const updateStick = (event) => {
    const rect = ui.stick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = event.clientX - cx;
    let dy = event.clientY - cy;
    const max = rect.width * 0.31;
    const length = Math.hypot(dx, dy);
    if (length > max) {
      dx = (dx / length) * max;
      dy = (dy / length) * max;
    }
    touchInput.x = dx / max;
    touchInput.y = dy / max;
    touchInput.active = true;
    ui.knob.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  ui.stick.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    stickPointer = event.pointerId;
    ui.stick.setPointerCapture(event.pointerId);
    updateStick(event);
  });
  ui.stick.addEventListener('pointermove', (event) => {
    if (event.pointerId === stickPointer) updateStick(event);
  });
  const releaseStick = (event) => {
    if (event.pointerId !== stickPointer) return;
    stickPointer = null;
    touchInput.active = false;
    touchInput.x = 0;
    touchInput.y = 0;
    ui.knob.style.transform = '';
  };
  ui.stick.addEventListener('pointerup', releaseStick);
  ui.stick.addEventListener('pointercancel', releaseStick);
  ui.stick.addEventListener('lostpointercapture', releaseStick);
}

/* ------------------------------------------------------------------ */
/* Start                                                              */
/* ------------------------------------------------------------------ */

function startGame() {
  if (state.mode !== 'title') return;
  audio.init();
  audio.startAmbience();
  ui.title.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  document.body.classList.remove('title-mode');
  state.mode = 'play';
  state.phase = 'intro';
  state.player.x = 330;
  state.player.y = 420;
  state.player.hidden = false;
  state.player.dir = { x: 0, y: 1 };
  state.cat.visible = false;
  state.cat.x = 430;
  state.cat.y = 875;
  setObjective('Algo te observa desde el armario. Acércate y pulsa E.');
  renderQuests();
  snapCamera();
  toast('El armario está entreabierto...', 3000);
  if (isTouch) {
    document.body.classList.add('touch-mode');
    ui.touchUI.classList.remove('hidden');
  }
}

function addFollower(friend) {
  state.followers.push({ id: friend.id, x: friend.x, y: friend.y, wobble: Math.random() * Math.PI * 2 });
}

function checkMissions() {
  if (!quests.clean.done && quests.clean.count >= quests.clean.total) {
    quests.clean.done = true;
    audio.quest();
    toast('Cuarto ordenado. El Gato aprueba con un gesto lento.', 3000);
  }
  if (!quests.friends.done && quests.friends.count >= quests.friends.total) {
    quests.friends.done = true;
    audio.quest();
    toast('Los tres azules te siguen. Huelen a piscina.', 3000);
  }
  if (!state.allComplete && quests.clean.done && quests.cook.done && quests.friends.done) {
    state.allComplete = true;
    state.catReady = true;
    state.objective = 'Habla con el Gato en la sala.';
    toast('¡Las tres misiones están completas!', 3600);
    audio.quest();
  }
  renderQuests();
}

/* ------------------------------------------------------------------ */
/* Interactions                                                       */
/* ------------------------------------------------------------------ */

function nearestInteraction() {
  const list = getInteractions();
  let best = null;
  let bestDistance = Infinity;
  for (const item of list) {
    const d = dist(state.player.x, state.player.y, item.x, item.y);
    if (d <= (item.r || 82) && d < bestDistance) {
      best = item;
      bestDistance = d;
    }
  }
  return best;
}

function getInteractions() {
  const out = [];

  if (state.phase === 'intro') {
    out.push({ x: 650, y: 218, r: 92, label: 'Abrir el armario del Gato', act: introScare });
    return out;
  }

  if (state.phase === 'missions') {
    for (const item of MESS) {
      if (!item.collected) {
        out.push({ x: item.x, y: item.y, r: 78, label: `Recoger ${item.label}`, act: () => collectMess(item) });
      }
    }
    for (const item of INGREDIENTS) {
      if (!item.collected) {
        out.push({ x: item.x, y: item.y, r: 78, label: `Coger ${item.label}`, act: () => collectIngredient(item) });
      }
    }
    if (!quests.cook.done) {
      out.push({
        x: 1315, y: 230, r: 88,
        label: quests.cook.count < 3 ? 'Mirar la cocina' : 'Cocinar el pastel',
        act: useStove,
      });
    }
    for (const friend of FRIENDS) {
      if (!friend.found) {
        out.push({ x: friend.x, y: friend.y, r: 86, label: 'Investigar el ruido azul', act: () => findFriend(friend) });
      }
    }
    if (state.cat.visible) {
      out.push({ x: state.cat.x, y: state.cat.y, r: 92, label: 'Hablar con el Gato', act: talkToCat });
    }
    for (const closet of CLOSETS) {
      out.push({ x: closet.spot.x, y: closet.spot.y, r: 76, label: 'Mirar el armario', act: () => inspectCloset(closet) });
    }
    out.push({ x: 800, y: 918, r: 82, label: 'Probar la puerta', act: tryFrontDoor });
    return out;
  }

  if (state.phase === 'chase') {
    for (const closet of CLOSETS) {
      out.push({ x: closet.spot.x, y: closet.spot.y, r: 88, label: 'Esconderme aquí', act: () => hideInCloset(closet) });
    }
    out.push({ x: 800, y: 918, r: 82, label: 'La puerta está cerrada', act: tryFrontDoor });
    return out;
  }

  if (state.phase === 'escape') {
    out.push({ x: 800, y: 918, r: 96, label: 'Salir de la casa', act: goOutside });
    for (const closet of CLOSETS) {
      out.push({
        x: closet.spot.x, y: closet.spot.y, r: 72, label: 'Respirar un momento',
        act: () => flavor('TÚ', ['No. Nunca más. Nunca jamás.']),
      });
    }
    return out;
  }

  if (state.phase === 'outside') {
    if (!state.gasTaken) out.push({ x: 300, y: 760, r: 86, label: 'Coger la gasolina', act: takeGas });
    if (!state.matchesTaken) out.push({ x: 1300, y: 800, r: 86, label: 'Coger los fósforos', act: takeMatches });
    out.push({
      x: 800, y: 618, r: 112,
      label: state.gasTaken && state.matchesTaken ? 'Quemar la casa' : 'Acercarse a la casa',
      act: burnHouse,
    });
  }

  return out;
}

function collectMess(item) {
  if (item.collected) return;
  item.collected = true;
  quests.clean.count += 1;
  audio.pickup();
  spawnPuff(item.x, item.y, '#c9a8ff');
  toast(`Recogido: ${item.label}`, 1500);
  checkMissions();
}

function collectIngredient(item) {
  if (item.collected) return;
  item.collected = true;
  quests.cook.count += 1;
  audio.pickup();
  spawnPuff(item.x, item.y, '#ffd27a');
  if (quests.cook.count >= 3) {
    toast('Ingredientes listos. Usa la cocina (E).', 3000);
    setObjective('Cocina el pastel de atún en la cocina.');
  } else {
    toast(`Cogido: ${item.label} (${quests.cook.count}/3)`, 1500);
  }
  renderQuests();
}

async function inspectCloset(closet) {
  if (closet.id === 'catCloset') await flavor('TÚ', ['Huele a gato y a galletas viejas. Mejor no preguntar.']);
  else if (closet.id === 'pantry') await flavor('TÚ', ['Hay latas, un ojo azul y algo que se mueve. Normal.']);
  else if (closet.id === 'bathCloset') await flavor('TÚ', ['Solo hay toallas húmedas. Y una risita pequeñita.']);
  else await flavor('TÚ', ['Solo hay abrigos. Uno de ellos respira.']);
}

async function useStove() {
  if (state.cooking || quests.cook.done) return;
  if (quests.cook.count < 3) {
    await flavor('TÚ', ['Me faltan ingredientes. El Gato quiere pastel de atún... no preguntes.']);
    return;
  }
  state.cooking = true;
  ui.prompt.classList.add('hidden');
  ui.cookHud.classList.remove('hidden');
  ui.cookFill.style.transition = 'none';
  ui.cookFill.style.width = '0%';
  void ui.cookFill.offsetWidth;
  ui.cookFill.style.transition = 'width 2.4s linear';
  ui.cookFill.style.width = '100%';
  audio.cook();
  await wait(2600);
  ui.cookHud.classList.add('hidden');
  ui.cookFill.style.transition = 'none';
  ui.cookFill.style.width = '0%';
  state.cooking = false;
  quests.cook.done = true;
  setObjective('Vuelve con el Gato cuando termines las tres misiones.');
  toast('¡Pastel de atún listo! Huele a error.', 3200);
  audio.quest();
  checkMissions();
}

async function findFriend(friend) {
  if (friend.found) return;
  friend.found = true;
  quests.friends.count += 1;
  audio.friend();
  spawnPuff(friend.x, friend.y, '#5ec8ff');
  addFollower(friend);
  toast(`Amigo azul encontrado (${quests.friends.count}/3)`, 2200);
  await flavor(friend.name, friend.lines);
  if (quests.friends.count >= 3) setObjective('Vuelve con el Gato cuando termines las tres misiones.');
  checkMissions();
}

async function tryFrontDoor() {
  await flavor('TÚ', ['Está cerrada. El Gato tiene la llave. Y una sonrisa muy grande.']);
}

async function talkToCat() {
  if (state.mode !== 'play') return;
  if (!state.allComplete) {
    const missing = [];
    if (!quests.clean.done) missing.push('ordenar el cuarto');
    if (!quests.cook.done) missing.push('cocinar el pastel');
    if (!quests.friends.done) missing.push('encontrar a los azules');
    state.mode = 'cutscene';
    await say('EL GATO', [
      `Todavía no. Te falta ${missing.join(' y ')}.`,
      'No me hagas esperar. Cuando me aburro, las paredes sangran un poquito.',
    ]);
    if (state.mode === 'cutscene') state.mode = 'play';
    return;
  }

  state.mode = 'cutscene';
  state.cat.visible = true;
  await say('EL GATO', [
    '¿Todo hecho? Qué eficiencia tan... humana.',
    'Ahora mira lo que hace el Gato cuando se emociona.',
  ]);

  state.cat.convulsing = true;
  audio.glitch();
  for (let i = 0; i < 12; i++) {
    state.shake = 0.9;
    state.redFlash = i % 2 ? 0.32 : 0.08;
    audio.tone(rand(70, 190), 0.12, 'square', 0.09, rand(30, 80));
    await wait(165);
  }
  state.redFlash = 0;
  state.cat.convulsing = false;
  state.shake = 0.5;
  await say('EL GATO', ['MIAU. MIAU. MIAU.', 'ESCONDITE. AHORA.']);

  state.phase = 'chase';
  state.mode = 'chase';
  state.cat.chaseGrace = 2.1;
  state.danger = 0;
  setObjective('¡Escóndete en un armario! Pulsa E cerca de una puerta.');
  renderQuests();
  audio.scare();
  toast('¡CORRE!', 1900);
}

async function introScare() {
  if (state.mode !== 'play') return;
  state.mode = 'cutscene';
  ui.prompt.classList.add('hidden');
  audio.scare();
  state.shake = 1.4;
  state.redFlash = 0.55;
  ui.jumpscare.classList.remove('hidden');
  await wait(1250);
  ui.jumpscare.classList.add('hidden');
  state.redFlash = 0;
  state.cat.visible = true;
  state.cat.x = 650;
  state.cat.y = 250;
  audio.meow();

  await say('TÚ', ['¿Por qué hay un gato viviendo en mi armario?']);
  await say('EL GATO', [
    '¡MIAU! ¿Te asusté? Era broma. Más o menos.',
    'Soy el Gato del Sombrero. Vivo aquí desde el martes.',
    'Tengo tres misiones para ti: ordena tu cuarto, cocina algo rico y encuentra a mis amigos azules.',
    'Son un poco raros, pero no muerden. Creo. Cuando termines, ven a la sala.',
  ]);

  spawnPuff(650, 250, '#8a5bd6');
  state.cat.x = 430;
  state.cat.y = 875;
  state.phase = 'missions';
  state.mode = 'play';
  setObjective('Completa las 3 misiones y vuelve con el Gato.');
  renderQuests();
  toast('3 misiones desbloqueadas', 3000);
}

function hideInCloset(closet) {
  if (state.mode !== 'chase') return;
  state.mode = 'hidden';
  state.player.hidden = true;
  state.hideCloset = closet;
  state.hideTimer = 0;
  state.cat.huntTarget = { x: closet.spot.x + 20, y: closet.spot.y + 44 };
  ui.hideHud.classList.remove('hidden');
  ui.hideFill.style.width = '0%';
  ui.prompt.classList.add('hidden');
  setObjective('No hagas ruido...');
  audio.meow();
  audio.startHeartbeat();
}

function finishHiding() {
  state.mode = 'play';
  state.phase = 'escape';
  state.player.hidden = false;
  state.cat.visible = false;
  state.cat.huntTarget = null;
  ui.hideHud.classList.add('hidden');
  ui.hideFill.style.width = '0%';
  audio.stopHeartbeat();
  setObjective('El Gato salió de la casa. Sal por la puerta principal.');
  renderQuests();
  toast('El Gato se fue... la puerta está libre.', 3400);
}

function goOutside() {
  if (state.phase !== 'escape') return;
  state.scene = 'outside';
  state.phase = 'outside';
  state.mode = 'play';
  state.player.x = 800;
  state.player.y = 850;
  state.player.hidden = false;
  state.player.dir = { x: 0, y: -1 };
  setObjective('Consigue gasolina y fósforos. Luego... ya sabes.');
  renderQuests();
  snapCamera();
  audio.stopHeartbeat();
  audio.meow();
  toast('Estás fuera. Pero esto no ha terminado.', 3400);
}

async function takeGas() {
  if (state.gasTaken) return;
  state.gasTaken = true;
  audio.pickup();
  spawnPuff(300, 760, '#ffb36b');
  await flavor('TÚ', ['Gasolina. No pregunten.']);
  renderQuests();
  if (state.gasTaken && state.matchesTaken) setObjective('Quema la casa. Pulsa E frente a la puerta.');
}

async function takeMatches() {
  if (state.matchesTaken) return;
  state.matchesTaken = true;
  audio.pickup();
  spawnPuff(1300, 800, '#ffd27a');
  await flavor('TÚ', ['Fósforos. Un clásico.']);
  renderQuests();
  if (state.gasTaken && state.matchesTaken) setObjective('Quema la casa. Pulsa E frente a la puerta.');
}

async function burnHouse() {
  if (state.mode !== 'play' || state.phase !== 'outside') return;
  if (!state.gasTaken || !state.matchesTaken) {
    await flavor('TÚ', ['Necesito gasolina y fósforos. No pienso improvisar.']);
    return;
  }
  state.mode = 'cutscene';
  await say('TÚ', ['Esto es por asustarme.']);
  state.mode = 'burning';
  state.phase = 'outside';
  state.fire = true;
  state.burnTimer = 0;
  state.shake = 0.5;
  ui.hideHud.classList.add('hidden');
  audio.fireStart();
  audio.scare();
  toast('¡MIAU! (desde dentro)', 2600);
}

function showEnding() {
  if (state.endingShown) return;
  state.endingShown = true;
  state.mode = 'ending';
  ui.hud.classList.add('hidden');
  ui.prompt.classList.add('hidden');
  ui.dialogue.classList.add('hidden');
  ui.endingText.textContent = 'El Gato del Sombrero no volvió a molestar. Los tres azules se quedaron a vivir contigo y ahora ocupan el sofá. Tu armario sigue entreabierto.';
  ui.ending.classList.remove('hidden');
  audio.stopHeartbeat();
}

/* ------------------------------------------------------------------ */
/* Update                                                             */
/* ------------------------------------------------------------------ */

function update(dt, rawDt = dt) {
  state.time += rawDt;

  if (state.toastTimer > 0) {
    state.toastTimer -= dt;
    if (state.toastTimer <= 0) ui.toast.classList.remove('show');
  }

  updateParticles(dt);
  updateDust(dt);
  state.redFlash = Math.max(0, state.redFlash - dt * 1.5);
  state.shake = Math.max(0, state.shake - dt * 2.6);
  state.danger = Math.max(0, state.danger - dt * 1.4);

  if (state.mode === 'title') {
    updateCamera(dt);
    updateOverlayTint();
    return;
  }

  if (state.paused) {
    updateOverlayTint();
    return;
  }

  if (dialogueState) {
    const line = dialogueState.lines[dialogueState.index] || '';
    if (dialogueState.chars < line.length) {
      dialogueState.chars = Math.min(line.length, dialogueState.chars + dt * 46);
      renderDialogue();
    }
  }

  updateFollowers(dt);

  if (state.mode === 'play') {
    updatePlayer(dt);
  } else if (state.mode === 'chase') {
    updatePlayer(dt);
    updateChase(dt, rawDt);
  } else if (state.mode === 'hidden') {
    updateHidden(rawDt);
  } else if (state.mode === 'burning') {
    updateBurning(rawDt);
  }

  updateCamera(dt);
  updatePrompt();
  updateOverlayTint();
}

function updatePlayer(dt) {
  if (state.cooking || dialogueState || state.player.hidden) return;
  const p = state.player;
  let dx = 0;
  let dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (touchInput.active) {
    dx += touchInput.x;
    dy += touchInput.y;
  }
  const length = Math.hypot(dx, dy);
  p.moving = length > 0.1;
  if (!p.moving) return;

  dx /= length;
  dy /= length;
  p.dir.x = dx;
  p.dir.y = dy;
  const speed = state.mode === 'chase' ? 238 : 220;
  const nx = p.x + dx * speed * dt;
  const ny = p.y + dy * speed * dt;
  if (canStand(nx, p.y)) p.x = nx;
  if (canStand(p.x, ny)) p.y = ny;

  p.walk += dt * 11;
  p.stepTimer -= dt;
  if (p.stepTimer <= 0) {
    audio.step();
    p.stepTimer = 0.31;
  }
}

function updateFollowers(dt) {
  let prev = { x: state.player.x, y: state.player.y };
  for (let i = 0; i < state.followers.length; i++) {
    const f = state.followers[i];
    const wob = state.time * 2.4 + f.wobble + i * 1.7;
    const tx = prev.x - Math.cos(wob) * 42;
    const ty = prev.y + 22 + Math.sin(wob * 0.8) * 18;
    f.x += (tx - f.x) * Math.min(1, dt * 4.4);
    f.y += (ty - f.y) * Math.min(1, dt * 4.4);
    prev = f;
  }
}

function updateChase(dt, rawDt) {
  const cat = state.cat;
  cat.visible = true;
  if (cat.chaseGrace > 0) {
    cat.chaseGrace -= rawDt;
    cat.convulsing = cat.chaseGrace > 0.6;
    state.shake = Math.max(state.shake, 0.1);
    return;
  }
  cat.convulsing = false;
  const p = state.player;
  const dx = p.x - cat.x;
  const dy = p.y - cat.y;
  const d = Math.hypot(dx, dy) || 1;
  const speed = 156;
  cat.x += (dx / d) * speed * dt;
  cat.y += (dy / d) * speed * dt;
  state.danger = clamp(1 - d / 620, 0, 1);
  if (Math.random() < 0.6) {
    addParticle('trail', cat.x + rand(-14, 14), cat.y + rand(-6, 12), {
      vx: rand(-8, 8), vy: rand(8, 30), life: 0.55, size: rand(4, 10), color: '#6b2340',
    });
  }
  if (d < 54) catchPlayer();
}

async function catchPlayer() {
  if (state.catching) return;
  state.catching = true;
  state.mode = 'cutscene';
  audio.scare();
  state.shake = 1.5;
  state.redFlash = 0.5;
  ui.jumpscare.classList.remove('hidden');
  await wait(1200);
  ui.jumpscare.classList.add('hidden');
  state.redFlash = 0;
  state.player.x = 330;
  state.player.y = 420;
  state.player.dir = { x: 0, y: 1 };
  state.cat.x = 430;
  state.cat.y = 875;
  state.cat.chaseGrace = 2.0;
  state.mode = 'chase';
  state.danger = 0;
  snapCamera();
  toast('Te encontró... pero te dejó ir. Corre otra vez.', 3000);
  state.catching = false;
}

function updateHidden(dt) {
  state.hideTimer += dt;
  const progress = clamp(state.hideTimer / state.hideDuration, 0, 1);
  ui.hideFill.style.width = `${Math.round(progress * 100)}%`;

  const cat = state.cat;
  cat.visible = true;
  cat.convulsing = false;
  const closet = state.hideCloset;
  if (state.hideTimer < 4.2) {
    cat.huntTarget = { x: closet.spot.x + 26, y: closet.spot.y + 46 };
  } else if (state.hideTimer < 7.4) {
    cat.huntTarget = { x: 802, y: 928 };
  } else {
    cat.visible = false;
  }
  if (cat.huntTarget && cat.visible) {
    const dx = cat.huntTarget.x - cat.x;
    const dy = cat.huntTarget.y - cat.y;
    const d = Math.hypot(dx, dy);
    if (d > 16) {
      const speed = state.hideTimer < 4.2 ? 86 : 116;
      cat.x += (dx / d) * Math.min(speed * dt, d);
      cat.y += (dy / d) * Math.min(speed * dt, d);
    }
  }
  if (state.hideTimer >= state.hideDuration) finishHiding();
}

function updateBurning(dt) {
  state.burnTimer += dt;
  state.danger = clamp(state.burnTimer / 8, 0, 1);
  state.redFlash = Math.max(state.redFlash, 0.05 + Math.sin(state.time * 9) * 0.03);
  if (Math.random() < 0.75) {
    addParticle('ember', rand(470, 1130), rand(190, 520), {
      vx: rand(-18, 18), vy: rand(-60, -20), life: rand(0.7, 1.7), size: rand(1.5, 4),
      color: Math.random() < 0.5 ? '#ffb23e' : '#ff5b2e',
    });
  }
  if (Math.random() < 0.3) {
    addParticle('smoke', rand(500, 1100), rand(130, 380), {
      vx: rand(-12, 12), vy: rand(-34, -14), life: rand(1.6, 3.2), size: rand(16, 38), color: '#2b1b1e',
    });
  }
  if (state.burnTimer > 2.5 && state.burnTimer < 3.4) state.shake = Math.max(state.shake, 0.35);
  if (state.burnTimer > 7.2) {
    audio.fireStop();
    showEnding();
  }
}

function cameraTarget() {
  if (state.mode === 'title') return { x: 520, y: 340 };
  if (state.mode === 'burning') return { x: 800, y: 440 };
  if (state.cat.convulsing) return state.cat;
  return state.player;
}

function updateCamera(dt) {
  const target = cameraTarget();
  const vw = view.w / view.scale;
  const vh = view.h / view.scale;
  let tx = target.x - vw / 2;
  let ty = target.y - vh / 2;
  tx = vw >= WORLD.w ? (WORLD.w - vw) / 2 : clamp(tx, 0, WORLD.w - vw);
  ty = vh >= WORLD.h ? (WORLD.h - vh) / 2 : clamp(ty, 0, WORLD.h - vh);
  const k = 1 - Math.exp(-dt * 5.2);
  state.camera.x += (tx - state.camera.x) * k;
  state.camera.y += (ty - state.camera.y) * k;
}

function updatePrompt() {
  if (
    state.mode === 'title' || state.mode === 'cutscene' || state.mode === 'hidden' ||
    state.mode === 'burning' || state.mode === 'ending' || state.paused || dialogueState
  ) {
    ui.prompt.classList.add('hidden');
    return;
  }
  const target = nearestInteraction();
  if (target) {
    ui.promptText.textContent = target.label;
    ui.prompt.classList.remove('hidden');
  } else {
    ui.prompt.classList.add('hidden');
  }
}

function updateOverlayTint() {
  let alpha = state.redFlash;
  if (state.mode === 'chase') alpha = Math.max(alpha, state.danger * 0.24);
  if (state.mode === 'burning') alpha = Math.max(alpha, 0.2 + state.danger * 0.2);
  ui.redFlash.style.opacity = clamp(alpha, 0, 0.82).toFixed(3);
}

/* ------------------------------------------------------------------ */
/* Particles                                                          */
/* ------------------------------------------------------------------ */

function addParticle(type, x, y, options = {}) {
  state.particles.push({
    type, x, y,
    vx: options.vx ?? 0,
    vy: options.vy ?? 0,
    life: options.life ?? 0.8,
    maxLife: options.life ?? 0.8,
    size: options.size ?? 6,
    color: options.color ?? '#ffffff',
  });
  if (state.particles.length > 520) state.particles.shift();
}

function spawnPuff(x, y, color) {
  for (let i = 0; i < 13; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(18, 78);
    addParticle('puff', x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 12,
      life: rand(0.5, 1.1),
      size: rand(4, 12),
      color,
    });
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.type === 'ember' ? 34 : p.type === 'smoke' ? -8 : 20) * dt;
    p.vx *= 1 - dt * 0.7;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}

function updateDust(dt) {
  if (state.dust.length < 48 && Math.random() < 0.55) {
    const cx = state.camera.x + view.w / view.scale / 2;
    const cy = state.camera.y + view.h / view.scale / 2;
    state.dust.push({
      x: cx + rand(-view.w / view.scale / 2, view.w / view.scale / 2),
      y: cy + rand(-view.h / view.scale / 2, view.h / view.scale / 2),
      vx: rand(-5, 5), vy: rand(-9, -2), size: rand(0.8, 2.1),
      life: rand(3, 8), maxLife: 8,
    });
  }
  for (let i = state.dust.length - 1; i >= 0; i--) {
    const d = state.dust[i];
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.life -= dt;
    if (d.life <= 0) state.dust.splice(i, 1);
  }
}

/* ------------------------------------------------------------------ */
/* Boot                                                               */
/* ------------------------------------------------------------------ */

function makeGrain() {
  const c = document.createElement('canvas');
  c.width = 150;
  c.height = 150;
  const g = c.getContext('2d');
  const image = g.createImageData(150, 150);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = Math.random() * 255;
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = Math.random() * 55;
  }
  g.putImageData(image, 0, 0);
  ui.grain.style.backgroundImage = `url(${c.toDataURL()})`;
}

function setupButtons() {
  ui.start.addEventListener('click', startGame);
  ui.resume.addEventListener('click', togglePause);
  ui.restart.addEventListener('click', () => window.location.reload());
  ui.again.addEventListener('click', () => window.location.reload());
  ui.mute.addEventListener('click', () => {
    audio.init();
    audio.setMuted(!audio.muted);
    ui.mute.textContent = audio.muted ? 'SONIDO OFF' : 'SONIDO ON';
  });
}

function boot() {
  isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || window.innerWidth < 760;
  if (isTouch) document.body.classList.add('touch-mode');
  makeGrain();
  setupInput();
  setupButtons();
  setObjective(state.objective);
  renderQuests();
  snapCamera();

  let last = performance.now();
  const frame = (now) => {
    const rawDt = Math.min(0.3, (now - last) / 1000);
    const dt = Math.min(0.1, rawDt);
    last = now;
    update(dt, rawDt);
    render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

boot();
