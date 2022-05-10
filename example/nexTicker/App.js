import {
  ref,
  h,
  getCurrentInstance,
  nextTick
} from '../../lib/guide-mini-vue.esm.js'

export const App = {
  name: 'nextTicker',
  setup () {
    const count = ref(1)
    const instance = getCurrentInstance()
    async function onClick () {
      for (let i = 0; i < 100; i++) {
        count.value++
      }
      debugger
      console.log(instance)
      nextTick(() => {
        console.log(instance)
      })
      // await nextTick()
      // console.log(instance)
    }
    return {
      count,
      onClick
    }
  },
  render () {
    return h('div', {}, [
      h('button', { onClick: this.onClick }, `count: ${this.count}`)
    ])
  }
}
