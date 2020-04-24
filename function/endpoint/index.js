const socket = require('codestream-websocket')(process.env.Azure__SignalR__ConnectionString, 'codestream');

module.exports = async function (context, req) {
  context.res = {
    body: socket.getEndpoint()
  };
};