import { h, createTextVNode } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'
window.self = null
export const App = {
  render () {
    const app = h('div', {}, 'App')
    /* 
      <Foo>
        <p>123</p>
      </Foo> 
    */
    // const foo = h(Foo, {}, [h('p', {}, '123'), h('p', {}, '456')])
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => [
          h('p', {}, 'header' + age),
          createTextVNode('aaaaaaaaaaaaa')
        ],
        footer: () => h('p', {}, 'footer')
      }
    )
    return h('div', {}, [app, foo])
  },
  setup () {
    return {
      msg: 'mini-vue'
    }
  }
}
