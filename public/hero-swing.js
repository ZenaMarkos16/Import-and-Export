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
  let height = 350;
  let lastSample = null, releaseVelocity = 0;
  const paint = () => {
    object.style.transform = `rotate(${physics.angle.toFixed(6)}rad)`;
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
    physics.release(event?.type === 'pointerup' && lastSample && performance.now() - lastSample.time < 120 ? releaseVelocity : undefined); wake();
    lastSample = null; releaseVelocity = 0;
    if (!hovering || event?.type !== 'pointerup' || event.pointerType !== 'mouse') hideCursor();
  }
  function measure() {
    finish();
    // Offsets measure the untransformed image, preventing feedback while rotating.
    height = object.offsetHeight || 350;
    const clearance = (stage.clientWidth - object.offsetWidth) / 2 - 6;
    physics.maxAngle = Math.min(.27, Math.max(.025, Math.atan2(Math.max(0, clearance), height) * .9));
    stage.style.setProperty('--swing-clearance', `${Math.ceil(object.offsetWidth * .5 * Math.sin(physics.maxAngle) + 28)}px`);
    physics.reset(); paint(); hideCursor();
  }
  on(hero, 'pointerleave', () => { if (pointer === null) hideCursor(); });
  on(object, 'pointerenter', event => { hovering = true; showCursor(event); });
  on(object, 'pointerleave', () => { hovering = false; if (pointer === null) hideCursor(); });
  on(object, 'pointerdown', event => {
    if (reducedMotion.matches || pointer !== null || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    pointer = event.pointerId;
    start = { x: event.clientX, angle: physics.angle };
    lastSample = { time: performance.now(), angle: physics.angle }; releaseVelocity = 0;
    object.setPointerCapture(pointer); object.focus({ preventScroll: true });
    object.classList.add('is-dragging'); cursor.classList.add('is-grabbing');
    showCursor(event); physics.target(physics.angle); wake();
  });
  on(object, 'pointermove', event => {
    if (pointer === event.pointerId && start) {
      const angle = clamp(start.angle - (event.clientX - start.x) / Math.max(height, 150), -physics.maxAngle * .8, physics.maxAngle * .8);
      const now = performance.now();
      const elapsed = (now - lastSample.time) / 1000;
      if (elapsed > .003) {
        const velocity = clamp((angle - lastSample.angle) / elapsed, -1.5, 1.5);
        releaseVelocity = releaseVelocity * .25 + velocity * .75;
        lastSample = { time: now, angle };
      }
      physics.target(angle);
      wake();
    }
    if (hovering || pointer === event.pointerId) showCursor(event);
  });
  for (const name of ['pointerup','pointercancel','lostpointercapture']) on(object, name, finish);
  on(object, 'dragstart', event => event.preventDefault());
  on(object, 'keydown', event => {
    if (event.key === 'Escape') { finish(); physics.release(); wake(); hideCursor(); return; }
    if (reducedMotion.matches || !['ArrowLeft','ArrowRight',' '].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') physics.angularVelocity = clamp(physics.angularVelocity + .3, -.65, .65);
    else if (event.key === 'ArrowRight') physics.angularVelocity = clamp(physics.angularVelocity - .3, -.65, .65);
    else physics.angularVelocity = clamp(physics.angularVelocity + .35, -.65, .65);
    physics.release(); wake();
  });
  on(window, 'blur', () => { finish(); hideCursor(); physics.release(); wake(); });
  on(document, 'visibilitychange', () => { finish(); hideCursor(); if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; } else wake(); });
  function motionChanged() {
    finish(); physics.reset(); paint(); hideCursor();
    object.setAttribute('aria-disabled', String(reducedMotion.matches));
    object.tabIndex = reducedMotion.matches ? -1 : 0;
    hint.textContent = reducedMotion.matches ? 'MOTION REDUCED · RESTING IN PLACE' : 'PULL LEFT OR RIGHT & RELEASE · ← → KEYS';
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
