#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const {spawn} = require('child_process');
const minimist = require('minimist');
const _ = require('lodash');

// const loggingFile = `${__dirname}/data/key-logger.log`;

const loggingFile = `${__dirname}/data/viterbi-right-01.log`;
// const loggingFileGlob = `${__dirname}/key-log-*.log`;
// const loggingFileGlob = `${__dirname}/viterbi*.log`;
const xmodmapFile = `${__dirname}/xmodmap-as-expressions.log`;

/**
 * `xinput list` get a list of the input devices
 * `xinput test <id> >> <logging file> &`
 *
 * `xinput test <id> >> key-log-$(date --utc +%FT%TZ).log`
 *
 * note the id from `xinput list for your keyboard can vary depending on which keyboard or which USB port is used`
 */

/**
 * USAGE: npm start -f <lfilename>
 * @type {[type]}
 */

let args = minimist(process.argv.slice(2), {
   alias: {
       h: 'help',
       v: 'version',
       f: 'filename',
       i: 'deviceId'
   }
});

console.info('process args', args);

if (!args.filename) {
 console.error('Please provide a file to analyse `node app.js -f <filename>`');
 process.exit();
}

if (!args.deviceId) {
  console.error('Please provide a deviceId to analyse `node app.js -i <deviceId>`. Use `xinput list` to discover the id of the keyboard');
    process.exit();
}
// let command = `xinput `;
let command = `xinput`;
let arguments = [`test`, `${args.deviceId}`];
let captureProcess = spawn(command, args);

captureProcess.on('exit', (code, signal) => {
  console.info('exit', code, signal);
});
captureProcess.on('error', (error) => {
  console.info('error', error);
});
captureProcess.on('close', (number, signal) => {
  console.info('close', number, signal);
});
captureProcess.on('message', (message) => {
  console.info('message', message);
});

captureProcess.stdout.on('data', (data) => {
  console.log(`child stdout:\n${data}`);
});

captureProcess.stderr.on('data', (data) => {
  console.error(`child stderr:\n${data}`);
});

let keyList = {};

let previous = {};
let current = {};
let lineCount = 0;
let keyEvent = [];
let keyEvents = [];

let xmodmapReader = readline.createInterface({
  input: fs.createReadStream(xmodmapFile)
})

let logReader = readline.createInterface({
  input: fs.createReadStream(loggingFile)
});

xmodmapReader
  .on('line', parseXmodmap)
  .on('close', saveXmodmap);

function parseXmodmap(line) {
  let parts = line.split(' ');
  
  let re = /keycode\s{1,3}(\d{1,3}) = (\S+) (\S+)/;
  let matches = line.match(re);
  if (matches !== null) {
    // console.info(matches);
    let [full, keyCode, normal, shifted, ...rest] = matches;
    keyList[keyCode] = {normal: normal, shifted: shifted};
  }
}

function saveXmodmap() {
  logReader
    .on('line', parseKeyLog)
    .on('close', mapKeyCombinations);
}

function parseKeyLog(line) {
  const lineParts = line.split(' ').filter(part => part.length !== 0);
  let [currentEventType, currentKeyState, currentKeyCode] = lineParts;
  
  current = {
    eventType: currentEventType,
    keyState: currentKeyState,
    keyCode: currentKeyCode
  };
  
  if(current.keyState === 'press') {
    keyEvent.push(current);
  } else if (current.keyState === 'release' && keyEvent.length !== 0) {
    keyEvents.push(keyEvent);
    keyEvent = [];
  }
}

function mapKeyCombinations() {
  let keyPresses = [];
  let analysedPresses = {};
  keyEvents.forEach((events) => {
    let keyCombo = events.map(event => keyList[event.keyCode].normal);
    keyPresses.push(keyCombo);
    
    let joinedCombo = keyCombo.join(' + ');
    if (!analysedPresses[joinedCombo]) {
      analysedPresses[joinedCombo] = 1;
    } else {
      analysedPresses[joinedCombo]++;
    }
    // console.info(events.length, joinedCombo);
  });
  // console.info(analysedPresses);
  
  let analysedPressesArray = _.map(analysedPresses, (count, press) => {
    return {press: press, count: count}
  });
  // console.info(analysedPressesArray);
  let sortedAnalysedPresses = _.sortBy(analysedPressesArray, (a) => {
    return -a.count;
  });
  console.log(sortedAnalysedPresses);
  
  // keyPresses.map((combo) => {
  // 
  // })
}
