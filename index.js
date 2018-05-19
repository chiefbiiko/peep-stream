var { Transform } = require('stream')
var { inherits, isDate, isString } = require('util')
var { datify, timify } = require('./datetimify')

var BUF419 = Buffer.from([ 0, 4, 1, 9, 4, 1, 9, 0 ])

function PeepWriter (file, opts) {
  if (!(this instanceof PeepWriter)) return new PeepWriter(file, opts)
  Transform.call(this, opts)
  if (typeof file === 'object') {
    opts = file
    file = null
  }
  this._opts = Object.assign({ delimiter: BUF419 }, opts || {})
  if (global) {
    var { createWriteStream, existsSync, mkdirSync } = require('fs')
    var { join } = require('path')
    if (!file) {
      var now = Date.now()
      var today = datify(now).replace(/[-]/g, '_')
      var totime = timify(now).replace(/[:.]/g, '_')
      if (!existsSync('./peep')) mkdirSync('./peep')
      if (!existsSync(join('./peep', today))) mkdirSync(join('./peep', today))
      file = join('./peep', today, totime + '.peep')
    }
    this._stdout = createWriteStream(file)
  } else if (window) {
    var websocket = require('websocket-stream')
    this._opts = Object.assign({ port: 41900 }, this._opts)
    this._stdout = websocket('ws://localhost:' + this._opts.port)
  } else {
    throw new Error('unknown context')
  }
}

inherits(PeepWriter, Transform)

PeepWriter.prototype._transform = function transform (chunk, _, next) {
  this.push(chunk)
  var pac = Buffer.alloc(8 + chunk.length + 2 * this._opts.delimiter.length)
  pac.writeDoubleBE(Date.now(), 0) // 8-byte timestamp
  this._opts.delimiter.copy(pac, 8)
  chunk.copy(pac, 8 + this._opts.delimiter.length)
  this._opts.delimiter.copy(pac, 8 + this._opts.delimiter.length + chunk.length)
  this._stdout.write(pac)
  next()
}

PeepWriter.prototype._flush = function flush (end) {
  this._stdout.end()
  end()
}

function createPeepReadStream (file, opts) {
  var { createReadStream } = require('fs')
  var choppa = require('chop-delimited-stream')
  var pump = require('pump') // maybe multipipe
  opts = Object.assign({ delimiter: BUF419 }, opts || {})
  if (typeof file !== 'string') throw new TypeError('file is not a string')
  // return a readable object stream that pushes { timestamp, chunk }
  var readStream = createReadStream(file)
  var chopStream = choppa(opts.delimiter)
  var glueStream = new Transform({
    readableObjectMode: true,
    transform (chunk, _, next) {
      if (this._n % 2 === 0) {
        this._stash.timestamp = chunk
      } else {
        this._stash.chunk = chunk
        this.push(this._stash)
      }
      next()
    }
  })
  glueStream._n = 0
  glueStream._stash = {}
  return pump(readStream, chopStream, glueStream)
}

module.exports = { createPeepWriteStream: PeepWriter, createPeepReadStream }
