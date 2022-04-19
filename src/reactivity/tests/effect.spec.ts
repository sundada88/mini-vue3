import { reactive } from "../reactive"
import { effect, stop } from "../effect"

describe('effect', () => {
  it('happy path', () => {
    const obj = reactive({ foo: 1 })
    let foo
    effect(() => {
      foo = obj.foo
    })
    expect(foo).toBe(1)
    obj.foo++
    expect(foo).toBe(2)
  })
  it('should return runner when call effect', () => {
    // calling effect will return runner, then call runner will return fn return value
    let foo = 10
    const runner = effect(() => {
      foo++
      return 'foo'
    })
    expect(foo).toBe(11)
    const r = runner()
    expect(foo).toBe(12)
    expect(r).toBe('foo')
  })

  it('scheduler', () => {
    /*

    function scheduler () {
      console.log('scheduler')
    }
    const obj = reactive({foo: 1})
    const runner = effect(function fn(){
      obj.foo ++
    }, {scheduler})
    1. in init, fn will run, but scheduler will not run
    2. when obj.foo has been set a new value => obj.foo++ 
    3. scheduler will be called, fn doesn't run, so obj.foo === 1
    4. when running runner, fn will run, scheduler willn't run 
    */
    let dummy
    let run: any
    const scheduler = jest.fn(() => {
      run = runner
    })
    const obj = reactive({ foo: 1 })
    const runner = effect(() => {
      dummy = obj.foo
    }, { scheduler })
    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    // should be called on first trigger
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
    // should not run yet
    expect(dummy).toBe(1)
    // run
    run()
    expect(dummy).toBe(2)
    expect(scheduler).toHaveBeenCalledTimes(1)
  })
  it('stop', () => {
    let dummy
    const obj = reactive({ foo: 1 })
    const runner = effect(() => {
      dummy = obj.foo
    })
    obj.foo = 2
    expect(dummy).toBe(2)
    // when run stop, fn can't run
    stop(runner)
    // obj.foo = obj.foo + 1 => get => track dep => set => trigger dep
    obj.foo++
    expect(dummy).toBe(2)
    runner()
    expect(dummy).toBe(3)
  })
  it('onstop', () => {
    let dummy
    const onStop = jest.fn()
    const obj = reactive({ foo: 1 })
    const runner = effect(() => {
      dummy = obj.foo
    }, { onStop })
    expect(dummy).toBe(1)
    stop(runner)
    expect(onStop).toBeCalledTimes(1)
  })
})