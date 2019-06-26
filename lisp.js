function numberParser (str) {
  let regEx = /^-?(0|[\d1-9]\d*)(\.\d+)?(?:[Ee][+-]?\d+)?/
  let value = str.match(regEx)
  if (value !== null) return [value[0] * 1, str.slice(value[0].length)]
  // else return null
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
let env = {
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
function opParser (inp) {
  let str = inp.slice(0); let op; let args = []; let val
  if (env[(op = str[0])] === undefined) return null
  str = spaceParser(str.slice(1))
  while (!str.startsWith(')')) {
    if ((val = numberParser(str))) {
      args.push(+val[0])
      str = val[1]
    } else if ((val = stringParser(str))) {
      if (env[val[0]] === undefined) return null
      args.push(env[val[0]])
      str = val[1]
    } else if (str[0] === '(') {
      if (!(val = evaluate(str.slice(0)))) return null
      args.push(val[0])
      str = val[1]
    }
    if (!str.length) return null
  }
  return [env[op](...args), str]
}
function expParser (inp) {
  let str = inp.slice(0); let result
  while (!str.startsWith(')')) {
    if (str.match(/^(\+|-|\/|\*|<|>|=|<=|>=)/)) {
      if (!(result = opParser(spaceParser(str)))) return null
      str = result[1]
    } else break
  }
  return result
}
function evaluate (inp) {
  let str = inp.slice(0); let result; let val
  if (spaceParser(str.slice(1)) === ')') return ['()', '']
  while (str.length && !str.startsWith(')')) {
    if (str.startsWith('(')) {
      if (!(result = expParser(spaceParser(str.slice(1))))) return null
      str = result[1]
    }
    if ((val = numberParser(str))) {
      result = [+val[0], val[1]]; break
    }
    if ((val = stringParser(str))) {
      result = (env[val[0]] === undefined ? null : [env[val[0]], val[1]]); break
    }
    if (!str[0] === ')') str = spaceParser(str.slice(1))
  }
  return [result[0], spaceParser(str.slice(1))]
}
function eva (input) {
  let result = evaluate(input)
  console.log(result ? result[0] : 'Invalid')
}
