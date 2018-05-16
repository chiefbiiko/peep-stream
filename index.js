var { Transform } = require('stream')

function Peep (opts) {
  if (!(this instanceof Peep)) return new Peep(opts)
  Transform.call(this)
  this._seq = 0
  this._stash = []
}

inherits(Peep, Transform)

Peep.prototype._transform = function transform (chunk, _, next) {
  this._stash.unshift({ seq: this._seq++, chunk: chunk })
  this.push(chunk)
  next()
}

Peep.prototype.next = function next () {
  return this._stash.pop()
}

module.exports = Peep