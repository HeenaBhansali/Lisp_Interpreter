// var readline = require('readline')
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
  'list': (...list) => list,
  'sqrt': (input) => Math.sqrt(input)
}
function findparent (val, env) {
  if (env !== null && env !== undefined) {
    if (env[val] === undefined) return findparent(val, env.parent)
    return env[val]
  }
  return undefined
}
function value (inp, env = globalEnv) {
  if (inp === null) return null
  let val
  if (!(val = numberParser(inp))) {
    if (!(val = identifierParser(inp))) {
      if ((val = sExpressionParser(spaceParser(inp.slice(1)), env)) === null) return null
    } else {
      if ((val[0] = findparent([val[0]], env)) === undefined) return null
    }
  }
  return val
}
function quoteParser (inp) {
  if (!inp.startsWith('quote ')) return null
  inp = spaceParser(inp.slice(6))
  let str = inp.slice(0)
  let count = 1
  let result = ''
  while (count) {
    if (str.startsWith('(')) count++
    else if (str.startsWith(')')) count--
    if (!count) break
    result += str[0]; str = str.slice(1)
    if (!str.length) return null
  }
  return [result, str]
}
function func (inp, env = globalEnv) {
  let i = 0
  let str = inp[1].slice(0)
  let args = []
  let val
  while (!str.startsWith(')')) {
    if (str.startsWith('(')) {
      let exp = sExpressionParser(spaceParser(str.slice(0)), env)
      args.push(exp[0])
      str = spaceParser(exp[1])
    } else if ((val = value(str, env))) {
      args.push(val[0])
      str = val[1]
    } else return null
    if (!str.length) return null
  }
  args.push(inp[0].def, inp[0].parent)
  for (let index in inp[0]) {
    inp[0][index] = args[i++]
  }
  let result = expression(inp[0].def, inp[0])
  return [result[0], spaceParser(str.slice(1))]
}
function lambda (inp, env = globalEnv) {
  if (!inp.startsWith('lambda ')) return null
  inp = spaceParser(inp.slice(7))
  let args = []
  let obj = {}
  let par
  let count = 1
  let def = '('
  let str = spaceParser(inp.slice(1))
  while (!str.startsWith(')')) {
    par = identifierParser(str)
    args.push(par[0])
    str = par[1]
  }
  for (let x of args) obj[x] = null
  str = spaceParser(str.slice(str.indexOf('(') + 1))
  while (count) {
    if (str.startsWith('(')) count++
    if (str.startsWith(')')) count--
    def += str[0]
    if (!count) break
    str = str.slice(1)
    if (!str.length) return null
  }
  str = spaceParser(str.slice(1))
  obj['def'] = def
  obj['parent'] = env
  return [obj, spaceParser(str.slice(1))]
}
function defineParser (inp, env = globalEnv) {
  if (!inp.startsWith('define ')) return null
  inp = spaceParser(inp.slice(7))
  let identifier
  let str = inp.slice(0)
  let val
  if (!(identifier = identifierParser(inp))) return null
  str = identifier[1]
  if (!(val = sExpressionParser(str, env))) return null
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
    let result = expression(str, env)
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
  result = defineParser(inp) || lambda(inp) || quoteParser(inp)
  if (!result) {
    if ((result = identifierParser(inp))) {
      if (!result || findparent(result[0], env) === undefined || typeof (findparent(result[0], env)) !== 'object') return null
      let res = findparent(result[0], env)
      result = func([res, result[1]], res)
      return result
    }
  }
  return result
}

function operator (inp, env) {
  let str = inp
  let op = str.slice(0, str.indexOf(' '))
  if (findparent(op, env) === undefined) return null
  let args = []
  str = spaceParser(str.slice(op.length))
  while (!str.startsWith(')')) {
    let result = expression((spaceParser(str)), env)
    if (result === null) return null
    args.push(result[0])
    str = spaceParser(result[1])
  }
  str = str.slice(1)
  let res = findparent(op, env)
  return [res(...args), str]
}

function idEvalParser (str, env) {
  let result = identifierParser(str)
  if (result === null) return null
  let id = result[0]
  let val = findparent(id, env)
  if (val === undefined) return null
  return [val, result[1]]
}

function expression (inp, env) {
  let str = inp
  let result
  while (!str.startsWith(')')) {
    if (str.startsWith('(')) {
      str = str.slice(1)
    }
    let parsers = [numberParser, ifParser, beginParser, idEvalParser, operator]
    for (let parser of parsers) {
      result = parser((spaceParser(str)), env)
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
    result = specialFormParser(spaceParser(str), env) ||
    expression(spaceParser(str), env)
    if (!result) return null
    str = spaceParser(result[1])
  }
  if ((val = numberParser(str))) {
    result = val; str = val[1]
  }
  if ((val = identifierParser(str))) {
    result = findparent((val[0]), env)
  }
  if (!result) return null
  return [result[0], str]
}

function evaluate (input) {
  let result = sExpressionParser(input, globalEnv)
  return (!result || result[1] !== '' ? 'Invalid' : result[0])
}

// var rl = readline.createInterface(process.stdin, process.stdout)
// rl.setPrompt('lisp> ')
// rl.prompt()
// rl.on('line', function (line) {
//   if (line === 'quit') rl.close()
//   console.log(evaluate(line))
//   rl.prompt()
// }).on('close', function () {
//   process.exit(0)
// })
console.log(evaluate('(define r 10) (+ 2 3)'))
console.log(evaluate('(define r 10)'))
console.log(evaluate('(* r r)'))
console.log(evaluate('(/ 90 10)'))
console.log(evaluate('(+ 45 67 (+ 1 1))'))
console.log(evaluate('(define define 90)'))
console.log(evaluate('(+ define 40)'))
console.log(evaluate('(define oops 50)'))
console.log(evaluate('(if (> 30 45) (+ 45 56) oops)'))
console.log(evaluate('(if (= 12 12) (+ 78 2) 9)'))
console.log(evaluate('(+ 2 3) (+ 4 5) (+ 6 7)'))
console.log(evaluate('(begin (define r 15) (* pi (* r r)))'))
console.log(evaluate('(define circlearea (lambda (r) (* pi r r)))'))
console.log(evaluate('(circlearea 3)'))
console.log(evaluate('(circlearea (circlearea (circlearea (circlearea 3))))'))
console.log(evaluate('(define fact (lambda (n) (if (<= n 1) 1 (* n (fact (- n 1))))))'))
console.log(evaluate('(fact 10)'))
// (define myfun (lambda (def parent) (* def parent)))
// (if true 1 2) // boolean
console.log(evaluate('(define twice (lambda (x) (* 2 x)))'))
console.log(evaluate('(circlearea (twice (circlearea 3)))'))
