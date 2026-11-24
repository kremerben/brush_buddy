/* Brush Buddy routine: the steps, their timing, and small pure helpers.
 * Edit the numbers here to change how long each step lasts.
 * No DOM or Three.js in this file, so it can be unit tested with `node --test`.
 */

/* ------------ Phases (shown as the chips at the top) ------------ */
export const PHASES = [
  { id:'rinse',     emoji:'💧', name:'Rinse' },
  { id:'floss',     emoji:'🧵', name:'Floss' },
  { id:'mouthwash', emoji:'🫧', name:'Mouthwash' },
  { id:'brush',     emoji:'🪥', name:'Brush' },
];

/* ------------ Check-off steps (before brushing) ------------
 * minSeconds: the check-off button unlocks after this many seconds.
 * maxSeconds: the timer stops here and waits for the check-off button.
 * dance:      how the 3D teeth move during this step (see index.html).
 */
export const CHECKOFF_STEPS = [
  {
    key:'rinse', phase:'rinse', label:'Rinse with water',
    minSeconds:0, maxSeconds:30,
    doing:'rinsing', keepGoing:'Keep rinsing',
    hint:'Swish water around, then spit',
    checkoffText:'I did a good job rinsing!',
    dance:'swish',
  },
  {
    key:'floss', phase:'floss', label:'Floss your teeth',
    minSeconds:30, maxSeconds:60,
    doing:'flossing', keepGoing:'Keep flossing',
    hint:'Floss between every tooth',
    checkoffText:'I did a good job flossing!',
    dance:'floss',
  },
  {
    key:'mouthwash', phase:'mouthwash', label:'Mouthwash',
    minSeconds:30, maxSeconds:60,
    doing:'swishing', keepGoing:'Keep swishing',
    hint:'Swish it around, then spit',
    checkoffText:'I did a good job rinsing with mouthwash!',
    dance:'wobble',
  },
];

/* ------------ Brushing steps ------------ */
export function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}

export function buildSequenceFor(prefix){
  const P = toTitleCase(prefix);
  return [
    { key:`${prefix}-chew-right`, label:`${P} — Right`,          duration:15 },
    { key:`${prefix}-chew-left`,  label:`${P} — Left`,           duration:15 },
    { key:`${prefix}-front`,      label:`${P} front`,            duration:11 },
    { key:`${prefix}-behind`,     label:`Behind front teeth`,    duration:11 },
    { key:`${prefix}-in-left`,    label:`${P} inside - outside`, duration:8  },
    { key:`${prefix}-out-left`,   label:`${P} outside - inside`, duration:8  },
    { key:`${prefix}-in-right`,   label:`${P} inside - outside`, duration:8  },
    { key:`${prefix}-out-right`,  label:`${P} outside - inside`, duration:8  },
  ];
}

/* The full routine: check-off steps first, then the brushing steps.
 * Every step has `duration` (seconds on the countdown) and `type`. */
export function buildRoutine(){
  const pre = CHECKOFF_STEPS.map(s => ({ ...s, type:'checkoff', duration:s.maxSeconds }));
  const brush = [...buildSequenceFor('upper'), ...buildSequenceFor('lower')]
    .map(s => ({ ...s, type:'brush', phase:'brush' }));
  return [...pre, ...brush];
}

/* ------------ Helpers ------------ */
export function formatTime(sec){
  const m = Math.floor(sec/60), s = sec%60;
  return `${m}:${s<10?'0':''}${s}`;
}

/* State of a check-off step, from the seconds left on its countdown. */
export function checkoffStatus(step, secondsLeft){
  const elapsed = step.maxSeconds - secondsLeft;
  return {
    elapsed,
    unlocked: elapsed >= step.minSeconds,
    secondsToUnlock: Math.max(0, step.minSeconds - elapsed),
    timeUp: secondsLeft <= 0,
  };
}

/* 1-based number of a brushing step among the brushing steps only. */
export function brushStepNumber(routine, idx){
  return routine.slice(0, idx + 1).filter(s => s.type === 'brush').length;
}

/* Fraction (0..1) of the planned routine time that is complete. */
export function plannedProgress(routine, idx, secondsLeft){
  const total = routine.reduce((sum, s) => sum + s.duration, 0);
  if(idx >= routine.length) return 1;
  const before = routine.slice(0, idx).reduce((sum, s) => sum + s.duration, 0);
  const inStep = Math.max(0, routine[idx].duration - secondsLeft);
  return Math.min(1, (before + inStep) / total);
}

/* 'done' | 'active' | 'todo' for each phase id. */
export function phaseStatus(routine, idx){
  const current = idx < routine.length ? routine[idx].phase : null;
  const order = PHASES.map(p => p.id);
  const currentPos = current ? order.indexOf(current) : order.length;
  const out = {};
  order.forEach((id, i) => { out[id] = i < currentPos ? 'done' : i === currentPos ? 'active' : 'todo'; });
  return out;
}

/* Total time from Start to Done. Pause stops the clock; Reset clears it.
 * `now` is injectable so the timer can be tested without real time. */
export class TotalTimer {
  constructor(now = () => performance.now()){ this.now = now; this.reset(); }
  reset(){ this.accumMs = 0; this.since = null; }
  get running(){ return this.since !== null; }
  start(){ if(this.since === null) this.since = this.now(); }
  pause(){ if(this.since !== null){ this.accumMs += this.now() - this.since; this.since = null; } }
  elapsedMs(){ return this.accumMs + (this.since !== null ? this.now() - this.since : 0); }
  elapsedSeconds(){ return Math.floor(this.elapsedMs() / 1000); }
}
