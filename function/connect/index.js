const AzureWebsocket = require('azure-websocket');

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

const connectionString = process.env.Azure__SignalR__ConnectionString;
const hubName = 'codestream';

let socket = new AzureWebsocket(connectionString, hubName, handlers);

module.exports = async function (context, req) {
  let ret = await socket.onConnected(req.headers);
  context.res = {
    status: 200,
    body: ret.body,
    headers: ret.headers
  };
};