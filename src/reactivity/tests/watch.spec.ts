import { reactive } from "../reactive"
import { watch } from "../watch"

describe('test watch', () => {
    it('happy path', () => {
        const obj = reactive({foo: 1})
        const fn = jest.fn()
        watch(obj, fn)
        obj.foo ++
        expect(fn).toHaveBeenCalled()
    })
    it('watch first param can be function', () => {
        const obj = reactive({foo: 1})
        const fn = jest.fn()
        watch(() => obj.foo, fn)
        obj.foo ++
        expect(fn).toHaveBeenCalled()
    })
    it('可以在回调中拿到新值和旧值', () => {
        const obj = reactive({foo: 1})
        let oldVal = null
        let newVal = null
        const fn = jest.fn()
        watch(() => obj.foo, (newValue, oldValue) => {
            newVal = newValue
            oldVal = oldValue
            fn()
        })
        expect(fn).not.toHaveBeenCalled()
        obj.foo ++
        expect(fn).toHaveBeenCalled()
        expect(oldVal).toBe(1)
        expect(newVal).toBe(2)
    })
    it('immediate watch', () => {
        const obj = reactive({foo: 1})
        const fn = jest.fn()
        watch(() => obj.foo, () => {
            fn()
        }, {
            immediate: true
        })
        expect(fn).toHaveBeenCalled()
    })
    it.skip('竞态问题', () => {
        // let finalData
        // watch(obj, async () => {
        //     const res = await fetch('/path/to/request')
        // })
        // finalData = res
        // 如果连续发送了 a 和 b 两个请求，如果 b 的请求回来的时机晚于 a 的时机，那么就会出现错乱的情况
        const fetch = (foo) => new Promise((resolve) => {
            setTimeout(() => {
                resolve(foo)
            }, 3000)
        })
        let finalData
        const obj = reactive({foo: 1})
        watch(obj, async(newValue, oldValue, onInvalidate) => {
            let expired = false
            onInvalidate(() => {
                expired = true
            })
            const res = await fetch(obj.foo)
            if (!expired) {
                finalData =res
            }
            console.log('finalData -->', finalData)
        })
        setTimeout(() => {
            obj.foo = 2
        }, 1000)
        setTimeout(() => {
            obj.foo = 3
        }, 2000)
    })
})