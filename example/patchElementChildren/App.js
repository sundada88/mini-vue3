import { h } from '../../lib/guide-mini-vue.esm.js'
import ArrayToText from './ArrayToText.js'
import TextToText from './TextToText.js'
import TextToArray from './TextToArray.js'
import ArrayToArray from './ArrayToArray.js'

export const App = {
  name: 'App',
  setup () {},
  render () {
    return h('div', { tTd: 1 }, [
      h('p', {}, '主页'),
      h('p', {}, 'content'),
      // 老的是 array, 新的是 text
      // h(ArrayToText)
      // 老的是 text，新的是 text
      // h(TextToText)
      // 老的是 text，新的是 Array
      // h(TextToArray)

      // 老的是 Array，新的是 Array
      h(ArrayToArray)
    ])
  }
}
