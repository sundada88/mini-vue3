import { ShapeFlags } from '../shared/ShapeFlags'
export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')

export { createVNode as createElementVNode }

export function createVNode (type, props?, children?) {
  const vnode = {
    type,
    props,
    component: null,
    children,
    next: null,
    key: props && props.key,
    shapeFlag: getShapeFlag(type),
    el: null
  }
  if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  // 组件类型 + children object => 存在slots
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN
    }
  }
  return vnode
}

export function createTextVNode (text) {
  return createVNode(Text, {}, text)
}

function getShapeFlag (type: any) {
  return typeof type === 'string'
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT
}
