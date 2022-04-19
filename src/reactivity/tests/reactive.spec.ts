import { isProxy, isReactive, reactive } from "../reactive"

describe('reactive', () => {
  it('happy path', () => {
    const original = { foo: 1 }
    const obj = reactive(original)
    expect(original).not.toBe(obj)
    expect(isReactive(obj)).toBe(true)
    expect(isProxy(obj)).toBe(true)
    expect(isReactive(original)).toBe(false)
  })
  it('nested reactive', () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{
        bar: 2
      }]
    }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })
})