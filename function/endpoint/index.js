const socket = require('../websocket.js');

module.exports = async function (context, req) {
  context.res = {
    body: socket.getEndpoint()
  };
};