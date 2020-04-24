const socket = require('../websocket.js');

module.exports = async function (context, req) {
  let ret = await socket.onConnected(req.headers);
  context.res = {
    body: ret.body,
    headers: ret.headers
  };
};