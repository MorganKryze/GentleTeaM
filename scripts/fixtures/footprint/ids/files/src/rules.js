// A1: a cell reference stays as the user typed it.
// AA1, A123, a1 and B2 are no ids.
// Google Tag Manager slot C7 is read as is.
const cell = 'A1'
export const parse = (line) => line.split(cell)
