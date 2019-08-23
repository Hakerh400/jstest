'use strict';

const fs = require('fs');
const path = require('path');

const FS_SEPARATOR = '/';

const nop = () => {};

class FileQueueElem{
  constructor(fullPath, relativePath=null, depth=null, name=null, isDir=null, processed=0){
    if(isDir === null) isDir = fs.statSync(fullPath).isDirectory();
    if(name === null) name = path.parse(fullPath).base;
    if(relativePath === null) relativePath = name;
    if(depth === null) depth = (relativePath.match(/[\/\\]/g) || []).length;

    this.fullPath = fullPath;
    this.relativePath = relativePath;
    this.relativeSubPath = relativePath.split(/[\/\\]/).slice(1).join(FS_SEPARATOR);
    this.subPath = this.relativeSubPath;
    this.depth = depth;
    this.name = name;
    this.isDir = isDir;
    this.processed = processed;
    this.ext = path.parse(name).ext.slice(1);
  }

  static copy(elem){
    var {fullPath, relativePath, depth, name, isDir, processed} = elem;
    return new FileQueueElem(fullPath, relativePath, depth, name, isDir, processed);
  }
}

module.exports = {
  FileQueueElem,
  processFiles,
  processFilesSync,
  copyFiles,
  copyFilesSync,
  deleteFiles,
  deleteFilesSync,
  createDir,
  createDirSync,
  resetDirSync,
};

function processFiles(filePath, func, cb=nop){
  processElem(0, [new FileQueueElem(formatPath(filePath))], func, cb);
}

function processFilesSync(filePath, func){
  processElem(1, [new FileQueueElem(formatPath(filePath))], func);
}

function processElem(sync, queue, func, cb=nop){
  while(1){
    var elem = queue.pop();

    func(FileQueueElem.copy(elem));

    if(elem.isDir && !elem.processed){
      elem.processed = 1;
      queue.push(elem);

      var files = fs.readdirSync(elem.fullPath);

      files.forEach(file => {
        var fullPath = path.join(elem.fullPath, file);
        var relativePath = path.join(elem.relativePath, file);

        queue.push(new FileQueueElem(fullPath, relativePath));
      });
    }

    if(queue.length){
      if(sync) continue;
      else return setTimeout(() => processElem(0, queue, func, cb));
    }else{
      if(sync) return cb();
      else return setTimeout(() => cb());
    }
  }
}

function copyFiles(filePath, dest, cb=nop){
  processFiles(filePath, d => copyFile(d, dest), cb);
}

function copyFilesSync(filePath, dest){
  processFilesSync(filePath, d => copyFile(d, dest));
}

function copyFile(d, dest){
  if(d.depth === 0 || d.processed) return;

  var destPath = path.join(dest, d.relativeSubPath);
  if(d.isDir) fs.mkdirSync(destPath)
  else fs.writeFileSync(destPath, fs.readFileSync(d.fullPath));
}

function deleteFiles(filePath, cb=nop){
  processFiles(filePath, deleteFile, cb);
}

function deleteFilesSync(filePath){
  processFilesSync(filePath, deleteFile);
}

function deleteFile(d){
  if(d.isDir){
    if(d.processed) fs.rmdirSync(d.fullPath);
  }else{
    fs.unlinkSync(d.fullPath);
  }
}

function createDir(dirPath, cb=nop){
  var err = null;

  try{
    createDirSync(dirPath);
  }catch(e){
    err = e;
  }

  setTimeout(() => {
    cb(err);
  });
}

function createDirSync(dirPath){
  dirPath = formatPath(dirPath);

  var dirs = dirPath.split('\\');
  dirPath = dirs.shift();

  while(dirs.length !== 0){
    dirPath = path.join(dirPath, dirs.shift());

    while(!fs.existsSync(dirPath)){
      try{
        fs.mkdirSync(dirPath);
      }catch(err){}
    }
  }
}

function resetDirSync(dirPath){
  if(fs.existsSync(dirPath))
    deleteFilesSync(dirPath);

  fs.mkdirSync(dirPath);
}

function formatPath(filePath){
  return filePath.replace(/\//g, FS_SEPARATOR);
}