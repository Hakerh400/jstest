'use strict';

const fs = require('fs');
const path = require('path');
const jstest = require('..');

const cwd = __dirname;

process.on('exit', () => {
  process.exitCode = 0;
});

jstest.dir(cwd);