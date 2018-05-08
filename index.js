'use strict';
// Startup Express App
const express = require('express');
const app = express();
const http = require('http').Server(app);

// include other libraries
const routes = require('./src/routes')(app); // This is the extra line

http.listen(3000);

app.use(express.static('html'));

// handle HTTP GET request to the "/" URL
app.get('/', function(req, res) {
  res.write('Hi I am the root');
  res.end();
});
