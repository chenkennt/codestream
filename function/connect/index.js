const socket = require('codestream-websocket')(process.env.Azure__SignalR__ConnectionString, 'codestream');

module.exports = async function (context, req) {
  let ret = await socket.onConnected(req.headers);
  context.res = {
    body: ret.body,
    headers: ret.headers
  };
};