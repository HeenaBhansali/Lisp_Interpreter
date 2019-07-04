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
function value (inp) {
  // console.log(inp)
  if(inp === null) return null;
  let val
  val = numberParser(inp)
  // console.log(val)
  if (!(val = numberParser(inp))) {
      // console.log(val)
          if (!(val = stringParser(inp))) {
            // console.log(val)
            if ((val = expression(spaceParser(inp.slice(1)))) === null) return null
    } 
    // console.log(val)
      if (env[val[0]] === undefined) return null
      val[0] = env[val[0]]
  }
  // console.log("a" + val)
return val
}
function defineParser (inp) {
  if (!inp.startsWith('define')) return null
  inp = spaceParser(inp.slice(6))
  let symbol; let str = inp.slice(0); let val
  if (!(symbol = stringParser(inp))) return null
  str = symbol[1]
  if (!(val = sExpressionParser(str))) return null
  env[symbol[0]] = val[0]
  return ['',val[1]]
}
function check (inp) {
  let str = inp.slice(0); let count = 1; let result = ''
  while (count) {
    if (str.startsWith('(')) count++
    if (str.startsWith(')')) count--
    if (!count) break
    result += str[0]; str = str.slice(1)
    if (!str.length) return null
}
  return [result, str]
}
function ifParser (inp) {
  if (!inp.startsWith('if')) return null
  inp = spaceParser(inp.slice(2))
  // console.log(inp)
  let test; let val; let alt
  if (!(test = value(inp))) return null
  if (test[1].startsWith(')')) test[1] = spaceParser(test[1].slice(1))
  if(!(val = value(test[1]))) return null
  if (val[1].startsWith(')')) val[1] = spaceParser(val[1].slice(1))
  alt = check(val[1])
  if(!alt[1].startsWith(')')) return null
  // console.log('test' + test[0])
  if (test[0]) {
    if (!val) return null
    return [val[0], alt[1]]
  } else{
    if (!(alt = value(val[1]))) return null
    return alt
  }
}
  function beginParser (inp) {
    if (!inp.startsWith('begin')) return null
    inp = inp.slice(5)
    while (inp[0] !== ')') {
      result = sExpressionParser(spaceParser(inp))
      inp= spaceParser(result[1])
    }
      return [result[0], inp.slice(1)]
  }
  
  function specialFormParser(inp){
    // console.log(inp)
    let result
    input = spaceParser(inp)
    let parsers = [ifParser,beginParser,defineParser]
    for (let parser of parsers) {
      result = parser(inp)
      // console.log(result)
      if (result) return result
    }
    return null
  }
function operator (inp) {
  if(inp === null) return null
  let str = inp.slice(0); let op; let args = []; let val
  if (env[(op = str.slice(0, str.indexOf(' ')))] === undefined) return null
  str = spaceParser(str.slice(op.length))
  while (!str.startsWith(')')) {
    if (str.startsWith('(')) {
      let exp = expression(spaceParser(str.slice(1)))
      args.push(exp[0])
      str = spaceParser(exp[1].slice(1))
    }
    if ((val = value(str))){
      args.push(+val[0])
      str = val[1] 
    }
    if (!str.length) return null
  }
  return [env[op](...args), str]
}
function expression (inp) {
  // console.log(inp)
  if(inp === null) return null
  let str = inp.slice(0); let result
  while (!str.startsWith(')')) {
    if (str.match(/^(\+|-|\/|\*|<|>|=|<=|>=)/)) {
      if (!(result = operator(spaceParser(str)))) return null
      str = result[1]
      return result
    } if (str.startsWith('(')) {
      result = sExpressionParser(str, env)
      str = result[1] 
    } else return null
  }
  result = check(inp)
  return result
}
function sExpressionParser (inp) {
  let count = 1
  if(inp === null) return null
   if(numberParser(inp) !== null) return numberParser(inp)
  let str = inp.slice(0); let result; let val
  while (str.length && !str.startsWith(')')) {
    if (str.startsWith('(')) {
      str = spaceParser(str.slice(1))
  let parsers = [specialFormParser, expression]
  for (let parser of parsers) {
      result = parser(str)
      // console.log(result)
    if (result !== null) break
  }
      if (!(result)) return null
      str = result[1]
      if(str.indexOf(')') === -1) return null
      if(str.startsWith('(')){
        count++;
      continue
    }
    str= spaceParser(str.slice(1))
    }
    if ((val = numberParser(str))) {
      result = val; str = val[1]
      break
    }
    if ((val = stringParser(str))) {
      result = (env[val[0]] === undefined ? null : [env[val[0]], val[1]]); str = val[1]; break
    }
   }
   if (!result) return null
  return [result[0], spaceParser(str)]
}
function eval (input) {
  let result = sExpressionParser(input)
  // console.log(result)
   return (result ? result[0] : 'Invalid')
}
