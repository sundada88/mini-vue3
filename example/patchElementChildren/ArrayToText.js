import { h, ref } from '../../lib/guide-mini-vue.esm.js'

// 老的是数组，新的是文本

const nextChildren = 'newChildren'
const prevChildren = [h('div', {}, 'A'), h('div', {}, 'B')]

export default {
  name: 'ArrayToText',
  setup () {
    const isChange = ref(false)
    window.isChange = isChange
    return {
      isChange
    }
  },
  render () {
    const self = this
    return this.isChange
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren)
  }
}
