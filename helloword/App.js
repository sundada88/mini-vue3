import { h } from '../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'
window.self = null
export const App = {
  // .vue
  // <template></template>
  render () {
    window.self = this
    // return h("div", { id: "root", class: ["red", "head"] }, [
    //   h("p", { class: "red" }, "hi"),
    //   h("p", { class: "blue" }, "mini-vue"),
    // ]);
    // add event
    // return h(
    //   'div',
    //   {
    //     id: 'root',
    //     class: 'red'
    //     onClick () {
    //       console.log(123)
    //     },
    //     onMouseup () {
    //       console.log(11111111111)
    //     }
    //   },
    //   [h('div', {}, 'hi' + this.msg), h(Foo, { count: 1 })]
    // )
    return h('div', {}, [
      h('div', {}, 'App'),
      h(Foo, {
        // on + event name
        onAdd (a, b, c) {
          console.log('onAdd----->', a, b, c)
        },
        onAddTo (a, b, c) {
          console.log('add-to----->', c, b, a)
        }
      })
    ])
  },
  setup () {
    return {
      msg: 'mini-vue'
    }
  }
}
