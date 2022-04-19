import { isProxy, isReadonly, readonly } from "../reactive"

describe('readonly', () => {
  it('happy path', () => {
    const original = { foo: 12, bar: { foo: 111 }, array: [123] }
    const obj = readonly(original)
    expect(obj).not.toBe(original)
    expect(obj.foo).toBe(12)
    expect(isReadonly(obj)).toBe(true)
    expect(isReadonly(obj.bar)).toBe(true)
    expect(isReadonly(obj.array)).toBe(true)
    expect(isReadonly(original)).toBe(false)
    expect(isProxy(obj)).toBe(true)
  })
  it('when set value, should console warn', () => {
    console.warn = jest.fn()
    const obj = readonly({ foo: 1 })
    obj.foo = 2
    expect(console.warn).toBeCalledTimes(1)
  })
})