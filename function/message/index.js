const socket = require('../websocket.js');

module.exports = async function (context, req) {
  let body = await socket.onMessage(req.headers, req.body);
  context.res = {
    body: body
  };
};