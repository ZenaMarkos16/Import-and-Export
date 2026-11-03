import { SwingPhysics, clamp } from './swing-physics.js';

export function createHeroSwing(hero) {
  const object = hero.querySelector('.swing-object');
  const stage = hero.querySelector('.cargo-stage');
  const cursor = hero.querySelector('.swing-cursor');
  const hint = hero.querySelector('.swing-hint');
  if (!object || !stage || !cursor) return () => {};
  const physics = new SwingPhysics();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const abort = new AbortController();
  const on = (target, event, handler) => target.addEventListener(event, handler, { signal: abort.signal });
  let frame = 0, previousTime = 0, pointer = null, start = null, hovering = false, inView = true;
  let limits = { x: 30, y: 35, height: 350 };
  const paint = () => {
    object.style.transform = `translate3d(${physics.x.toFixed(3)}px,${physics.y.toFixed(3)}px,0) rotate(${physics.angle.toFixed(6)}rad)`;
  };
  function tick(time) {
    frame = 0;
    if (!inView || document.hidden || reducedMotion.matches) return;
    physics.step(previousTime ? (time - previousTime) / 1000 : 1 / 60);
    previousTime = time; paint();
    if (!physics.atRest()) frame = requestAnimationFrame(tick);
    else { previousTime = 0; object.classList.remove('is-moving'); }
  }
  function wake() {
    if (!frame && inView && !document.hidden && !reducedMotion.matches) {
      previousTime = 0; object.classList.add('is-moving'); frame = requestAnimationFrame(tick);
    }
  }
  function showCursor(event) {
    const show = finePointer.matches && event.pointerType === 'mouse' && !reducedMotion.matches;
    cursor.classList.toggle('is-visible', show);
    object.classList.toggle('has-swing-cursor', show);
    cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px`;
  }
  function hideCursor() { cursor.classList.remove('is-visible'); object.classList.remove('has-swing-cursor'); }
  function finish(event) {
    if (pointer === null || (event?.pointerId !== undefined && event.pointerId !== pointer)) return;
    const id = pointer; pointer = null; start = null;
    if (object.hasPointerCapture(id)) object.releasePointerCapture(id);
    object.classList.remove('is-dragging'); cursor.classList.remove('is-grabbing');
    physics.release(); wake();
    if (!hovering || event?.type !== 'pointerup' || event.pointerType !== 'mouse') hideCursor();
  }
  function measure() {
    finish();
    // Offsets measure the untransformed image, preventing feedback while rotating.
    limits = { x: Math.min(44, stage.clientWidth * .035, Math.max(0, (stage.clientWidth - object.offsetWidth) * .175)), y: Math.min(36, stage.clientWidth * .04), height: object.offsetHeight || 350 };
    const clearance = (stage.clientWidth - object.offsetWidth) / 2 - limits.x - 8;
    physics.maxAngle = Math.min(.21, Math.max(.02, Math.atan2(Math.max(0, clearance), limits.height) * .82));
    stage.style.setProperty('--swing-clearance', `${Math.ceil(object.offsetWidth * .5 * Math.sin(physics.maxAngle * 1.16) + limits.y + 36)}px`);
    physics.reset(); paint(); hideCursor();
  }
  on(hero, 'pointermove', event => {
    if (pointer !== null || !inView || reducedMotion.matches || event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    const horizontal = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
    const vertical = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
    physics.target(-horizontal * .025, horizontal * limits.x * .12, vertical * limits.y * .12);
    wake();
  });
  on(hero, 'pointerleave', () => { if (pointer === null) { physics.release(); wake(); hideCursor(); } });
  on(object, 'pointerenter', event => { hovering = true; showCursor(event); });
  on(object, 'pointerleave', () => { hovering = false; if (pointer === null) hideCursor(); });
  on(object, 'pointerdown', event => {
    if (reducedMotion.matches || pointer !== null || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    pointer = event.pointerId;
    start = { x: event.clientX, y: event.clientY, angle: physics.angle, offsetX: physics.x, offsetY: physics.y };
    object.setPointerCapture(pointer); object.focus({ preventScroll: true });
    object.classList.add('is-dragging'); cursor.classList.add('is-grabbing');
    showCursor(event); physics.target(physics.angle, physics.x, physics.y, true); wake();
  });
  on(object, 'pointermove', event => {
    if (pointer === event.pointerId && start) {
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      physics.target(start.angle - dx / Math.max(limits.height, 150) * .65,
        clamp(start.offsetX + dx * .16, -limits.x, limits.x),
        clamp(start.offsetY + dy * .32, -limits.y, limits.y), true);
      wake();
    }
    if (hovering || pointer === event.pointerId) showCursor(event);
  });
  for (const name of ['pointerup','pointercancel','lostpointercapture']) on(object, name, finish);
  on(object, 'dragstart', event => event.preventDefault());
  on(object, 'keydown', event => {
    if (event.key === 'Escape') { finish(); physics.release(); wake(); hideCursor(); return; }
    if (reducedMotion.matches || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') physics.angularVelocity = clamp(physics.angularVelocity + .3, -.65, .65);
    else if (event.key === 'ArrowRight') physics.angularVelocity = clamp(physics.angularVelocity - .3, -.65, .65);
    else if (event.key === 'ArrowUp') physics.vy = clamp(physics.vy - 40, -70, 70);
    else if (event.key === 'ArrowDown') physics.vy = clamp(physics.vy + 40, -70, 70);
    else physics.angularVelocity = clamp(physics.angularVelocity + .35, -.65, .65);
    physics.release(); wake();
  });
  on(window, 'blur', () => { finish(); hideCursor(); physics.release(); wake(); });
  on(document, 'visibilitychange', () => { finish(); hideCursor(); if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; } else wake(); });
  function motionChanged() {
    finish(); physics.reset(); paint(); hideCursor();
    object.setAttribute('aria-disabled', String(reducedMotion.matches));
    object.tabIndex = reducedMotion.matches ? -1 : 0;
    hint.textContent = reducedMotion.matches ? 'MOTION REDUCED · RESTING IN PLACE' : 'GRAB, DRAG & LET GO · OR USE ARROW KEYS';
    if (reducedMotion.matches) { cancelAnimationFrame(frame); frame = 0; object.classList.remove('is-moving'); }
  }
  on(reducedMotion, 'change', motionChanged);
  on(finePointer, 'change', hideCursor);
  const resize = new ResizeObserver(measure); resize.observe(stage); resize.observe(object);
  const visibility = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (!inView) { finish(); hideCursor(); cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
    else wake();
  }); visibility.observe(hero);
  measure(); motionChanged();
  return () => {
    finish(); abort.abort(); resize.disconnect(); visibility.disconnect();
    cancelAnimationFrame(frame); frame = 0; hideCursor(); object.style.transform = '';
  };
}
const hero = document.querySelector('.hero');
let cleanup = hero ? createHeroSwing(hero) : () => {};
window.addEventListener('pagehide', () => cleanup());
window.addEventListener('pageshow', event => { if (event.persisted && hero) cleanup = createHeroSwing(hero); });
