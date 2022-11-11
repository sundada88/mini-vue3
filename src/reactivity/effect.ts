import { ITERATE_KEY } from "./reactive"

const targetMap = new WeakMap()

export const TriggerType = {
    SET: 'SET',
    ADD: 'ADD',
    DELETE: 'DELETE'
}

let activeEffect: any = null
const effectStacks: any = []

export function effect(fn, options?: any) {
    const effectFn = () => {
        cleanUp(effectFn)
        activeEffect = effectFn
        effectStacks.push(effectFn)
        const res = fn()
        effectStacks.pop()
        activeEffect = effectStacks[effectStacks.length - 1]
        return res
    }
    // effectFn.deps 用来存储所有与该副作用函数相关联的额依赖集合
    effectFn.deps = []
    effectFn.options = options
    if (options && options.lazy) {
    } else {
        effectFn()
    }
    return effectFn
}

function cleanUp(effectFn) {
    for (let i = 0; i < effectFn.deps.length; i ++) {
        const deps = effectFn.deps[i]
        deps.delete(effectFn)
    }
    // 清空副作用函数的依赖集合
    effectFn.deps.length = 0
}

export function track(target, key) {
    if (!activeEffect) return
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }
    let deps = depsMap.get(key)
    if (!deps) {
        depsMap.set(key, (deps = new Set()))
    }
    deps.add(activeEffect)
    // activeEffect.deps 将和 activeEffect 相关联的依赖集合
    activeEffect.deps.push(deps)
}

export function trigger(target, key, type, newVal?) {
    const depsMap = targetMap.get(target)
    if (!depsMap) return
    // const effectsToRun: any = new Set(depsMap.get(key))
    const effects = depsMap.get(key)

    const iterateEffects = depsMap.get(ITERATE_KEY)
    // effectsToRun && effectsToRun.forEach(effectFn => effectFn())
    // 避免无限递归，如果当前的 activeEffect 和 触发的副作用函数是同一个则不触发
    const effectsToRun: any = new Set()
    effects && effects.forEach(effectFn => {
        if (effectFn !== activeEffect) {
            effectsToRun.add(effectFn)
        }
    })
    // 处理数组的ADD操作
    if (type === TriggerType.ADD && Array.isArray(target)) {
        const lengthEffects = depsMap.get('length')
        lengthEffects && lengthEffects.forEach(effectFn => {
            if (effectFn !== activeEffect) {
                effectsToRun.add(effectFn)
            }
        })
    }

    if (Array.isArray(target) && key === 'length') {
        depsMap.forEach((effects, key) => {
            if (key >= newVal) {
                effects.forEach(effectFn => {
                    if (effectFn !== activeEffect) {
                        effectsToRun.add(effectFn)
                    }
                })
            }
        })
    }

    if (type === TriggerType.ADD || type === TriggerType.DELETE) {
        iterateEffects && iterateEffects.forEach(effectFn => {
            if (effectFn !== activeEffect) {
                effectsToRun.add(effectFn)
            }
        })
    }

    effectsToRun.forEach(effectFn => {
        if (effectFn.options && effectFn.options.scheduler) {
           effectFn.options.scheduler()
        } else {
            effectFn()
        }
    })
}