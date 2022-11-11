import { effect } from "./effect";

function traverse(value, seen = new Set()) { 
    if (typeof value !== 'object' || value === null || seen.has(value)) {
        return 
    }
    seen.add(value)
    for (const k in value) {
        traverse(value[k], seen)
    }
    return value
}

export function watch(source, cb, options:any = {}) {
    let getter
    let oldValue, newValue
    let cleanUp
    const onInvalidate = (fn) => {
        cleanUp = fn
    }
    const job = () => {
        newValue = effectFn()
        if (cleanUp) cleanUp()
        cb(newValue, oldValue, onInvalidate)
        oldValue = newValue
    }
    if (typeof source === 'function') {
        getter = source
    } else {
        getter = () => traverse(source)
    }
    const effectFn = effect(getter, {
        // scheduler() {
        //     newValue = effectFn()
        //     cb(newValue, oldValue)
        //     oldValue = newValue
        // }
        lazy: true,
        // scheduler: job
        scheduler: () => {
            if (options.flush === 'post') {
                const p = Promise.resolve()
                p.then(job)
            } else {
                job()
            }
        }
    })
    if (options.immediate) {
        job()
    } else {
        oldValue = effectFn()
    }
}