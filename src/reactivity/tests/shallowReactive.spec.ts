import { effect } from "../effect"
import { shallowReactive } from "../reactive"

describe('test shallowReactive', () => {
    it('test shallowReactive', () => {
        const obj = shallowReactive({
            foo: {
                bar: 1
            }
        })
        const fn = jest.fn(() => obj.foo.bar)
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        obj.foo.bar = 2
        expect(fn).toHaveBeenCalledTimes(1)
    })
    it('test shallowReactive 2', () => {
        const obj = shallowReactive({
            foo: {
                bar: 1
            }
        })
        const fn = jest.fn(() => obj.foo)
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        obj.foo = {bar: 123}
        expect(fn).toHaveBeenCalledTimes(2)
    })
})