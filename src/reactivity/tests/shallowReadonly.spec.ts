import { isReadonly, shallowReadonly } from "../reactive"

describe('shallowReadonly', () => {
  it('should not make non-reactive properties reactive', () => {
    const obj = shallowReadonly({ n: { foo: 1 } })
    expect(isReadonly(obj)).toBe(true)
    expect(isReadonly(obj.n)).toBe(false)
  })
  it('when set value, should console warn', () => {
    console.warn = jest.fn()
    const obj = shallowReadonly({ foo: 1 })
    obj.foo = 2
    expect(console.warn).toBeCalledTimes(1)
  })
})

