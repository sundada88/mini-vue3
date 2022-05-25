export const extend = Object.assign

export const isObject = value => value !== null && typeof value === 'object'

export const isString = value => typeof value === 'string'

export const hasChanged = (a, b) => !Object.is(a, b)

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key)

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
export const camellize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : ''
  })
}
export const toHandlerKey = (str: string) => {
  return str ? 'on' + capitalize(str) : ''
}

export const EMPTY_OBJ = {}
