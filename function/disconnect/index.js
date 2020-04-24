const socket = require('../websocket.js');

module.exports = async function (context, req) {
  await socket.onDisconnected(req.headers);
}