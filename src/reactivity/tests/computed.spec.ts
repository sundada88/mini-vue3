import { computed } from "../computed"
import { reactive } from "../reactive"

describe('computed', () => {
  it('happy path', () => {
    const obj = reactive({ foo: 1 })
    const foo = computed(() => obj.foo)
    expect(foo.value).toBe(1)
  })
  it('computed should be lazy', () => {
    const obj = reactive({ foo: 1 })
    const getter = jest.fn(() => obj.foo)
    const foo = computed(getter)
    expect(getter).not.toHaveBeenCalled()

    expect(foo.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)

    foo.value
    expect(getter).toHaveBeenCalledTimes(1)

    obj.foo = 2
    expect(foo.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)

    expect(foo.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)

    foo.value
    expect(getter).toHaveBeenCalledTimes(2)
  })
})