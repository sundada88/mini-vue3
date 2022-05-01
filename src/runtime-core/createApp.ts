import { createVNode } from './vnode'

export function createAppApi (render) {
  return function createApp (rootComponent) {
    return {
      mount (rootContainer) {
        // 转换为 vnode
        // component => vnode
        // 后续的逻辑操作都是基于 vnode
        const vnode = createVNode(rootComponent)
        // 上面生成vnode之后，下面就要将vnode =>
        render(vnode, rootContainer)
      }
    }
  }
}
