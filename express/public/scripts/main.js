function Buffer() {
  this._size = 16;
  this._buf = [];
  this._curr = 0;
}

Buffer.prototype.push = function(data) {
  if (data.version < this._curr) return;
  let overwrite = false;
  if (this._buf[data.version % this._size]) overwrite = true;
  this._buf[data.version % this._size] = data;
  return !overwrite;
};

Buffer.prototype.pop = function() {
  let i = this._curr % this._size;
  if (!this._buf[i] || this._buf[i].version !== this._curr) return null;
  let data = this._buf[i];
  this._buf[i] = null;
  this._curr++;
  return data;
};

Buffer.prototype.forceUpdate = function(version) {
  this._curr = version;
  for (let i = 0; i < this._size; i++)
    if (this._buf[i] && this._buf[i].version < version) this._buf[i] = null;
};

function Connection(socket) {
  this._socket = socket;
  socket.onopen = e => {
    if (this._callbacks['connected']) this._callbacks['connected'](e);
  };
  this._callbacks = {};
  socket.onmessage = e => {
    let obj = JSON.parse(e.data);
    if (this._callbacks[obj.name]) this._callbacks[obj.name](obj.data);
    else throw `unrecognized message: ${e.data}`;
  };
}

Connection.prototype.sync = function() {
  this._socket.send(JSON.stringify({
    name: 'sync'
  }));
};

Connection.prototype.send = function(changes, version) {
  this._socket.send(JSON.stringify({
    name: 'changes',
    data: [changes, version]
  }));
};

Connection.prototype.sendAll = function(userId, content, version) {
  this._socket.send(JSON.stringify({
    name: 'all',
    data: [userId, content, version]
  }));
};

Connection.prototype.on = function(name, callback) {
  this._callbacks[name] = callback;
};
