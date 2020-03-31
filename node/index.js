const express = require('express');
const bodyParser = require('body-parser');
const AzureWebsocket = require('azure-websocket');
const app = express();

function generateId() {
  return Math.random().toString(36).substr(2, 8);
}

let handlers = {
  onConnected: async context => {
    if (context.query.join) {
      context.userId = `${context.query.join}-${generateId()}`;
      await context.socket.sendToUser(context.query.join, 'joined');
    } else return {
      name: 'id',
      data: context.userId = generateId()
    };
  },
  onDisconnected: async context => {
    if (context.query.join) await context.socket.sendToUser(context.query.join, 'left');
    else await context.socket.sendToGroup(context.userId, 'stopped');
  },
  changes: async (context, data) => {
    await context.socket.sendToGroup(context.userId, 'changes', {
      version: data.version,
      changes: data.changes
    });
  },
  sync: async context => {
    let master = context.userId.slice(0, 8);
    await context.socket.addToGroup(context.connectionId, context.query.join);
    await context.socket.sendToUser(master, 'sync', context.userId);
  },
  all: async (context, data) => {
    await context.socket.sendToUser(data.user, 'all', {
      content: data.content,
      version: data.version
    });
  }
};

const port = 8080;
const connectionString = process.env.Azure__SignalR__ConnectionString;
const hubName = 'codestream';

let socket = new AzureWebsocket(connectionString, hubName, handlers);

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
