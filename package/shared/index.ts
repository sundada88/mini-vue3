import { makeMap } from './makeMap'

export { makeMap }
export const isArray = Array.isArray

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
    val: object,
    key: string | symbol
  ): key is keyof typeof val => hasOwnProperty.call(val, key)

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object'

export const hasChanged = (value: any, oldValue: any): boolean =>
  value !== oldValue && (value === value || oldValue === oldValue)

export const def = (obj: object, key: string | symbol, value: any) => {
    Object.defineProperty(obj, key, {
      configurable: true,
      enumerable: false,
      value
    })
  }

export const extend = Object.assign

export const objectToString = Object.prototype.toString
export const toTypeString = (value: unknown): string =>
  objectToString.call(value)

export const toRawType = (value: unknown): string => {
    return toTypeString(value).slice(8, -1)
}

export const EMPTY_OBJ: { readonly [key: string]: any } =  {}