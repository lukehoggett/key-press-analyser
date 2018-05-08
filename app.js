#!/usr/bin/env node

const fs = require('fs');
const {spawn} = require('child_process');
const minimist = require('minimist');
const _ = require('lodash');

// const loggingFile = `${__dirname}/data/key-logger.log`;

// const loggingFileGlob = `${__dirname}/key-log-*.log`;
// const loggingFileGlob = `${__dirname}/viterbi*.log`;
//
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

let readFilePromised = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
};
// console.info(readFilePromised(xmodmapFile));
readFilePromised(xmodmapFile)
  .then(parseXmodmap)
  .then(startKeyPressCapture)
  .catch(error => console.error(error));

function startKeyPressCapture(keyList) {
  let command = `xinput`;
  let xinputTestArgs = [`test`, `${args.deviceId}`];
  let captureProcess = spawn(command, xinputTestArgs);
  console.info('startKeyPressCapture', args.deviceId);

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
    let keyData = data.toString().replace(/\r?\n?/g, '');
    // console.log(`${keyData}`, keyData);
    processKeyPresses(keyData)
      .then(parseKeyPress)
      .catch((error) => {
        console.error(error);
      });
  });

  captureProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
}

function parseXmodmap(file) {
  let lines = file.toString().split('\n');
  // console.log('parseXmodmap', lines);
  return new Promise((resolve, reject) => {
    let keyList = [];
    lines.forEach((line) => {
      let re = /keycode\s{1,3}(\d{1,3}) = (\S+) (\S+)/;
      let matches = line.match(re);
      if (matches !== null) {
        let [full, keyCode, normal, shifted, ...rest] = matches;
        keyList[keyCode] = {normal: normal, shifted: shifted};
      }
    });

    // console.info('processed keylist', keyList);
    resolve(keyList);
  });
}

let keyList = {};

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
      // console.info('resolving ', keyEvents);
      resolve(keyEvents);
      keyEvents = [];
    }

    // console.info(pressCount, `key event`, keyEvent, `keyEvents`, keyEvents);
  });
}

function parseKeyPress(keyEvent) {
  console.info('parseKeyPress key event', keyEvent.length, keyEvent, keyList);

  // let keyCombo = keyList[keyEvent.keyCode].normal;
  // let keyCombo = keyEvents.map(event => keyList[event.keyCode].normal);
  keyEvent.forEach((events) => {
    let keyCombo = events.map(event => keyList[event.keyCode].normal);
    console.info(keyCombo);
  });
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
    return {press: press, count: count};
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
