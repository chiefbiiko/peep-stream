var { Transform } = require('stream')

var BUF419 = Buffer.from([ 0, 4, 1, 9, 4, 1, 9, 0 ])

function PeepWriter (opts) {
  if (!(this instanceof PeepWriter)) return new PeepWriter(opts)
  Transform.call(this, opts)
  this._opts = Object.assign({ delimiter: BUF419 }, opts || {})
  if (global) {
    var { createWriteStream, existsSync, mkdirSync } = require('fs')
    if (!this._opts.dump) {
      if (!existsSync('./peep')) mkdirSync('./peep')
      this._opts.dump = join('./peep', new Date().toISOString() + '.peep')
    }
    this._stdout = createWriteStream(this._opts.dump)
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

function createPeepReadStream (opts) {
  var { createReadStream } = require('fs')
  var choppa = require('chop-delimited-stream')
  var pump = require('pump') // maybe multipipe
  opts = Object.assign({ delimiter: BUF419 }, opts || {})
  if (!opts.file) {
    // search for .peep files in cwd and ./peep

  }
  // return a readable object stream that pushes { timestamp, chunk }
  var readStream = createReadStream(opts.file)
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
