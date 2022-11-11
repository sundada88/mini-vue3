import { effect } from "../effect"
import { isReactive, reactive, readonly, shallowReactive } from "../reactive"

describe('test reactive', () => {
    it('origianl is not equal proxy', () => {
        // const original = { foo: 1 }
        // const observed = reactive(original)
        // expect(observed).not.toBe(original)
        // expect(isReactive(observed)).toBe(true)
        // expect(isReactive(original)).toBe(false)
        // // get
        // expect(observed.foo).toBe(1)
        // // has
        // expect('foo' in observed).toBe(true)
        // // ownKeys
        // expect(Object.keys(observed)).toEqual(['foo'])
        const data = {foo: 1}
        const obj = reactive(data)
        expect(data).not.toBe(obj)
        expect(obj.foo).toBe(1)
        const fn = jest.fn(() => obj.foo)
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        obj.foo = 1
        expect(fn).toHaveBeenCalledTimes(1)
    })
    it('should use Reflect', () => {
        const obj = {
            foo: 1,
            get bar() {
                return this.foo
            }
        }
        const p = reactive(obj)
        const fn = jest.fn()
        effect(() => {
            console.log(p.bar)
            fn()
        })
        expect(fn).toHaveBeenCalled()
        p.foo ++
        expect(fn).toHaveBeenCalledTimes(2)
    })
    it('should proxy in operation', () => {
        const obj = {
            foo: 1
        }
        const p = reactive(obj)
        const fn = jest.fn(() => {
            'foo' in p
        })
        effect(fn)
        expect(fn).toHaveBeenCalled()
        p.foo = 2
        expect(fn).toHaveBeenCalledTimes(2)
    })
    it('新添加属性会触发 for ... in', () => {
        const obj = reactive({
            foo: 1,
        })
        const fn = jest.fn(() => {
            for (const key in obj) {
                console.log(key)
            }
        })
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        obj.bar = 2
        expect(fn).toHaveBeenCalledTimes(2)
    })
    it('如果我是修改已有属性, for ... in 副作用函数不应该执行', () => {
        const obj = reactive({foo: 1})
        const fn = jest.fn(() => {
            for (const key in obj) {
                console.log(key)
            }
        })
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        obj.foo = 2
        expect(fn).toHaveBeenCalledTimes(1)
    })
    it('删除属性操作', () => {
        const obj = reactive({foo: 1})
        const fn = jest.fn(() => {
            for (const key in obj) {
                console.log(key)
            }
        })
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        delete obj.foo
        expect(fn).toHaveBeenCalledTimes(2)
    })
    it('原型继承相关问题', () => {
        const obj = {}
        const proto = {bar: 1}
        const child = reactive(obj)
        const parent = reactive(proto)
        Object.setPrototypeOf(child, parent)
        const fn = jest.fn(() => child.bar)
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        child.bar = 2
        expect(fn).toHaveBeenCalledTimes(2)
        /*
            当读取 child.bar 的时候, 会去触发 child 的 get 方法，因为 child 是响应式数据，所以和副作用函数建立联系
            因为 child 上没有 bar 属性，所以回去原型上找，因此会去触发 parent 上的 get 方法，因为 parent 也是响应式的，所以也会和副作用函数建立联系
            
            当设置 child.bar = 2的时候, 会去触发 child 的 set 方法，所以会执行副作用函数, 但是 child 是那个没有 bar 属性， 所以需要去原型上找，因此
            也会触发 parent 上的 set 方法，所以也会执行副作用函数，但是这一步是多余的

            为了解决上述问题，我们可以将 parent.bar 这次触发的副作用函数给屏蔽了。因为这两次都是在 set 的时候给触发的，那么在  set 拦截函数内区分这两次更新就行了

            当我们设置 child.bar 的值的时候，会执行 child 代理对象的 set 拦截函数：

            // child 的 set 拦截函数
            set(target, key, value, receiver) {
                // target => 原始对象obj
                // receiver => 代理对象 child
            }

            由于 obj 上不存在 bar 属性，所以会取到 obj 的原型 parent，并执行 parent 代理对象的 set 拦截函数
            // parent 的 set 拦截函数
            set(target, key, value, receiver) {
                // target => 原始对象 proto
                // receiver => 代理对象 child , 此时的 receiver 是代理对象 child，不再是 target 的代理对象
                // *** 由于我们最初设置的额是 child.bar 的值，所以无论什么情况下， receiver 都是 child，而 target 是变化的
                // 所以我们只要区分 receiver 是不是 target 的代理对象即可.
            }



        */ 
    })
    it('nested object should be reactive', () => {
        const obj = reactive({
            foo: {
                bar: 1
            }
        })
        const fn = jest.fn(() => obj.foo.bar)
        effect(fn)
        expect(fn).toHaveBeenCalledTimes(1)
        obj.foo.bar = 2
        expect(fn).toHaveBeenCalledTimes(2)
    })
    it('proxy array', () => {
        // 通过下标设置和更新value的时候
        const arr = reactive(['foo'])
        const fn = jest.fn(() => arr[0])
        effect(fn)
        arr[0] = 'bar'
        expect(fn).toHaveBeenCalled()
    })
    it.skip('arry length', () => {
        const arr = reactive(['foo'])
        const fn = jest.fn(() => arr.length)
        effect(fn)
        arr[1] = 'bar'
        expect(fn).toHaveBeenCalledTimes(2)
    })
    it.skip('修改数组length属性，也会影响数组元素', () => {
        const arr = reactive(['foo'])
        const fn = jest.fn(() => arr[0])
        effect(fn)
        arr.length = 100
        expect(fn).toHaveBeenCalledTimes(1)
        arr.length = 0
        expect(fn).toHaveBeenCalledTimes(2)
    })
    it.skip('使用for...in遍历数组', () => {
        // 影响数组遍历的几种
        //    1. 添加新元素: arr[100] = 'bar'
        //    2. 修改数组长度: arr.length = 0
        const arr = reactive(['foo'])
        const fn = jest.fn(() => {
            for (const key in arr) {
                console.log(key)
            }
        })
        effect(fn)
        arr[1] = 'bar'
        expect(fn).toHaveBeenCalledTimes(2)
        arr.length = 0
        expect(fn).toHaveBeenCalledTimes(3)
    })
    it.skip('使用for...of遍历数组', () => {
        const arr = reactive(['foo'])
        const fn = jest.fn(() => {
            for (const value of arr) {
                console.log(value)
            }
        })
        effect(fn)
        arr[1] = 'bar'
        expect(fn).toHaveBeenCalledTimes(2)
        arr.length = 0
        expect(fn).toHaveBeenCalledTimes(3)
    })
    describe.skip('数组的方法', () => {
        describe('includes', () => {
            it('includes', () => {
                const arr = reactive(['foo', 'bar'])
                const fn = jest.fn(() => {
                    console.log(arr.includes('foo'))
                })
                effect(fn)
                expect(fn).toHaveBeenCalledTimes(1)
                arr[0] = 'baz'
                expect(fn).toHaveBeenCalledTimes(2)
            })
            it('查看对象', () => {
                const obj = {}
                const arr = reactive([obj])
                expect(arr.includes(arr[0])).toBe(true)
                expect(arr.includes(obj)).toBe(true)
            })
        })
        describe('隐式修改数组的长度', () => {
            it('push', () => {
                const arr = reactive([])
                effect(() => {
                    arr.push(1)
                })
                effect(() => {
                    arr.push(1)
                })
            })
        })
    })
    // describe('proxy set and map', () => {
    //     test('代理set', () => {
    //         const p = reactive(new Set([1, 2, 3]))
    //         const fn = jest.fn(() => p.size)
    //         effect(fn)
    //         expect(fn).toHaveBeenCalledTimes(1)
    //         p.add(1)
    //         expect(fn).toHaveBeenCalledTimes(2)
    //     })
    // })
})