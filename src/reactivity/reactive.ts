import { track, trigger, TriggerType } from "./effect"

export const ITERATE_KEY = 'ITERATE_KEY'


const arrayInstrumentations = {}

;['includes', 'indexOf', 'lastIndexOf'].forEach(method => {
    const originMethod = Array.prototype[method]
    arrayInstrumentations[method] = function (...args: any) {
        let res = originMethod.apply(this, args)
        if (res === false) {
            res = originMethod.apply((this as any).raw, args)
        }
        return res
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

function createReactive(obj, isShallow = false, isReadonly = false) {
    return new Proxy(obj, {
        get(target, key, receiver) {
            if (key === 'raw') {
                return target
            }

            // 如果操作对象是数组，并且 key 存在于 arrayInstrumentations 上
            // 那么返回定义在 arrayInstrumentations 上的值
            if (Array.isArray(target) && arrayInstrumentations.hasOwnProperty(key)) {
                return Reflect.get(arrayInstrumentations, key, receiver)
            }

            // return target[key]
            if (!isReadonly && typeof key !== 'symbol' && shouldTrack) {
                track(target, key)
            }
            const res = Reflect.get(target, key, receiver)
            if (isShallow) {
                return res
            }
            // 如果  res 是个对象, 需要再次代理一下
            if (typeof res === 'object' && res !== null) {
                return isReadonly ? readonly(res) : reactive(res)
            }
            return res
        },
        set(target, key, newVal, receiverr) {
            if (isReadonly) {
                console.warn(`属性${key as string}是只读的`)
                return true
            }
            // 获取旧值
            const oldVal = target[key]
            // target[key] = newVal
            const type = Array.isArray(target) ? Number(key) < target.length ?  TriggerType.SET : TriggerType.ADD 
                        : Object.prototype.hasOwnProperty.call(target, key) ? TriggerType.SET : TriggerType.ADD
            const res = Reflect.set(target, key, newVal, receiverr)
            if (target === receiverr.raw) {
                if (oldVal !== newVal && (oldVal === oldVal || newVal === newVal)) {
                    trigger(target, key, type, newVal)
                }
            }
            return res
        },
        // 'foo' in obj
        has(target, key) {
            track(target, key)
            return Reflect.has(target, key)
        },
        ownKeys(target) {
            track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)
            return Reflect.ownKeys(target)
        },
        // 删除属性操作
        deleteProperty(target, key) {
            if (isReadonly) {
                console.warn(`属性${key as string}是只读的`)
                return true
            }
            const hadKey = Object.prototype.hasOwnProperty.call(target, key)
            const res = Reflect.deleteProperty(target, key)
            if (res && hadKey) {
                trigger(target, key, TriggerType.DELETE)
            }
            return res
        }
    })
}

const reactiveMap = new Map()

export function reactive(obj) {
    const existionProxy = reactiveMap.get(obj)
    if (existionProxy) return existionProxy
    const proxy = createReactive(obj)
    reactiveMap.set(obj, proxy)
    return proxy
}


export function shallowReactive(obj) {
    return createReactive(obj, true)
}

export function readonly(obj) {
    return createReactive(obj, false, true)
}

export function shallowReadonly(obj) {
    return createReactive(obj, true, true)
}