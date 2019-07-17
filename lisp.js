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
  '+': (list) => list.reduce((x, y) => x + y),
  '-': (list) => list.reduce((x, y) => x - y),
  '*': (list) => list.reduce((x, y) => x * y),
  '/': (list) => list.reduce((x, y) => x / y),
  '<': (arr) => arr[0] < arr[1],
  '>': (arr) => arr[0] > arr[1],
  '=': (arr) => arr[0] === arr[1],
  '>=': (arr) => arr[0] >= arr[1],
  '<=': (arr) => arr[0] <= arr[1],
  'pi': Math.PI,
  'list': (...list) => list,
  'sqrt': (input) => Math.sqrt(input)
}
function findparent (val, env) {
  if (!env[val[0]] && env['func'] && env['func']['parent'][val[0]] !== undefined) {
    return [env['func']['parent'][val[0]], val[1]]
  }
  if (!env[val[0]] && !env['func']) return null
  return [env[val[0]], val[1]]
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
function defineParser (inp, env = globalEnv) {
  if (!inp.startsWith('define ')) return null
  inp = spaceParser(inp.slice(7))
  let identifier
  let val
  if (!(identifier = identifierParser(inp))) return null
  let str = identifier[1]
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
  let condition
  let result
  result = expression(inp, env)
  if (!result) return null
  condition = result[0]
  inp = spaceParser(result[1])
  if (condition) result = sExpressionParser(inp, env)
  else result = sExpressionParser(check(inp)[1], env)
  return [result[0], '']
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

function lambdaParser (inp, env = globalEnv) {
  if (!inp.startsWith('lambda ')) return null
  inp = spaceParser(inp.slice(7))
  let args = {}
  let obj = {}
  let par
  inp = spaceParser(inp.slice(1))
  while (!inp.startsWith(')')) {
    par = identifierParser(inp)
    if (!par) return null
    args[par[0]] = null
    inp = spaceParser(par[1])
  }
  inp = inp.slice(1)
  obj.args = args
  obj.parent = env
  obj.var = []
  let result = check(inp)
  if (!result) return null
  obj.def = result[0]
  inp = spaceParser(result[1])
  if (inp[0] !== ')') return null
  return [obj, inp.slice(1)]
}

function evalLambda (op, inp, env) {
  let value
  let keys = Object.keys(globalEnv[op]['args'])
  // console.log('keys---' + keys)
  let index = 0
  let result

  while (inp[0] !== ')') {
    value = sExpressionParser(inp, env)
    if (!value) return null
    globalEnv[op]['args'][keys[index]] = value[0]
    index++
    inp = spaceParser(value[1])
  }
  // console.log('globalEnv')

  // console.log(globalEnv)

  globalEnv[op]['args']['func'] = globalEnv[op]
  // console.log(globalEnv)

  // console.log('---------')
  // // console.log(globalEnv[op]['args']['func'])
  globalEnv[op]['var'].push(Object.assign({}, globalEnv[op]['args']))
  // console.log(globalEnv[op]['var'])
  inp = inp.slice(1)
  let indexVar = globalEnv[op]['var'].length - 1
  // console.log('index--' + indexVar)
  result = sExpressionParser(globalEnv[op]['def'], globalEnv[op]['var'][indexVar])
  return [result[0], inp]
}

function check (inp) {
  let result
  if ((result = numberParser(spaceParser(inp)))) return [result[0], result[1]]
  else if ((result = identifierParser(spaceParser(inp)))) return [result[0], result[1]]
  let str = spaceParser(inp)
  if (str.startsWith('(')) {
    str = spaceParser(str.slice(1))
    result = '('
    let count = 1
    while (count) {
      if (str.startsWith('(')) count++
      if (str.startsWith(')')) count--
      if (!count) break
      result += str[0]
      str = str.slice(1)
    }
    result += ')'
    return [result, spaceParser(str.slice(1))]
  }
  return null
}
function operator (inp, env) {
  // console.log('op---' + inp)
  let result
  let args = []
  let op = inp.slice(0, inp.indexOf(' '))
  if (!globalEnv[op]) return null
  if (typeof globalEnv[op] === 'object') {
    // console.log('opobj---' + inp)
    inp = spaceParser(inp.slice(op.length))
    result = evalLambda(op, inp, env)
    return result
  }
  inp = spaceParser(inp.slice(op.length))
  while (inp[0] !== ')') {
    result = sExpressionParser(inp, env)
    if (!result) return null
    args.push(result[0])
    inp = spaceParser(result[1])
  }
  return [globalEnv[op](args), inp.slice(1)]
}

function expression (inp, env = globalEnv) {
  let result
  if (!inp.startsWith('(')) return null
  inp = spaceParser(inp.slice(1))
  result = beginParser(inp, env) || ifParser(inp, env) || operator(inp, env)
  if (!result) return null
  return result
}
function specialFormParser (inp, env = globalEnv) {
  let result
  if (!inp.startsWith('(')) return null
  inp = spaceParser(inp.slice(1))
  result = defineParser(inp, env) || lambdaParser(inp, env) || quoteParser(inp, env)
  if (!result) return null
  return result
}
function sExpressionParser (inp, env = globalEnv) {
  // console.log('sexp---' + inp)
  let str = inp.trim()
  let result
  result = specialFormParser(spaceParser(str), env) ||
  expression(spaceParser(str), env)
  if (result) return result
  if ((result = numberParser(str))) return result
  if ((result = identifierParser(str))) return findparent(result, env)
  if (!result) return null
}
function evaluate (inp) {
  let result = sExpressionParser(inp, globalEnv)
  return (!result || result[1] !== '' ? 'Invalid' : result[0])
}

// console.log(evaluate('(* pi 56 72)'))
// console.log(evaluate('(begin (* 86 76) (* 65 45) (define twice (lambda (x) (* 2 x) ) ))'))
// console.log(evaluate('(twice 5)'))
// console.log(evaluate('(/ 90 0)'))

// console.log(evaluate('(+ 45 67 (+ 1 1))'))
// console.log(evaluate('(define define 90)'))
// console.log(evaluate('(define define 90)'))
// console.log(evaluate('(+ define 40)'))
// console.log(evaluate('define'))
// console.log(evaluate('(define oops 50)'))
// console.log(evaluate('( if (> 30 45) (+ 45 56) oops)'))
// console.log(evaluate('(if (= 12 12) (+ 78 2) 90)'))

// console.log(evaluate('(define circle_area ( lambda (r) (* pi r r)))'))
// console.log(evaluate('(circle_area 3 )'))
console.log(evaluate('(define fact (lambda (n) (if (<= n 1) 1 (* n (fact (- n 1))))))'))
console.log(evaluate('(fact 3)'))

// console.log(evaluate('(define twice (lambda (x) (* 2 x) ) )'))
// console.log(evaluate('(twice (+ 78 9) )'))
// console.log(evaluate('(define fib (lambda (n) (if (< n 2) 1 (+ (fib (- n 1) ) (fib (- n 2) )))))'))
// console.log(evaluate('(fib 5)'))
// console.log(evaluate('(sqrt 49 )'))
// console.log(evaluate('(define triplet (lambda (x y z) (+ x (* y z) ) ) )'))
// console.log(evaluate('(triplet (sqrt 49) 6 7)'))
// console.log(evaluate('(define myfun (lambda (def parent) (* def parent)))'))
// console.log(evaluate('(myfun 2 3)'))
// console.log(evaluate('(define x 10)'))
// console.log(evaluate('(define y x)'))
// console.log(evaluate('y'))
