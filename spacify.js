function spacify (hexs) {
  for (var s = '', i = 0; i < hexs.length; i++) {
    if (i % 2 === 0 && i !== 0) s += ' '
    s += hexs[i]
  }
  return s
}

module.exports = spacify
