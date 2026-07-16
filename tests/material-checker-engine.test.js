'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const Engine = require('../tools/material-checker-engine.js');

test('engine self-tests pass', () => {
  const result = Engine.runSelfTests();
  assert.equal(result.passed, true, JSON.stringify(result.tests.filter(item => !item.passed)));
});

test('72 ksi passes a 485 to 635 MPa rule', () => {
  const result = Engine.evaluateRule({propertyCode: 'ys', min: 485, max: 635, unit: 'MPa'}, {ys: {value: 72, unit: 'ksi'}});
  assert.equal(result.status, 'pass');
});

test('60 ksi fails a 485 MPa minimum', () => {
  const result = Engine.evaluateRule({propertyCode: 'ys', min: 485, unit: 'MPa'}, {ys: {value: 60, unit: 'ksi'}});
  assert.equal(result.status, 'fail');
});

test('package applicability checks thickness', () => {
  const result = Engine.evaluatePackage({
    id: 'pkg', name: 'test', applicability: {thicknessMin: 10, thicknessMax: 20, thicknessUnit: 'mm'},
    rules: [{id: 'r', propertyCode: 'x', min: 1, unit: 'MPa'}]
  }, {x: {value: 2, unit: 'MPa'}}, {}, {thickness: 25, thicknessUnit: 'mm'});
  assert.equal(result.status, 'not-applicable');
});

test('CSV parser preserves quoted commas', () => {
  const rows = Engine.parseCSV('id,comment\n1,"hello, world"\n');
  assert.deepEqual(rows, [{id: '1', comment: 'hello, world'}]);
});

test('batch summary counts exceptions', () => {
  const summary = Engine.summarizeBatch([
    {result: {status: 'pass', rows: []}},
    {result: {status: 'fail', rows: [{status: 'fail', label: 'Yield strength'}]}}
  ]);
  assert.equal(summary.total, 2);
  assert.equal(summary.counts.fail, 1);
  assert.equal(summary.pareto[0].label, 'Yield strength');
});
