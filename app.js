#!/usr/bin/env node

const fs = require('fs');
const {spawn} = require('child_process');
const minimist = require('minimist');

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

start();

async function start() {
  let process = await spawnXinputList();
}

function spawnXinputList() {
  let command = `xinput`;
  let xinputListArgs = [`list`];
  let listProcess = spawn(command, xinputListArgs);
  console.info('spawnXinputList');

  listProcess.on('exit', (code, signal) => { console.info('exit', code, signal); });
  listProcess.on('error', (error) => { console.info('error', error); });
  listProcess.on('close', (number, signal) => { console.info('close', number, signal); });
  listProcess.on('message', (message) => { console.info('message', message); });

  listProcess.stdout.on('data', processXinputListStdOut);
  listProcess.stderr.on('data', processStdErr);

  return listProcess;
}

function processXinputListStdOut(data) {
  console.info('xinput list');
  let keyboardList = data.toString().split('\n').filter((line) => {
    return line.indexOf('keyboard') !== -1 && line.indexOf('Virtual') < 0;
  }).map((keyboard) => {
    let parts = keyboard.split(/\s{2,}|\t/);
    return `${parts[1]} ${parts[2]}`;
  });
  console.info('inputList', keyboardList);

  console.log('someting');
}

console.info('exit');
// process.exit();
// console.info('process args', args);

if (!args.filename) {
  console.error('Please provide a file to analyse `node app.js -f <filename>`');
  process.exit();
}

if (!args.deviceId) {
  console.error('Please provide a deviceId to analyse `node app.js -i <deviceId>`. Use `xinput list` to discover the id of the keyboard');
  process.exit();
}

let keyList = [];
run();

async function run() {
  let xmodmap = await readFilePromised(xmodmapFile);
  keyList = await parseXmodmap(xmodmap);
  await startKeyPressCapture(keyList);
}

function readFilePromised(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

function parseXmodmap(file) {
  let lines = file.toString().split('\n');
  return new Promise((resolve, reject) => {
    let keyList = [];
    lines.forEach((line) => {
      let re = /keycode\s{1,3}(\d{1,3}) = (\S+) (\S+)/;
      let matches = line.match(re);
      if (matches !== null) {
        let [, keyCode, normal, shifted] = matches;
        keyList[keyCode] = {normal: normal, shifted: shifted};
      }
    });

    resolve(keyList);
  });
}

function startKeyPressCapture(keyList) {
  let command = `xinput`;
  let xinputTestArgs = [`test`, `${args.deviceId}`];
  let captureProcess = spawn(command, xinputTestArgs);
  console.info('startKeyPressCapture', args.deviceId);

  captureProcess.on('exit', (code, signal) => { console.info('exit', code, signal); });
  captureProcess.on('error', (error) => { console.info('error', error); });
  captureProcess.on('close', (number, signal) => { console.info('close', number, signal); });
  captureProcess.on('message', (message) => { console.info('message', message); });

  captureProcess.stdout.on('data', processStdOut);
  captureProcess.stderr.on('data', processStdErr);

  return captureProcess;
}

async function processStdOut(data) {
  let keyData = data.toString().replace(/\r?\n?/g, '');
  let keyEvent = await processKeyPresses(keyData);
  let keyCombo = await parseKeyPress(keyEvent);

  console.info('->', keyCombo.join(' + '));
}

function processStdErr(error) {
  console.error(`stderr: ${error}`);
}

let keyEvent = [];
let keyEvents = [];
let pressCount = 0;

function processKeyPresses(line) {
  return new Promise((resolve, reject) => {
    const lineParts = line.split(' ').filter(part => part.length !== 0);
    let [currentEventType, currentKeyState, currentKeyCode] = lineParts;

    let current = {
      eventType: currentEventType,
      keyState: currentKeyState,
      keyCode: currentKeyCode
    };

    if (current.keyState === 'press') {
      pressCount++;
      keyEvent.push(current);
    } else if (current.keyState === 'release') {
      pressCount--;
      if (keyEvent.length !== 0) {
        keyEvents.push(keyEvent);
        keyEvent = [];
      }
    }

    if (pressCount === 0) {
      resolve(keyEvents);
      keyEvents = [];
    }
  });
}

function parseKeyPress(keyEvent) {
  let keyCombo = [];
  return new Promise((resolve, reject) => {
    keyEvent.forEach((events) => {
      keyCombo = events.map(event => keyList[event.keyCode].normal);
    });
    resolve(keyCombo);
  });
}
