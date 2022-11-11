import { effect } from "../effect"
import { reactive } from "../reactive"

describe('test effect', () => {
    it.only('happy path', () => {
        const obj = reactive({foo: 'foo'})
        const fn = jest.fn(() => {
            console.log(obj.foo)
        })
        effect(fn)
        expect(fn).toHaveBeenCalled()
        obj.foo = 'fooooo'
        expect(fn).toHaveBeenCalledTimes(2)
    })
    it('分支切换和 cleanup', () => {
        const obj = reactive({ok: true, text: 'hello world'})
        const fn = jest.fn(() => {
            console.log(obj.ok ? obj.text : 'not')
        })
        const fn1 = jest.fn(() => {
            console.log(obj.ok)
        })
        effect(fn)
        effect(fn1)
        expect(fn).toHaveBeenCalled()
        expect(fn1).toHaveBeenCalled()
        obj.text = 'test'
        expect(fn).toHaveBeenCalledTimes(2)
        expect(fn1).toHaveBeenCalledTimes(1)
        obj.ok = false
        expect(fn).toHaveBeenCalledTimes(3)
        expect(fn1).toHaveBeenCalledTimes(2)
        obj.text = 'testaaaa'
        expect(fn).toHaveBeenCalledTimes(3)
    })
    it('嵌套的 effect', () => {
        const obj = reactive({
            ok: true,
            text: 'hello world'
        })
        const fn1 = jest.fn(() => {
            console.log('fn1 run', obj.ok)
        })
        const fn2 = jest.fn(() => {
            console.log('fn2 run', obj.text)
        })
        effect(() => {
            fn1()
            effect(() => {
                fn2()
            })
            console.log(obj.text)
        })
        expect(fn1).toHaveBeenCalledTimes(1)
        expect(fn2).toHaveBeenCalledTimes(1)
        obj.ok = false
        expect(fn1).toHaveBeenCalledTimes(2)
        expect(fn2).toHaveBeenCalledTimes(2)
        obj.text = 'text -->'
        expect(fn1).toHaveBeenCalledTimes(3)
        expect(fn2).toHaveBeenCalledTimes(5)
    })
    it('避免无限递归', () => {
        const obj = reactive({foo: 1})
        const fn = jest.fn(() => {
            obj.foo = obj.foo + 1
        })
        effect(fn)
        expect(obj.foo).toBe(2)
    })
    it('调度执行', () => {
        let dummy: any
        let run: any
        const scheduler = jest.fn(() => {
            run = obj.foo
        })
        const obj = reactive({foo: 1})
        effect(() => {
            dummy = obj.foo
        }, {
            scheduler
        })
        expect(dummy).toBe(1)
        obj.foo += 1
        expect(scheduler).toHaveBeenCalledTimes(1)
        expect(dummy).toBe(1)
        expect(run).toBe(2)
        obj.foo += 1
        expect(scheduler).toHaveBeenCalledTimes(2)
        expect(dummy).toBe(1)
        expect(run).toBe(3)
    })
    it('if options has lazy, should lazy run', () => {
        const obj = reactive({foo: 1})
        const fn = jest.fn(() => {
            console.log(obj.foo)
        })
        effect(fn, {
            lazy: true
        })
        expect(fn).not.toHaveBeenCalled()
    })
})