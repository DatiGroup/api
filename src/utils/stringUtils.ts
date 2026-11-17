export const arrayToSQLInList = (arr: string[] | number[]): string => {
  if (arr.length < 1) return '(NULL)'

  return `(${arr.map(item => (typeof item === 'number' ? item : `'${item}'`)).join(',')})`
}
