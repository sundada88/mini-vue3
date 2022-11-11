import { 
  def, 
  hasOwn, 
  isObject, 
  makeMap, 
  toRawType 
} from "../shared"

import { 
  mutableHandlers,
  readonlyHanlders, 
  shallowReactiveHandlers, 
  shallowReadonlyHandlers 
} from "./baseHandlers"
import { mutableCollectionHandlers, readonlyCollectionHandlers, shallowCollectionHandlers } from "./collectionHandlers"

export const enum ReactiveFlags {
    SKIP = '__v_skip',
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly',
    RAW = '__v_raw',
    REACTIVE = '__v_reactive',
    READONLY = '__v_readonly'
  }

const isObservableType = /*#__PURE__*/ makeMap(
  'Object,Array,Map,Set,WeakMap,WeakSet'
)
const collectionTypes = new Set<Function>([Set, Map, WeakMap, WeakSet])
const canObserve = (value: any): boolean => {
    return (
        !value[ReactiveFlags.SKIP] && 
        isObservableType(toRawType(value)) &&
        !Object.isFrozen(value)
    )
}


function createReactiveObject(target, isReadonly = false, baseHandlers, collectionHandlers) {
    if (!isObject(target)) {
        return target
    }
    // 已经代理过的对象直接返回
    if (
      target[ReactiveFlags.RAW] &&
      !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
    ) {
      return target
    }
    if (
        hasOwn(target, isReadonly ? ReactiveFlags.READONLY : ReactiveFlags.REACTIVE)
      ) {
        return isReadonly
          ? target[ReactiveFlags.READONLY]
          : target[ReactiveFlags.REACTIVE]
      }
    if (!canObserve(target)) {
        return target
    }
    const observed = new Proxy(
      target, 
      collectionTypes.has(target.constructor) ? collectionHandlers : baseHandlers
    )
    def(
        target,
        isReadonly ? ReactiveFlags.READONLY : ReactiveFlags.REACTIVE,
        observed
      )
    return observed
}

export function reactive(target) {
    if (target && target[ReactiveFlags.IS_READONLY]) {
      return target
    }
    return createReactiveObject(
        target,
        false,
        mutableHandlers,
        mutableCollectionHandlers
      )
}

export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers)
}

export function readonly(target) {
  return createReactiveObject(
      target,
      false,
      readonlyHanlders,
      shallowCollectionHandlers
  )
}

export function shallowReadonly(target) {
  return createReactiveObject(target, true, shallowReadonlyHandlers, readonlyCollectionHandlers)
}

export function isReactive (value): boolean {
  if  (isReadonly(value)) {
    return isReactive(value[ReactiveFlags.RAW])
  }
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}

export function isReadonly (value): boolean {
  return !!(value && value[ReactiveFlags.IS_READONLY])
}

export function isProxy (value) : boolean {
  return isReactive(value) || isReadonly(value)
}

export function toRaw<T>(observed: T): T {
    return (
      (observed && toRaw(observed[ReactiveFlags.RAW])) || observed
    )
}

export function markRaw(value) {
  def(value, ReactiveFlags.SKIP, true)
  return value
}