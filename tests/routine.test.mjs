// Run with: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PHASES, buildRoutine, formatTime, checkoffStatus,
  brushStepNumber, plannedProgress, phaseStatus, TotalTimer,
} from '../routine.js';

const routine = buildRoutine();
const byKey = key => routine.find(s => s.key === key);

test('routine runs rinse, floss, mouthwash, then 16 brushing steps', () => {
  assert.equal(routine.length, 19);
  assert.deepEqual(routine.slice(0, 3).map(s => s.key), ['rinse', 'floss', 'mouthwash']);
  assert.ok(routine.slice(0, 3).every(s => s.type === 'checkoff'));
  assert.ok(routine.slice(3).every(s => s.type === 'brush' && s.phase === 'brush'));
});

test('brushing durations are unchanged', () => {
  const half = [15, 15, 11, 11, 8, 8, 8, 8];
  assert.deepEqual(routine.slice(3).map(s => s.duration), [...half, ...half]);
  assert.equal(routine[3].key, 'upper-chew-right');
  assert.equal(routine[3].label, 'Upper — Right');
  assert.equal(routine[18].key, 'lower-out-right');
});

test('check-off steps use the requested min/max times', () => {
  assert.deepEqual([byKey('rinse').minSeconds, byKey('rinse').maxSeconds], [0, 30]);
  assert.deepEqual([byKey('floss').minSeconds, byKey('floss').maxSeconds], [30, 60]);
  assert.deepEqual([byKey('mouthwash').minSeconds, byKey('mouthwash').maxSeconds], [30, 60]);
  // The countdown for a check-off step starts at its maximum.
  assert.equal(byKey('floss').duration, 60);
});

test('check-off buttons have the "I did a good job" text', () => {
  assert.equal(byKey('rinse').checkoffText, 'I did a good job rinsing!');
  assert.equal(byKey('floss').checkoffText, 'I did a good job flossing!');
  assert.equal(byKey('mouthwash').checkoffText, 'I did a good job rinsing with mouthwash!');
});

test('every step has a phase that exists', () => {
  const ids = new Set(PHASES.map(p => p.id));
  assert.ok(routine.every(s => ids.has(s.phase)));
});

test('checkoffStatus: floss is locked for 30 s, then unlocked, then time is up at 60 s', () => {
  const floss = byKey('floss');
  assert.deepEqual(checkoffStatus(floss, 60), { elapsed: 0, unlocked: false, secondsToUnlock: 30, timeUp: false });
  assert.deepEqual(checkoffStatus(floss, 31), { elapsed: 29, unlocked: false, secondsToUnlock: 1, timeUp: false });
  assert.deepEqual(checkoffStatus(floss, 30), { elapsed: 30, unlocked: true, secondsToUnlock: 0, timeUp: false });
  assert.deepEqual(checkoffStatus(floss, 0), { elapsed: 60, unlocked: true, secondsToUnlock: 0, timeUp: true });
});

test('checkoffStatus: rinse has no minimum, so it is unlocked at once', () => {
  const s = checkoffStatus(byKey('rinse'), 30);
  assert.equal(s.unlocked, true);
  assert.equal(s.timeUp, false);
  assert.equal(checkoffStatus(byKey('rinse'), 0).timeUp, true);
});

test('brushStepNumber counts only brushing steps', () => {
  assert.equal(brushStepNumber(routine, 3), 1);
  assert.equal(brushStepNumber(routine, 10), 8);
  assert.equal(brushStepNumber(routine, 18), 16);
});

test('plannedProgress starts at 0, grows, and ends at 1', () => {
  assert.equal(plannedProgress(routine, 0, routine[0].duration), 0);
  const total = routine.reduce((n, s) => n + s.duration, 0);
  assert.equal(plannedProgress(routine, 1, routine[1].duration), 30 / total);
  assert.equal(plannedProgress(routine, 1, 50), 40 / total);
  assert.equal(plannedProgress(routine, routine.length, 0), 1);
  let last = -1;
  for (let i = 0; i < routine.length; i++) {
    const p = plannedProgress(routine, i, routine[i].duration);
    assert.ok(p > last, `progress must grow at step ${i}`);
    last = p;
  }
});

test('phaseStatus marks earlier phases done and the current one active', () => {
  assert.deepEqual(phaseStatus(routine, 0), { rinse: 'active', floss: 'todo', mouthwash: 'todo', brush: 'todo' });
  assert.deepEqual(phaseStatus(routine, 2), { rinse: 'done', floss: 'done', mouthwash: 'active', brush: 'todo' });
  assert.deepEqual(phaseStatus(routine, 10), { rinse: 'done', floss: 'done', mouthwash: 'done', brush: 'active' });
  assert.deepEqual(phaseStatus(routine, routine.length), { rinse: 'done', floss: 'done', mouthwash: 'done', brush: 'done' });
});

test('formatTime', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(9), '0:09');
  assert.equal(formatTime(75), '1:15');
  assert.equal(formatTime(600), '10:00');
});

test('TotalTimer counts running time and excludes pauses', () => {
  let t = 0;
  const timer = new TotalTimer(() => t);
  assert.equal(timer.elapsedMs(), 0);
  timer.start(); t = 5000;
  assert.equal(timer.elapsedSeconds(), 5);
  timer.pause(); t = 20000;              // paused: 15 s must not count
  assert.equal(timer.elapsedMs(), 5000);
  timer.start(); t = 22500;
  assert.equal(timer.elapsedMs(), 7500);
  timer.start(); t = 23000;              // a second start does not restart the clock
  assert.equal(timer.elapsedMs(), 8000);
  timer.reset();
  assert.equal(timer.elapsedMs(), 0);
  assert.equal(timer.running, false);
});
