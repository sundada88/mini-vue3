import { ReactiveEffect } from "./effect"

class ComputedRefElem {
  private _getter: any
  private _value: any
  private _dirty: boolean = true
  private _effect: ReactiveEffect
  constructor (getter) {
    // this._getter = getter
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true
      }
    })
  }
  get value() {
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }
}

export function computed(getter) {
  return new ComputedRefElem(getter)
}