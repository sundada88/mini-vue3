import { EMPTY_OBJ, isArray } from "../shared"
import { TriggerOpTypes } from "./operations"

export const ITERATE_KEY = Symbol('iterate')
export const MAP_KEY_ITERATE_KEY = Symbol('Map key iterate')

const targetMap = new WeakMap()

export const TriggerType = {
    SET: 'SET',
    ADD: 'ADD',
    DELETE: 'DELETE'
}

let activeEffect: any = null
const effectStack: any = []

export function isEffect(fn): boolean {
    return fn && fn._isEffect
}

export function effect(fn, options = EMPTY_OBJ) {
    if (isEffect(fn)) {
        fn = fn.raw
    }
    const effect = createReactiveEffect(fn, options)
    if (!options.lazy) {
        effect()
    }
    return effect
}

let uid = 0

function createReactiveEffect(fn, options): any {
    const effect: any = function reactiveEffect(...args) {
        if (!effect.active) {
            return options.scheduler ? undefined : fn(...args)
        }
        if (!effectStack.includes(effect)) {
            cleanUp(effect)
            try {
                enableTracking()
                effectStack.push(effect)
                activeEffect = effect
                return fn(...args)
            } finally {
                effectStack.pop()
                resetTracking()
                activeEffect = effectStack[effectStack.length - 1]
            }
        }
    }
    effect.uid = uid ++
    effect._isEffect = true
    effect.active = true
    effect.raw = fn
    effect.deps = []
    effect.options = options
    return effect
}

let shouldTrack = true
const trackStack: boolean [] =  []

export function pauseTracking () {
    trackStack.push(shouldTrack)
    shouldTrack = false
}

export function enableTracking () {
    trackStack.push(shouldTrack)
    shouldTrack = true
}

export function resetTracking () {
    const last = trackStack.pop()
    shouldTrack = last === undefined ? true : last
}

function cleanUp(effect) {
    const {deps} = effect
    if (deps.length) {
        for (let i = 0; i < deps.length; i ++) {
            deps[i].delete(effect)
        }
        deps.length = 0
    }
    // for (let i = 0; i < effectFn.deps.length; i ++) {
    //     const deps = effectFn.deps[i]
    //     deps.delete(effectFn)
    // }
    // // 清空副作用函数的依赖集合
    // effectFn.deps.length = 0
}

export function track(target, type, key) {
    if (!shouldTrack || !activeEffect) {
        return
    }
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
        depsMap.set(key, (dep = new Set()))
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect)
        // activeEffect.deps 将和 activeEffect 相关联的依赖集合
        console.log('activeEffect -->', activeEffect)
        activeEffect.deps.push(dep)
    }
}

export function trigger(target, type, key, newValue?, oldValue?) {
    const depsMap = targetMap.get(target)
    if (!depsMap) return
    // const effectsToRun: any = new Set(depsMap.get(key))
    // const effects = depsMap.get(key)
    const effects = new Set()

    const add = effectsToAdd => {
        if  (effectsToAdd) {
            effectsToAdd.forEach(effect => {
                if (effect !== activeEffect && !shouldTrack) {
                effects.add(effect)      
                }
            })
        }
    }

    if (key === 'length' && isArray(target)) {
        depsMap.forEach((dep, key) => {
            if (key === 'length' || key >= (newValue)) {
                add(dep)
            }
        })
    } else {
        if (key !== void 0) {
            add(depsMap.get(key))
        }
        const isAddOrDelete = 
            type === TriggerOpTypes.ADD ||
            (type === TriggerOpTypes.DELETE && !isArray(target))
        
        if (isAddOrDelete || (type === TriggerOpTypes.SET && target instanceof Map)) {
            add(depsMap.get(isArray(target) ? 'length' : ITERATE_KEY))
        }

        if (isAddOrDelete && target instanceof Map) {
            add(depsMap.get(MAP_KEY_ITERATE_KEY))
        }
    }

    const run = effect => {
        if (effect.options.scheduler) {
            effect.options.scheduler(effect)
        } else {
            effect()
        }
    }

    effects.forEach(run)

    // const iterateEffects = depsMap.get(ITERATE_KEY)
    // // effectsToRun && effectsToRun.forEach(effectFn => effectFn())
    // // 避免无限递归，如果当前的 activeEffect 和 触发的副作用函数是同一个则不触发
    // const effectsToRun: any = new Set()
    // effects && effects.forEach(effectFn => {
    //     if (effectFn !== activeEffect) {
    //         effectsToRun.add(effectFn)
    //     }
    // })
    // // 处理数组的ADD操作
    // if (type === TriggerType.ADD && Array.isArray(target)) {
    //     const lengthEffects = depsMap.get('length')
    //     lengthEffects && lengthEffects.forEach(effectFn => {
    //         if (effectFn !== activeEffect) {
    //             effectsToRun.add(effectFn)
    //         }
    //     })
    // }

    // if (Array.isArray(target) && key === 'length') {
    //     depsMap.forEach((effects, key) => {
    //         if (key >= newValue) {
    //             effects.forEach(effectFn => {
    //                 if (effectFn !== activeEffect) {
    //                     effectsToRun.add(effectFn)
    //                 }
    //             })
    //         }
    //     })
    // }

    // if (type === TriggerType.ADD || type === TriggerType.DELETE) {
    //     iterateEffects && iterateEffects.forEach(effectFn => {
    //         if (effectFn !== activeEffect) {
    //             effectsToRun.add(effectFn)
    //         }
    //     })
    // }

    // effectsToRun.forEach(effectFn => {
    //     if (effectFn.options && effectFn.options.scheduler) {
    //        effectFn.options.scheduler()
    //     } else {
    //         effectFn()
    //     }
    // })
}