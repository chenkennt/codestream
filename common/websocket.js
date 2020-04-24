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
  changes: async (context, [changes, version]) => {
    await context.socket.sendToGroup(context.userId, 'changes', [changes, version]);
  },
  sync: async context => {
    let master = context.userId.slice(0, 8);
    await context.socket.addToGroup(context.connectionId, context.query.join);
    await context.socket.sendToUser(master, 'sync', context.userId);
  },
  all: async (context, [user, content, version]) => {
    await context.socket.sendToUser(user, 'all', [content, version]);
  }
};

const AzureWebsocket = require('azure-websocket');
module.exports = (connString, hubName) => new AzureWebsocket(connString, hubName, handlers);
