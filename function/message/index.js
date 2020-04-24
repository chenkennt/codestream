const socket = require('codestream-websocket')(process.env.Azure__SignalR__ConnectionString, 'codestream');

module.exports = async function (context, req) {
  let body = await socket.onMessage(req.headers, req.body);
  context.res = {
    body: body
  };
};