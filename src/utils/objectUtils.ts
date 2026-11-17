export const lowerizeKeys = (object: Record<any, any>): Record<any, any> =>
  Object.entries(object).reduce(
    (acc, secret): Record<any, any> => {
      acc[secret[0].toLocaleLowerCase()] = secret[1]
      return acc
    },
    {} as Record<any, any>,
  )
