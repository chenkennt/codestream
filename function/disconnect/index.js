const socket = require('codestream-websocket')(process.env.Azure__SignalR__ConnectionString, 'codestream');

module.exports = async function (context, req) {
  await socket.onDisconnected(req.headers);
}