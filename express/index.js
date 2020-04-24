const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const port = 8080;
const connectionString = process.env.Azure__SignalR__ConnectionString;
const hubName = 'codestream';
const socket = require('codestream-websocket')(connectionString, hubName);

app.use(bodyParser.text());
app
  .get(`/${hubName}`, (req, res) => res.send(socket.getEndpoint()))
  .post(`/${hubName}/connect`, async (req, res) => {
    let ret = await socket.onConnected(req.headers);
    for (let n in ret.headers) res.header(n, ret.headers[n]);
    res.send(ret.body);
  })
  .post(`/${hubName}/disconnect`, async (req, res) => {
    await socket.onDisconnected(req.headers);
    res.send();
  })
  .post(`/${hubName}/message`, async (req, res) => {
    let body = await socket.onMessage(req.headers, req.body);
    res.send(body);
  });

app.use(express.static('public'));
app.listen(port, () => console.log('app started'));
