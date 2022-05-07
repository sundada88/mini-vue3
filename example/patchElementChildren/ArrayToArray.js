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

// const prevChildren = [h('div', { key: 'A' }, 'a'), h('div', { key: 'B' }, 'b')]

// const nextChildren = [
//   h('div', { key: 'D' }, 'd'),
//   h('div', { key: 'C' }, 'c'),
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b')
// ]

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

// 5. 乱序
// a, b,(c, d), f, g
// a, b,(e, c), f, g

// const prevChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'C', id: 'prev-c' }, 'c'),
//   h('div', { key: 'D' }, 'd'),
//   h('div', { key: 'F' }, 'f'),
//   h('div', { key: 'G' }, 'g')
// ]

// const nextChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'E' }, 'e'),
//   h('div', { key: 'C', id: 'next-c' }, 'c'),
//   h('div', { key: 'F' }, 'f'),
//   h('div', { key: 'G' }, 'g')
// ]

// 5.1.1
// a, b, (c, e, d), f, g
// a, b, (e, c), f, g
// 中间部分。老的比新的多，那么多出来的可以直接干掉(优化删除逻辑)

// const prevChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'C', id: 'prev-c' }, 'c'),
//   h('div', { key: 'E' }, 'e'),
//   h('div', { key: 'D' }, 'd'),
//   h('div', { key: 'F' }, 'f'),
//   h('div', { key: 'G' }, 'g')
// ]

// const nextChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'E' }, 'e'),
//   h('div', { key: 'C', id: 'next-c' }, 'c'),
//   h('div', { key: 'F' }, 'f'),
//   h('div', { key: 'G' }, 'g')
// ]

// 2. 移动节点
// const prevChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'C' }, 'c'),
//   h('div', { key: 'D' }, 'd'),
//   h('div', { key: 'E' }, 'e'),
//   h('div', { key: 'F' }, 'f')
// ]

// const nextChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'E' }, 'e'),
//   h('div', { key: 'C' }, 'c'),
//   h('div', { key: 'D' }, 'd'),
//   h('div', { key: 'F' }, 'f')
// ]

//3. 创建节点
// const prevChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'C' }, 'c'),
//   h('div', { key: 'E' }, 'e'),
//   h('div', { key: 'F' }, 'f'),
//   h('div', { key: 'G' }, 'g')
// ]

// const nextChildren = [
//   h('div', { key: 'A' }, 'a'),
//   h('div', { key: 'B' }, 'b'),
//   h('div', { key: 'E' }, 'e'),
//   h('div', { key: 'C' }, 'c'),
//   h('div', { key: 'D' }, 'd'),
//   h('div', { key: 'F' }, 'f'),
//   h('div', { key: 'G' }, 'g')
// ]

// 综合栗子
// a, b, (c, d, e, z), f, g
// a, b, (d, c, y, e), f, g

const prevChildren = [
  h('div', { key: 'A' }, 'a'),
  h('div', { key: 'B' }, 'b'),
  h('div', { key: 'C' }, 'c'),
  h('div', { key: 'D' }, 'd'),
  h('div', { key: 'E' }, 'e'),
  h('div', { key: 'Z' }, 'z'),
  h('div', { key: 'F' }, 'f'),
  h('div', { key: 'G' }, 'g')
]

const nextChildren = [
  h('div', { key: 'A' }, 'a'),
  h('div', { key: 'B' }, 'b'),
  h('div', { key: 'D' }, 'd'),
  h('div', { key: 'C' }, 'c'),
  h('div', { key: 'Y' }, 'y'),
  h('div', { key: 'E' }, 'e'),
  h('div', { key: 'F' }, 'f'),
  h('div', { key: 'G' }, 'g')
]

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
