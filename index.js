const axios = require('axios');
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();
const port = 8080;

function parseConnectionString(connString) {
  const pattern = /^Endpoint=(.*);AccessKey=(.*);Version=1.0;$/;
  let matches = pattern.exec(connString);
  return {
    endpoint: matches[1],
    accessKey: matches[2]
  };
}

function generateToken(url, key) {
  return "Bearer " + jwt.sign({}, key, {
    audience: url,
    expiresIn: "1h",
    algorithm: "HS256"
  });
}

const connectionString = 'Endpoint=https://ws-pp-common-1.servicedev.signalr.net;AccessKey=vfORLMZfzjla0z2UTsPohY/u24Ih4IipBy8aFIJzSd8=;Version=1.0;';
const connectionInfo = parseConnectionString(connectionString);
const hubName = 'kenchentest';

function invokeService(method, url, obj) {
  url = `${connectionInfo.endpoint}/ws/api/v1/${url}`;
  let headers = {
    'Authorization': generateToken(url, connectionInfo.accessKey)
  };
  let payload = null;
  if (obj) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(obj);
  }

  switch (method) {
    case 'post': axios.post(url, payload, { headers: headers }); break;
    case 'put': axios.put(url, payload, { headers: headers }); break;
  }
}

let sendToConneciton = (connectionId, obj) => invokeService('post', `hubs/${hubName}/connections/${connectionId}`, obj);
let addToGroup = (connectionId, groupName) => invokeService('put', `hubs/${hubName}/groups/${groupName}/connections/${connectionId}`);
let sendToGroup = (groupName, obj) => invokeService('post',  `hubs/${hubName}/groups/${groupName}`, obj);

function parseEvent(req) {
  let query = {};
  for (let p of new URLSearchParams(req.header('x-asrs-client-query')).entries()) {
    query[p[0]] = p[1];
  }
  return {
    connectionId: req.header('x-asrs-connection-id'),
    query: query
  };
}

function onConnected(context) {
  console.log(`${context.connectionId} connected. Stream id: ${context.query.stream}`);
  addToGroup(context.connectionId, context.query.stream);
}

function newChanges(context, data) {
  sendToGroup(data.stream, {
    name: 'newChanges',
    value: {
      changes: data.changes
    }
  });
}

app
  .get('/test', (req, res) => {
    sendToGroup(req.query.group, 'test');
    res.send();
  })
  .post(`/${hubName}/connect`, (req, res) => {
    let context = parseEvent(req);
    onConnected(context);
    res.status(204).send();
  })
  .post(`/${hubName}/message`, (req, res) => {
    let context = parseEvent(req);
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let obj = JSON.parse(body);
      switch (obj.name) {
        case 'newChanges': newChanges(context, obj.value); break;
      }
    });
  });

app.use(express.static('public'));
app.use('/scripts/monaco', express.static('node_modules/monaco-editor/min'));

app.listen(port, () => console.log('app started'));
