function numberParser (inp) {
  let result
  return (result = inp.match(/^-?(0|[\d1-9]\d*)(\.\d+)?(?:[Ee][+-]?\d+)?/)) && [result[0], spaceParser(inp.slice(result[0].length))]
}
function stringParser (inp) {
  let result
  return (result = inp.match(/^[a-zA-z]\w*/)) && [result[0], spaceParser(inp.slice(result[0].length))]
}
function spaceParser (inp) {
  let regex = /^\s+/
  inp = inp.replace(regex, '')
  return inp
}
var env = {
  '+': (...list) => list.reduce((x, y) => x + y),
  '-': (...list) => list.reduce((x, y) => x - y),
  '*': (...list) => list.reduce((x, y) => x * y),
  '/': (...list) => list.reduce((x, y) => x / y),
  '<': (x, y) => x < y,
  '>': (x, y) => x > y,
  '=': (x, y) => x === y,
  '>=': (x, y) => x >= y,
  '<=': (x, y) => x <= y,
  'pi': Math.PI
}
function define (inp) {
  let symbol; let str = inp.slice(0); let val
  if (!(symbol = stringParser(inp))) return null
  str = symbol[1]
  if (!(val = evaluater(str))) return null
  env[symbol[0]] = val[0]
  return val[1]
}
function operator (inp) {
  let str = inp.slice(0); let op; let args = []; let val
  if (env[(op = str.slice(0, str.indexOf(' ')))] === undefined) return null
  str = spaceParser(str.slice(op.length))
  while (!str.startsWith(')')) {
    if ((val = numberParser(str))) {
      args.push(+val[0])
      str = val[1]
    } else if ((val = stringParser(str))) {
      if (env[val[0]] === undefined) return null
      args.push(Number(env[val[0]]))
      str = val[1]
    } else if (str[0] === '(') {
      if (!(val = evaluater(str))) return null
      args.push(val[0])
      str = val[1]
    }
    if (!str.length) return null
  }
  return [env[op](...args), str]
}
function expression (inp) {
  let str = inp.slice(0); let result
  while (!str.startsWith(')')) {
    if (str.startsWith('begin')) {
      if (!(result = evaluater(spaceParser(inp.slice(5))))) return null
      str = result[1]
    } else if (str.startsWith('define')) {
      if (!(str = define(spaceParser(inp.slice(6))))) return null
      result = ['', str]
    } else if (str.match(/^(\+|-|\/|\*|<|>|=|<=|>=)/)) {
      if (!(result = operator(spaceParser(str)))) return null
      str = result[1]
    } else break
  }
  return result
}
function evaluater (inp) {
  let str = inp.slice(0); let result; let val
  while (str.length && !str.startsWith(')')) {
    if (str.startsWith('(')) {
      if (!(result = expression(spaceParser(str.slice(1))))) return null
      str = result[1]
    }
    if ((val = numberParser(str))) {
      result = val; str = val[1]
      break
    }
    if ((val = stringParser(str))) {
      result = (env[val[0]] === undefined ? null : [env[val[0]], val[1]]); str = val[1]; break
    }
    if (!str[0] === ')') str = spaceParser(str.slice(1))
  }
  str = spaceParser(str.slice(1))
  return [result[0], str]
}
function eval (input) {
  let result = evaluater(input)
  return (result ? result[0] : 'Invalid')
}
