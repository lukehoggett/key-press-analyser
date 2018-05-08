'use strict';

const path = require('path');

module.exports = (app) => {
  app.get('/luke', (req, res) => {
    res.write('I am the luke route');
    res.end();
  });

  // var exampleSocket = new WebSocket('ws://www.example.com/socketserver', 'protocolOne');
  //
  app.get('/ws', (req, res) => {
    // res.write('I am the ws route');
    console.log(path.join(__dirname, '../html/ws.html'));
    res.sendFile(path.join(__dirname, '../html/ws.html'));
    res.end();
  });
};
