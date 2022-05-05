import { h, ref } from '../../lib/guide-mini-vue.esm.js'

// 老的是Array，新的是Array

// 1.左侧的对比
// (a b) c
// (a b) d e

// const prevChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'C' }, 'c')
// ]

// const nextChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'D' }, 'd'),
//   h('div', { key: 'E' }, 'e')
// ]

// 2.右侧的对比
// a (b c)
// d e (b c)

// const prevChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'C' }, 'c')
// ]

// const nextChildren = [
//   h('div', { key: 'D' }, 'd'),
//   h('div', { key: 'E' }, 'e'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'C' }, 'c')
// ]

// 3. 新的比老的长
// 左侧对比
//  (a b )
//  (a b ) c

// const prevChildren = [h('div', { key: 'A' }, 'a'), h('div', { key: 'B' }, 'b')]

// const nextChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'C' }, 'c')
// ]

// 右侧对比
//  (a b )
//  c (a b )

const prevChildren = [h('div', { key: 'A' }, 'a'), h('div', { key: 'B' }, 'b')]

const nextChildren = [
  h('div', { key: 'C' }, 'c'),
  h('div', { key: 'A' }, 'a'),
  h('div', { key: 'B' }, 'b')
]

// 4. 老的比新的长
// 删除老的

// 左侧对比
//  (a b ) c
//  (a b )

// const prevChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'C' }, 'c')
// ]

// const nextChildren = [h('div', { key: 'A' }, 'a'), h('div', { key: 'B' }, 'b')]

// 右侧对比
//  c (a b )
//  (a b )

// const prevChildren = [
//   h('div', { key: 'C' }, 'c'),
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b')
// ]

// const nextChildren = [h('div', { key: 'A' }, 'a'), h('div', { key: 'B' }, 'b')]

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
