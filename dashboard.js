var readline = require('readline')
var ansiDiff = require('ansi-diff')

function render () {
  return '::dashboard::\n' +
    'the time is: ' + new Date().toISOString() + '\n' +
    'refresh? [press enter]\n'
}

function dashboard (render) {
  var diff = ansiDiff({ width: process.stdout.columns })

  var split = render().replace(/\r?\n$/, '').split(/\n/g)
  var y = split.length
  var x = (split[split.length - 1] || '').length
  
  process.stdout.on('resize', function onresize () {
    diff.resize({ width: process.stdout.columns })
    render()
  })

  process.stdin.on('data', function ondata (chunk) {
    process.stdout.write(diff.update(render()))
    readline.cursorTo(process.stdout, x, y)
  }) 

  process.stdout.write(diff.update(render()))
  readline.cursorTo(process.stdout, x, y)

  return function update () {
    process.stdout.write(diff.update(render()))
  }
}

var update = dashboard(render)