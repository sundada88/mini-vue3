import { h } from '../lib/guide-mini-vue.esm.js'

export const Foo = {
  name: 'Foo',
  setup (props, { emit }) {
    const addEmit = () => {
      console.log('addEmit')
      emit('add', 1, 2, 3)
      emit('add-to', 1, 2, 3)
    }
    return {
      addEmit
    }
  },
  render () {
    const btn = h(
      'button',
      {
        onClick: this.addEmit
      },
      'btn'
    )
    const foo = h('p', {}, 'foo')
    return h('div', {}, [btn, foo])
  }
}
