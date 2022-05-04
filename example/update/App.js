import { h, ref } from '../../lib/guide-mini-vue.esm.js'

export const App = {
  name: 'App',
  setup () {
    const count = ref(0)

    const onClick = () => {
      count.value++
    }
    const props = ref({
      foo: 'foo',
      bar: 'bar'
    })
    const changeDemo1 = () => {
      props.value.foo = 'new-foo'
    }

    const changeDemo2 = () => {
      props.value.foo = undefined
    }

    const changeDemo3 = () => {
      props.value = {
        foo: 'foo'
      }
    }

    return {
      props,
      count,
      onClick,
      changeDemo1,
      changeDemo2,
      changeDemo3
    }
  },
  render () {
    return h('div', { ...this.props }, [
      h('div', {}, `count: ${this.count}`),
      h('button', { onClick: this.onClick }, 'click'),
      h('button', { onClick: this.changeDemo1 }, 'changeDemo1 foo => new-foo'),
      h(
        'button',
        { onClick: this.changeDemo2 },
        'changeDemo2 foo => undefined'
      ),
      h('button', { onClick: this.changeDemo3 }, 'changeDemo3 delete bar')
    ])
  }
}
