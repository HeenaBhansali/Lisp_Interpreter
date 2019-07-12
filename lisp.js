// let readline = require('readline')
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
  console.log('1' + inp)
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
  console.log('find---', val, env)
  // console.log('parent--', env['parent'])
  if (env !== null && env !== undefined) {
    console.log('2---', env)
    if (env[val] === undefined) return findparent(val, env.parent)
    console.log(env[val])
    return env[val]
  }
  return undefined
}
function value (inp, env = globalEnv) {
  console.log('value--' + inp)
  if (inp === null) return null
  let val
  // console.log(numparse(inp))
  if (!(val = numberParser(inp))) {
    // console.log('------')
    if (!(val = identifierParser(inp))) {
      if ((val = sExpressionParser(spaceParser(inp.slice(1)), env)) === null) return null
    } else {
      // console.log('str---' + val)
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
  console.log('func+++' + inp)
  let i = 0
  let str = inp[1].slice(0)
  let args = []
  let val
  while (!str.startsWith(')')) {
    // console.log('str-----' + str)
    if (str.startsWith('(')) {
      let exp = sExpressionParser(spaceParser(str.slice(0)), env)
      console.log('func--' + str)
      args.push(exp[0])
      str = spaceParser(exp[1])
    } else if ((val = value(str, env))) {
      // console.log('val----' + val)
      args.push(val[0])
      // console.log(args)
      str = val[1]
    } else return null
    if (!str.length) return null
  }
  console.log(inp)
  args.push(inp[0].def, inp[0].parent)
  console.log(inp[0].def + inp[0].parent)
  for (let index in inp[0]) {
    inp[0][index] = args[i++]
  // console.log(inp[0])
  // console.log(index)
  // console.log('func-------', inp[0][index], args[i++])
  }
  let result = expression(inp[0].def, inp[0])
  console.log(result)
  console.log('----' + result[0] + spaceParser(str))
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
    // console.log(def)
    if (!count) break
    str = str.slice(1)
    if (!str.length) return null
  }
  str = spaceParser(str.slice(1))
  obj['def'] = def
  obj['parent'] = env
  // console.log(obj['def'] + obj['parent'] + obj)
  return [obj, spaceParser(str.slice(1))]
}
function defineParser (inp, env = globalEnv) {
  // console.log('def--' + inp)
  if (!inp.startsWith('define ')) return null
  inp = spaceParser(inp.slice(7))
  let identifier
  let str = inp.slice(0)
  let val
  if (!(identifier = identifierParser(inp))) return null
  str = identifier[1]
  // console.log('def--' + identifier)
  // console.log('def--2---' + str)
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
  console.log('spec--' + inp)
  let result
  if (inp.startsWith('(')) {
    inp = spaceParser(inp.slice(1))
  }
  result = defineParser(inp) || lambda(inp) || quoteParser(inp)
  if (!result) {
    if ((result = identifierParser(inp))) {
      console.log('fhdddddddddddddgf' + result)
      console.log(result)

      if (!result || findparent(result[0], env) === undefined || typeof (findparent(result[0], env)) !== 'object') return null
      let res = findparent(result[0], env)
      console.log('1=------------------------------------------------------')
      console.log(res)
      result = func([res, result[1]], res)
      console.log('res' + result)
      // if (result[1] === ')') result[1] = ''
      return result
    }
  }
  return result
}

function operator (inp, env) {
  let str = inp
  let op = str.slice(0, str.indexOf(' '))
  if (findparent(op, env) === undefined) return null
  //  if (!env[op]) return null
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
  console.log('op---' + res)
  console.log(env)
  return [res(...args), str]
}

function idEvalParser (str, env) {
  console.log('id----' + str)
  let result = identifierParser(str)
  if (result === null) return null
  console.log(result)
  let id = result[0]
  let val = findparent(id, env)
  console.log('3val-----')
  // if (findparent(op, env) === undefined) return null
  console.log(val)
  if (val === undefined) return null
  return [val, result[1]]
}

function expression (inp, env) {
  console.log('exp--' + env)
  let str = inp
  let result
  while (!str.startsWith(')')) {
    if (str.startsWith('(')) {
      str = str.slice(1)
    }
    let parsers = [numberParser, idEvalParser, operator, ifParser, numberParser, beginParser]
    for (let parser of parsers) {
      result = parser((spaceParser(str)), env)
      console.log(result)
      if (result) break
    }
    if (!(result)) return null
    return result
  }
}

function sExpressionParser (inp, env = globalEnv) {
  console.log('sexp--' + inp)
  let str = inp.trim()
  let result
  let val
  while (str.startsWith('(')) {
    result = specialFormParser(spaceParser(str), env) ||
    expression(spaceParser(str), env)
    console.log('sexpp---' + result)
    if (!result) return null
    str = spaceParser(result[1])
  }
  if ((val = numberParser(str))) {
    result = val; str = val[1]
  }
  if ((val = identifierParser(str))) {
    result = findparent((val[0]), env)
    // result = (env[val[0]] === undefined ? null : [env[val[0]], val[1]]); str = val[1]
    console.log('val---', result)
  }
  if (!result) return null
  return [result[0], str]
}

function evaluate (input) {
  let result = sExpressionParser(input, globalEnv)
  console.log('---' + result)
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
// console.log(evaluate('(define r 10) (+ 2 3)'))
console.log(evaluate('(define r 10)'))
console.log(evaluate('(* r r)'))
console.log(evaluate('r'))
console.log(evaluate('(/ 90 10)'))

console.log(evaluate('(+ 45 67 (+ 1 1))'))
console.log(evaluate('(define define 90)'))
console.log(evaluate('(+ define 40)'))
console.log(evaluate('(define define define)'))
console.log(evaluate('define'))
// console.log(evaluate('(define oops 50)'))
// console.log(evaluate('(if (> 30 45) (+ 45 56) oops)'))
console.log(evaluate('(if (= 12 12) (+ 78 2) 9)'))
// console.log(evaluate('(+ 2 3) (+ 4 5) (+ 6 7)'))
// console.log(evaluate('(begin (define r 15) (* pi (* r r)))'))
// console.log(evaluate('(sqrt (* 2 8))'))
console.log(evaluate('(define circlearea (lambda (r) (* pi r r)))'))
console.log(evaluate('(circlearea 3)'))

console.log(evaluate('(circlearea (circlearea 3) )'))
