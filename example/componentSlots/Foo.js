import { h, renderSlots } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  name: 'Foo',
  setup () {},
  render () {
    const foo = h('p', {}, 'foo')
    // 具名插槽
    // 1.获取到要渲染的元素
    // 2. 获取到渲染的位置
    // return h('div', {}, [
    //   renderSlots(this.$slots, 'header'),
    //   foo,
    //   renderSlots(this.$slots, 'footer')
    // ])
    // 作用域插槽
    const age = 18
    return h('div', {}, [
      renderSlots(this.$slots, 'header', { age }),
      foo,
      renderSlots(this.$slots, 'footer')
    ])
  }
}
