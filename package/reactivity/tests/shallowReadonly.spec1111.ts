import { shallowReadonly } from "../reactive"

describe('test shallowReadonly', () => {
    it('happy path', () => {
        console.warn = jest.fn()
        const obj = shallowReadonly({foo: {bar: 1}})
        obj.foo = {baz: 2}
        expect(console.warn).toHaveBeenCalledTimes(1)
        obj.foo.bar = 2
        expect(console.warn).toHaveBeenCalledTimes(1)
        delete obj.foo
        expect(console.warn).toHaveBeenCalledTimes(2)
        delete obj.foo.bar
        expect(console.warn).toHaveBeenCalledTimes(2)
    })
})