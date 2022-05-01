import { h, provide, inject } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

const provider = {
  name: 'provide',
  setup () {
    provide('foo', 'fooVal')
    provide('bar', 'barVal')
  },
  render () {
    return h('div', {}, [h('p', {}, `provide `), h(provideTwo)])
  }
}

const provideTwo = {
  name: 'provideTwo',
  setup () {
    provide('foo', 'fooTwo')
    const foo = inject('foo')
    return {
      foo
    }
  },
  render () {
    return h('div', {}, [h('p', {}, `provideTwo: ${this.foo}`), h(Consumer)])
  }
}

const Consumer = {
  name: 'Consumer',
  setup () {
    const foo = inject('foo')
    const bar = inject('bar')
    // 默认值
    // const baz = inject('baz', 'bazValue')
    // 默认值有可能是个函数
    const baz = inject('baz', () => 'bazValue')
    return {
      foo,
      bar,
      baz
    }
  },
  render () {
    return h('div', {}, `Consumer: - ${this.foo} - ${this.bar} - ${this.baz}`)
  }
}

export const App = {
  name: 'App',
  render () {
    const app = h('div', {}, 'App')
    const foo = h(provider)
    return h('div', {}, [app, foo])
  },
  setup () {
    return {
      msg: 'mini-vue'
    }
  }
}
