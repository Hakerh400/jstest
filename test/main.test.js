'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const jstest = require('..');

jstest.add('Synchronous test', () => {
  assert.strictEqual([1, 2, 3].pop(), 3);
});

jstest.add('Asynchronous test', async () => {
  await Promise.resolve('ok');
  return new Promise(res => {
    setTimeout(res);
  });
});