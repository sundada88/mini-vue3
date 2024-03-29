import { effect, track, trigger } from "./effect"

export function computed(fn) {
    let val: any
    let dirty = true
    const computedFn = effect(fn, {
        lazy: true,
        scheduler() {
            dirty = true
            trigger(obj, 'value')
        }
    })
    const obj = {
        get value() {
            if (dirty) {
                val = computedFn()
                dirty = false
            }  
            track(obj, 'value')
            return val
        }
    }
    return obj
}