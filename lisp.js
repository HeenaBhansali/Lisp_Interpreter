function numParser (str) {
  let regEx = /^-?(0|[\d1-9]\d*)(\.\d+)?(?:[Ee][+-]?\d+)?/
  let value = str.match(regEx)
  if (value !== null) return [value[0] * 1, str.slice(value[0].length)]
  else return null
}
function spaceParser (inp) {
  let regex = /^\s+/
  inp = inp.replace(regex, '')
  return inp
}
function evaluater (inp) {
  inp = spaceParser(inp)
  let result = numParser(inp)
  if (result !== null) return result
  inp = spaceParser(inp)
  if (inp.startsWith('(+')) {
    inp = inp.slice(2)
    inp = inp.substring(0, inp.indexOf(')'))
    return add(inp)
  }
  if (inp.startsWith('(-')) {
    inp = inp.slice(2)
    inp = inp.substring(0, inp.indexOf(')'))
    return sub(inp)
  }
  if (inp.startsWith('(*')) {
    inp = inp.slice(2)
    inp = inp.substring(0, inp.indexOf(')'))
    return mul(inp)
  }
  if (inp.startsWith('(/')) {
    inp = inp.slice(2)
    inp = inp.substring(0, inp.indexOf(')'))
    return div(inp)
  }
  if (inp.startsWith('(%')) {
    inp = inp.slice(2)
    inp = inp.substring(0, inp.indexOf(')'))
    return mod(inp)
  }
}
function add (inputs) {
  inputs = spaceParser(inputs)
  let valArr = inputs.split(' ')
  let sum = 0
  for (let i = 0; i < valArr.length; i++) {
    sum += Number(valArr[i])
  }
  return sum
}
function sub (inputs) {
  inputs = spaceParser(inputs)
  let valArr = inputs.split(' ')
  let sub = valArr[0]
  for (let i = 1; i < valArr.length; i++) {
    sub -= Number(valArr[i])
  }
  return sub
}
function mul (inputs) {
  inputs = spaceParser(inputs)
  let valArr = inputs.split(' ')
  let mul = 1
  for (let i = 0; i < valArr.length; i++) {
    mul *= Number(valArr[i])
  }
  return mul
}
function div (inputs) {
  inputs = spaceParser(inputs)
  let valArr = inputs.split(' ')
  let div = valArr[0]
  for (let i = 1; i < valArr.length; i++) {
    div /= Number(valArr[i])
  }
  return div
}
function mod (inputs) {
  inputs = spaceParser(inputs)
  let valArr = inputs.split(' ')
  let mod = valArr[0]
  for (let i = 1; i < valArr.length; i++) {
    mod %= Number(valArr[i])
  }
  return mod
}
