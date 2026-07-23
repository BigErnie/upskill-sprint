'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const THEME = '<script src="/theme.js"></script>';
const SECTIONS = '<script src="/site-sections.js"></script>';

function htmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const GUIDE = path.join(ROOT, 'tools', 'steel-phase-explorer', 'how-to-use', 'index.html');
const guide = fs.readFileSync(GUIDE, 'utf8');

/*
 * The Apply Shared Site Controllers workflow matches these tag strings
 * exactly. A non-compliant page makes the bot attempt a push to protected
 * main, which fails CI on every subsequent merge.
 */
test('every HTML page carries the exact shared controller tags', () => {
  const offenders = [];
  for (const file of htmlFiles(ROOT)) {
    const body = fs.readFileSync(file, 'utf8');
    if (!body.includes(THEME) || !body.includes(SECTIONS)) {
      offenders.push(path.relative(ROOT, file));
    }
  }
  assert.deepEqual(offenders, [], 'pages missing the exact tags');
});

test('the shared controller tags appear exactly once on the guide', () => {
  assert.equal(guide.split(THEME).length - 1, 1, 'theme.js once');
  assert.equal(guide.split(SECTIONS).length - 1, 1, 'site-sections.js once');
});

test('the guide documents the reference diagrams section', () => {
  assert.match(guide, /id="reference-diagrams"/);
  assert.match(guide, /<a href="#reference-diagrams">/);
});

test('the guide states the rapid map is not a TTT or CCT diagram', () => {
  assert.match(guide, /Not a TTT or CCT diagram/i);
  assert.match(guide, /no time axis/i);
});

test('the guide separates equilibrium fields from kinetic products', () => {
  assert.match(guide, /[Bb]ainite and martensite are not equilibrium phases/);
});

test('the guide covers each required topic', () => {
  [/Plotting and moving points/, /Reading a region/, /Experience levels/,
   /Critical lines and legend/, /Units/, /Zoom, pan and full screen/,
   /PNG export/, /On a phone/, /Engineering limitations/, /Source and copyright/]
    .forEach(re => assert.match(guide, re, `missing section: ${re}`));
});

test('the guide credits Buehler and ASM and records the permission', () => {
  assert.match(guide, /Buehler/);
  assert.match(guide, /ASM International/);
  assert.match(guide, /permission held by UpSkill Sprint Consulting/);
  assert.match(guide, /reproduced unaltered/i);
});

test('the guide declares which boundaries are approximate', () => {
  assert.match(guide, /educational approximations/i);
  assert.match(guide, /no implied precision/i);
});

test('the guide records the lower bainite onset carbon', () => {
  assert.match(guide, /0\.42/, 'onset carbon stated');
});

test('the guide notes that units do not move points', () => {
  assert.match(guide, /does not move when you switch units/i);
});

test('troubleshooting mentions the Release 5 tab', () => {
  assert.match(guide, /Release 2\u20135 tab is missing/);
});

test('the table of contents is sequentially numbered', () => {
  const nums = [...guide.matchAll(/<a href="#[a-z-]+">(\d+)\./g)].map(m => Number(m[1]));
  assert.ok(nums.length >= 20, `expected a full contents list, got ${nums.length}`);
  nums.forEach((n, i) => assert.equal(n, i + 1, `contents entry ${i + 1} out of order`));
});
