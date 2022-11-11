import { computed } from "../computed"
import { effect } from "../effect"
import { reactive } from "../reactive"

describe('test computed', () => {
    it.only('computed should lazy', () => {
        let dummy: any
        const obj = reactive({foo: 1})
        const fn = jest.fn(() => {
             dummy = obj.foo
             return obj.foo
        })
        const computedVal = computed(fn) 
        expect(fn).not.toHaveBeenCalled()
        expect(computedVal.value).toBe(1)
        expect(fn).toBeCalledTimes(1)
        obj.foo = 2
        expect(fn).toBeCalledTimes(1)
        expect(computedVal.value).toBe(2)
        expect(fn).toBeCalledTimes(2)
    })
    it('nest computed with effect', () => {
        const obj = reactive({
            foo: 'foo',
            bar: 2
        })
        const sumRes = computed(() => obj.foo + obj.bar)
        const fn = jest.fn(() => {
            console.log(sumRes.value)
        })
        effect(fn)
        expect(fn).toBeCalledTimes(1)
        obj.bar = 3
        expect(fn).toBeCalledTimes(2)
    })
})