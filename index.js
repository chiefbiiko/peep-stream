var Transform = require('stream').Transform

var BUF419 = Buffer.from([ 0, 4, 1, 9, 4, 1, 9, 0 ])

function Peep (dump, opts) {
  if (!(this instanceof Peep)) return new Peep(dump, opts)
  Transform.call(this)
  this._delimiter = opts.delimiter || BUF419
  if (global) {
    dump = dump || new Date().toISOString() + '.peep'
    this._dump = require('fs').createWriteStream(dump)
  } else if (window) {
    this._dump = require('websocket-stream')('ws://localhost:41900')
  } else {
    throw new Error('unknown context')
  }
}

inherits(Peep, Transform)

Peep.prototype._transform = function transform (chunk, _, next) {
  this.push(chunk)
  var ts = Buffer.alloc(8)
  ts.writeDoubleBE(Date.now(), 0)
  // ... write

  next()
}

module.exports = Peep