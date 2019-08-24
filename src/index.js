'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const fsRec = require('./fs-rec');
const Semaphore = require('./semaphore');

const TAB_SIZE = 2;
const TAB = ' '.repeat(TAB_SIZE);

const parts = [];
const tests = [];
const semPart = new Semaphore(0);

const addPart = (name, func) => {
  parts.push([name, func]);
  semPart.signal();
};

const addTest = (name, func) => {
  tests.push([name, func]);
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

const tab = str => {
  return `${TAB}${str}`;
};

const formatErr = err => {
  return util.inspect(err).split(/\r\n|\r|\n/).map(line => {
    return tab(`\x1B[1;31m${line}\x1B[0m`);
  }).join('\n');
};

const fatalErr = err => {
  console.log(err);
  process.exitCode = 1;
};

(async () => {
  while(1){
    await semPart.wait();

    const [name, func] = parts.shift();
    out(`\x1B[1;33m=== ${name} ===\x1B[0m\n\n`);

    await func();

    for(const test of tests){
      const [name, func] = test;
      out(tab(name.padEnd(80, '.')));

      try{
        await func();
        out('\x1B[1;32m OK\x1B[0m\n');
      }catch(err){
        out(`\x1B[1;31m FAIL\x1B[0m\n\n${formatErr(err)}\n\n`);
        process.exitCode = 1;
      }
    }

    tests.length = 0;
    out('\n');
  }

  out('\n');
})().catch(fatalErr);

process.on('exit', () => {
  if(tests.length !== 0){
    out('\n\n\x1B[1;31mError: Unresolved tests left\x1B[0m\n\n');
    process.exitCode = 1;
  }
});

module.exports = {
  part: addPart,
  test: addTest,
  dir: addDir,
};