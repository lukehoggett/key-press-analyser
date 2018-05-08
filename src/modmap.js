'use strict';

const fs = require('fs');
const readline = require('readline');

const xmodmapFile = `${__dirname}/xmodmap-as-expressions.log`;

let xmodmapReader = readline.createInterface({
  input: fs.createReadStream(xmodmapFile)
});

xmodmapReader
  .on('line', parseXmodmap)
  .on('close', saveXmodmap);

let keyList = [];

function parseXmodmap(line) {
  let re = /keycode\s{1,3}(\d{1,3}) = (\S+) (\S+)/;
  let matches = line.match(re);
  if (matches !== null) {
    // console.info(matches);
    let [full, keyCode, normal, shifted, ...rest] = matches;
    keyList[keyCode] = {normal: normal, shifted: shifted};

    console.info(full, rest);
  }
}

function saveXmodmap() {
}
