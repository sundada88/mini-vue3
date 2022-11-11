import { extend, hasChanged, hasOwn, isArray, isObject } from "../shared";
import { ITERATE_KEY, track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operations";
import { reactive, ReactiveFlags, readonly, toRaw } from "./reactive";
import { isRef } from "./ref";

const arrayInstrumentations = {}

;['includes', 'indexOf', 'lastIndexOf'].forEach(method => {
    arrayInstrumentations[method] = function (...args: any) {
        const arr = toRaw(this) as any
        for (let i = 0, l = arr.length; i< l; i ++) {
            track(arr, TrackOpTypes.GET, i + '')
        }
        const res = arr[method](...args)
        if (res === -1 || res === false) {
            return arr[method](...args.map(toRaw))
        } else {
            return res
        }
    }
})

let shouldTrack = true
;['push', 'pop'].forEach(method => {
    const originMethod = Array.prototype[method]
    arrayInstrumentations[method] = function(...args) {
        shouldTrack = false
        let res = originMethod.apply(this, args)
        shouldTrack = true
        return res
    }
})
function createGetter  (isReadonly = false, isShallow = false) {
    return function get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        } else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly
        } else if (key === ReactiveFlags.RAW && receiver === (isReadonly ? target[ReactiveFlags.READONLY] : target[ReactiveFlags.REACTIVE])) {
            return target
        }

        // 如果操作对象是数组，并且 key 存在于 arrayInstrumentations 上
        const targetIsArray = isArray(target)
        // 那么返回定义在 arrayInstrumentations 上的值
        if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
            return Reflect.get(arrayInstrumentations, key, receiver)
        }

        const res = Reflect.get(target, key, receiver)
        // return target[key]

        if (!isReadonly) {
            track(target, null, key)
        }
        if (key === 'size') {
            return Reflect.get(target, key, target)
        }
        if (isShallow) {
            return res
        }
        if (isRef(res)) {
            return targetIsArray ? res : res.value
        }
        // 如果  res 是个对象, 需要再次代理一下
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res)
        }
        return res
    }
}

function createSetter  (shallow = false) {
    return function get(target, key, value, receiver) {
        const oldValue = target[key]
        if (!shallow) {
            value = toRaw(value)
            if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
                oldValue.value = value
                return true
            }
        }
        // if (isReadonly) {
        //     console.warn(`属性${key as string}是只读的`)
        //     return true
        // }
        const hadKey = hasOwn(target, key)
        const result = Reflect.set(target, key, value, receiver)
        // 获取旧值
        // target[key] = newVal
        if (target === toRaw(receiver)) {
            if (!hadKey) {
                trigger(target, TriggerOpTypes.ADD, key, value)
            } else if (hasChanged(value, oldValue)) {
                trigger(target, TriggerOpTypes.SET, key, value, oldValue)
            }
        }
        return result
    }
}

function deleteProperty(target, key): boolean {
    const hadKey = hasOwn(target, key)
    const oldValue = target[key]
    const result = Reflect.deleteProperty(target, key)
    if (result && hadKey) {
        trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
    }
    return result
}

function has(target, key): boolean {
    const result = Reflect.get(target, key)
    // track(target, TrackOpTypes.HAS, key)
    track(target, TrackOpTypes.HAS, key)
    return result
}

function ownKeys(target) {
    // track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
    track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
    return Reflect.ownKeys(target)
}
const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter()

export const mutableHandlers = {
    get,
    set,
    deleteProperty,
    has,
    ownKeys
  }

export const shallowReactiveHandlers = extend(
    {}, 
    mutableHandlers, 
    {
        get: shallowGet,
        set: shallowSet
    }
)

export const readonlyHanlders = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target)
        return true
    },
    deleteProperty(target, key) {
        console.warn(
          `Delete operation on key "${String(key)}" failed: target is readonly.`,
          target
        )
        return true
    },
    has,
    ownKeys
}


export const shallowReadonlyHandlers = extend({}, readonlyHanlders, {
    get: shallowReadonlyGet
})