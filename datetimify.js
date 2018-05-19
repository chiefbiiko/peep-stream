var { isDate } = require('util')

function datetimify (timestamp) {
  var date = isDate(timestamp) ? timestamp : new Date(timestamp)
  return date.toISOString()
}

function datify (timestamp) {
  var date = isDate(timestamp) ? timestamp : new Date(timestamp)
  return date.toISOString().slice(0, 10)
}

function timify (timestamp) {
  var date = isDate(timestamp) ? timestamp : new Date(timestamp)
  return date.toISOString().slice(11, 19) + '.' + date.getMilliseconds()
}

module.exports = { datetimify, datify, timify }
