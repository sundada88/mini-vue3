import { hasChanged, isObject } from "../shared"
import { isTracking, trackEffects, triggerEffects } from "./effect"
import { reactive } from "./reactive"

class RefElm {
  private _value
  private rawValue
  public dep = new Set()
  public __v_isRef = true
  constructor (value) {
    this._value = convert(value)
    this.rawValue = value
  }
  get value() {
    // TODO: 收集依赖
    trackRefValue(this)
    return this._value
  }
  set value(newValue) {
    if (!hasChanged(newValue, this.rawValue)) return
    // TODO: 触发依赖
    this._value = convert(newValue)
    this.rawValue = newValue
    triggerEffects(this.dep)
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep)
  }
}

export function ref(value) {
  return new RefElm(value)
}

export function isRef(ref) {
  return !!ref.__v_isRef
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref
}

export function proxyRefs(obj) {
  return new Proxy(obj, {
    get(target, key) {
      return unRef(Reflect.get(target, key))
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return target[key].value = value
      }
      return Reflect.set(target, key, value)
    }
  })
}