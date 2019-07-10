let readline = require('readline')
function numberParser (inp) {
  let result = inp.match(/^-?(0|[\d1-9]\d*)(\.\d+)?(?:[Ee][+-]?\d+)?/)
  if (result === null) return null
  return ([result[0] * 1, spaceParser(inp.slice(result[0].length))])
}
function identifierParser (inp) {
  let result
  return (result = inp.match(/^[a-zA-z]\w*/)) && [result[0], spaceParser(inp.slice(result[0].length))]
}
function spaceParser (inp) {
  let regex = /^\s+/
  inp = inp.replace(regex, '')
  return inp
}
var globalEnv = {
  '+': (...list) => list.reduce((x, y) => x + y),
  '-': (...list) => list.reduce((x, y) => x - y),
  '*': (...list) => list.reduce((x, y) => x * y),
  '/': (...list) => list.reduce((x, y) => x / y),
  '<': (x, y) => x < y,
  '>': (x, y) => x > y,
  '=': (x, y) => x === y,
  '>=': (x, y) => x >= y,
  '<=': (x, y) => x <= y,
  'pi': Math.PI,
  'sqrt': (input) => Math.sqrt(input)
}
function defineParser (inp, env = globalEnv) {
  if (!inp.startsWith('define ')) return null
  inp = spaceParser(inp.slice(7))
  let identifier
  let str = inp.slice(0)
  let val
  if (!(identifier = identifierParser(inp))) return null
  str = identifier[1]
  if (!(val = expression(str, env))) return null
  env[identifier[0]] = val[0]
  str = spaceParser(val[1])
  if (!str.startsWith(')')) return null
  str = spaceParser(str.slice(1))
  return ['', str]
}
function ifParser (inp, env = globalEnv) {
  if (!inp.startsWith('if ')) return null
  inp = spaceParser(inp.slice(3))
  let str = inp
  let args = []
  while (!str.startsWith(')')) {
    let result = expression(str)
    if (result === null) return null
    args.push(result[0])
    str = spaceParser(result[1])
  }
  str = str.slice(1)
  if (args[0]) return [args[1], str]
  return [args[2], str]
}
function beginParser (inp, env = globalEnv) {
  let result
  if (!inp.startsWith('begin ')) return null
  inp = inp.slice(6)
  while (inp[0] !== ')') {
    result = sExpressionParser(spaceParser(inp), env)
    inp = spaceParser(result[1])
  }
  return [result[0], inp.slice(1)]
}

function specialFormParser (inp, env = globalEnv) {
  let result
  if (inp.startsWith('(')) {
    inp = spaceParser(inp.slice(1))
  }
  result = defineParser(inp)
  return result
}

function operator (inp, env = globalEnv) {
  let str = inp
  let op = str.slice(0, str.indexOf(' '))
  if (!env[op]) return null
  let args = []
  str = spaceParser(str.slice(op.length))
  while (!str.startsWith(')')) {
    let result = expression(spaceParser(str))
    if (result === null) return null
    args.push(result[0])
    str = spaceParser(result[1])
  }
  str = str.slice(1)
  return [env[op](...args), str]
}

function idEvalParser (str, env = globalEnv) {
  let result = identifierParser(str)
  if (result === null) return null
  let id = result[0]
  let val = env[id]
  if (val === undefined) return null
  if (typeof (val) === 'function') return operator(str)
  return [val, result[1]]
}

function expression (inp, env = globalEnv) {
  let str = inp
  let result
  while (!str.startsWith(')')) {
    if (str.startsWith('(')) {
      str = str.slice(1)
    }
    let parsers = [idEvalParser, operator, ifParser, numberParser, beginParser]
    for (let parser of parsers) {
      result = parser(spaceParser(str))
      if (result) break
    }
    if (!(result)) return null
    return result
  }
}

function sExpressionParser (inp, env = globalEnv) {
  let str = inp.trim()
  let result
  let val
  while (str.startsWith('(')) {
    result = expression(spaceParser(str), env) ||
    specialFormParser(spaceParser(str), env)
    if (!result) return null
    str = spaceParser(result[1])
  }
  if ((val = numberParser(str))) {
    result = val; str = val[1]
  }
  if ((val = identifierParser(str))) {
    result = (env[val[0]] === undefined ? null : [env[val[0]], val[1]]); str = val[1]
  }
  if (!result) return null
  return [result[0], str]
}

function evaluate (input) {
  let result = sExpressionParser(input, globalEnv)
  return (!result || result[1] !== '' ? 'Invalid' : result[0])
}

var rl = readline.createInterface(process.stdin, process.stdout)
rl.setPrompt('lisp> ')
rl.prompt()
rl.on('line', function (line) {
  if (line === 'quit') rl.close()
  console.log(evaluate(line))
  rl.prompt()
}).on('close', function () {
  process.exit(0)
})
console.log(evaluate('(define r 10) (+ 2 3)'))
console.log(evaluate('r'))
console.log(evaluate('(/ 90 0)'))

console.log(evaluate('(+ 45 67 (+ 1 1))'))
console.log(evaluate('(define defin 90)'))
console.log(evaluate('(+ defin 40)'))
// console.log(evaluate('(define define define)'))
console.log(evaluate('defin'))
console.log(evaluate('(define oops 50)'))
console.log(evaluate('(if (> 30 45) (+ 45 56) oops)'))
console.log(evaluate('(if (= 12 12) (+ 78 2) 9)'))
console.log(evaluate('(+ 2 3) (+ 4 5) (+ 6 7)'))
console.log(evaluate('(begin (define r 15) (* pi (* r r)))'))
console.log(evaluate('(sqrt (* 2 8))'))
