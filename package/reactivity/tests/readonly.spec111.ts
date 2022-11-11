import { effect } from "../effect"
import { readonly } from "../reactive"

    describe('test readonly', () => { 
        it.only('test readonly', () => {
            const obj = readonly({foo: '1'})
            const fn = jest.fn(() => obj.foo)
            console.warn = jest.fn()
            effect(fn)
            expect(fn).toHaveBeenCalledTimes(1)
            obj.foo = 2
            expect(console.warn).toHaveBeenCalled()
        })
        it('test readonly delete prototype', () => {
            const obj = readonly({foo: '1'})
            console.warn = jest.fn()
            delete obj.foo
            expect(console.warn).toHaveBeenCalled()
        })
        it('nest readonly', () => {
            const obj = readonly({foo: { bar: '1'}})
            console.warn = jest.fn()
            obj.foo.bar = 3
            expect(console.warn).toHaveBeenCalledTimes(1)
            delete obj.foo.bar
            expect(console.warn).toHaveBeenCalledTimes(2)
        })
    })