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
   //console.log(val)
  if (!(val = numberParser(inp))) {
      //console.log(val)
          if (!(val = stringParser(inp))) {
            // console.log(val)
            // console.log(inp)
            if ((val = expression(spaceParser(inp.slice(1)))) === null) return null
    } else {
      //  console.log(val[0])
      if (env[val[0]] === undefined) return null
      val[0] = env[val[0]]
    }
  }
  // console.log(val[0], val[1])
  return val
}
function defineParser (inp) {
  if (!inp.startsWith('define')) return null
  inp = spaceParser(inp.slice(6))
  console.log(inp)
  let symbol; let str = inp.slice(0); let val
  if (!(symbol = stringParser(inp))) return null
  console.log(symbol)
  str = symbol[1]
  // console.log(str)
  if (!(val = evaluater(str))) return null
  // console.log(val)
  env[symbol[0]] = val[0]
  console.log(symbol[0], val[0], val[1])
  // console.log("2"+str)
  //return val[1]
  return[val[0], val[1]]
}
function check (inp) {
  let str = inp.slice(0); let count = 1; let result = ''
  while (count) {
    if (str.startsWith('(')) count++
    else if (str.startsWith(')')) count--
    if (!count) break
    result += str[0]; str = str.slice(1)
    if (!str.length) return null
}
  return [result, str]
}
function ifParser (inp) {
  if (!inp.startsWith('if')) return null
  inp = spaceParser(inp.slice(2))
  //console.log(inp)
  let test; let val; let alt
  if (!(test = value(inp))) return null
 // console.log(test)
 // console.log(value)
  if (test[1].startsWith(')')) test[1] = spaceParser(test[1].slice(1))
//  console.log(test[1])
  if(!(val = value(test[1]))) return null
  if (val[1].startsWith(')')) val[1] = spaceParser(val[1].slice(1))
  alt = check(val[1])
  // if(!(alt = value(val[1]))) return null
  if(!(alt[1].startsWith(')'))) return null
  if (test[0]) {
    if (!val) return null
    return [val[0], alt[1]]
  } else {
    //if (!alt) return null
    if (!(alt = value(val[1]))) return null
    return alt
  }
}
function operator (inp) {
  // console.log(inp)
  if(inp === null) return null
  let str = inp.slice(0); let op; let args = []; let val
  if (env[(op = str.slice(0, str.indexOf(' ')))] === undefined) return null
  str = spaceParser(str.slice(op.length))
  // console.log(str)
  while (!str.startsWith(')')) {
    // if ((val = value(str))) args.push(val[0])
    // else {
    //   if (!(val = evaluater(str))) return null
    if (str.startsWith('(')) {
      // console.log(str)
      let exp = expression(spaceParser(str.slice(1)))
      // console.log(exp)
      args.push(exp[0])
      // console.log(args)
      // console.log(exp[1])
      str = spaceParser(exp[1].slice(1))
      // console.log(str)
    }
    // console.log(str)
    val = value(str)
    // if(val === null) console.log('null')
    if ((val = value(str))){
      // console.log(val)
      args.push(+val[0])
      str = val[1] 
      // console.log(args, str)
    // args.push(+val[0])
     // str = val[1]
    }
    // str = val[1]
    // console.log(str.length)
    if (!str.length) return null
  }
  // console.log(env[op](...args), str)
  return [env[op](...args), str]
}
function expression (inp) {
  // console.log(inp)
  // if(inp.length === 0) console.log('null')
  if(inp.length === 0) return null
  let str = inp.slice(0); let result
  while (!str.startsWith(')')) {
    if (str.match(/^(\+|-|\/|\*|<|>|=|<=|>=)/)) {
      if (!(result = operator(spaceParser(str)))) return null
      // console.log(result)
      str = result[1]
     // return result
    } // if ((result = numberParser(inp))) return [result[0], result[1]]
  }
  return result
}
function beginParser (inp) {
  if (!inp.startsWith('begin')) return null
  inp = inp.slice(5)
  while (inp[0] !== ')') {
    result = evaluater(inp)
    input = spaceParser(result[1])
  }
  return [result[0], input.slice(1)]
}
function specialFormParser(inp){
  let result
  input = spaceParser(inp)
  let parsers = [ifParser,beginParser,defineParser]
  for (let parser of parsers) {
    result = parser(inp)
    console.log("1"+result)

    if (result) return result
  }
  return null
}
function evaluater (inp) {
  if(inp === null) return null
  let str = inp.slice(0); let result; let val
  while (str.length && !str.startsWith(')')) {
    //  console.log(str.length)
    if (str.startsWith('(')) {
      if (!(result = sExpressionParser(spaceParser(str.slice(1))))) return null
      // console.log(result)
       str = result[1]
     // console.log(str)
      if(str === undefined) return ' '
      if(str.indexOf(')') === -1) return null
    // console.log(str)
       str= spaceParser(str.slice(1))
    }
    if ((val = numberParser(str))) {
      console.log(val)
      result = val; str = val[1]
      break
    }
    if ((val = stringParser(str))) {
      // console.log(str)
      result = (env[val[0]] === undefined ? null : [env[val[0]], val[1]]); 
      str = val[1]; break
    }
    // if (!str[0] === ')') str = spaceParser(str.slice(1))
  }
  //str = spaceParser(str.slice(1))
 //console.log(str)
 // if (str.length !== 0) return null
 // return [result[0], str]
 if (!result) return null
console.log(result)
  return [result[0], spaceParser(str)]
}
function sExpressionParser(inp){
  // console.log(inp)
  let result
  let parsers = [specialFormParser, expression]
  for (let parser of parsers) {
    result = parser(inp)
    console.log("1" + result)
    if (result) return result
  }
  return null
}
function eval (input) {
  let result = evaluater(input)
  // console.log(result)
  return (result ? result[0] : 'Invalid')
}
