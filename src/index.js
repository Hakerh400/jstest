'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const fsRec = require('./fs-rec');
const Semaphore = require('./semaphore');

const tests = [];
const sem = new Semaphore(0);

const addTest = (name, func) => {
  tests.push([name, func]);
  sem.signal();
};

const addDir = (dir, rec=0) => {
  fsRec.processFilesSync(dir, d => {
    if(d.isDir) return;
    if(rec === 0 && d.depth !== 1) return;
    if(!d.name.endsWith('.test.js')) return;
    require(d.fullPath);
  });
};

const out = str => {
  process.stdout.write(str);
};

const fatalErr = err => {
  console.log(err);
  process.exitCode = 1;
};

(async () => {
  while(1){
    await sem.wait();

    const [name, func] = tests.shift();
    out(name.padEnd(80, '.'));

    try{
      await func();
      out('\x1B[92mOK\x1B[0m\n');
    }catch(err){
      out(`\x1B[91mFAIL\n\n${util.inspect(err)}\x1B[0m\n\n`);
      process.exitCode = 1;
      break;
    }
  }
})().catch(fatalErr);

module.exports = {
  add: addTest,
  dir: addDir,
};