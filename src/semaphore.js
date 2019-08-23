'use strict';

const fs = require('fs');
const path = require('path');

class Semaphore{
  constructor(s){
    this.s = s;
    this.blocked = [];
  }

  init(s){
    this.s = s;
  }

  wait(){
    if(this.s > 0){
      this.s--;
      return;
    }

    return new Promise(res => {
      this.blocked.push(res);
    });
  }

  signal(){
    const {blocked} = this;

    if(blocked.length === 0){
      this.s++;
      return;
    }

    setTimeout(blocked.shift());
  }
}

module.exports = Semaphore;