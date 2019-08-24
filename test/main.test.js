'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const jstest = require('..');

const {part, test} = jstest;

part('Passing tests', () => {
  test('Synchronous test', () => {
    assert.strictEqual([1, 2, 3].pop(), 3);
  });

  test('Asynchronous test', async () => {
    await Promise.resolve('ok');
    await new Promise(res => setTimeout(res, 1e3));
  });
});

part('Failing tests', async () => {
  test('Synchronous test', () => {
    throw new TypeError('oops!');
  });

  await new Promise(res => setTimeout(res, 1e3));

  test('Asynchronous test', () => {
    return new Promise((res, rej) => {
      setTimeout(() => rej(['abc']), 1e3);
    });
  });
});

part('Other tests', () => {
  test('Empty test', () => {});
  test('Invalid test', null);
  test('Unresolved test', () => new Promise(() => {}));
});