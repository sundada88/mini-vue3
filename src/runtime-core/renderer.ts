import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { createAppApi } from './createApp'
import { Fragment, Text } from './vnode'
export function createRenderer (options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert
  } = options

  function render (vnode, rootContainer) {
    // patch => 为了方便递归的处理
    patch(vnode, rootContainer, null)
  }

  function patch (vnode: any, rootContainer: any, parentComponent) {
    // 如果vnode是element类型 => 处理 element
    // 如何区分component还是element类型
    // 通过 vnode.type 来判断是component还是element

    const { shapeFlag, type } = vnode
    // Fragment => 只渲染children
    switch (type) {
      case Fragment:
        processFragment(vnode, rootContainer, parentComponent)
        break

      case Text:
        processText(vnode, rootContainer)
        break
      default:
        // Element类型
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, rootContainer, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 根据类型去处理组件或者元素
          // Component 类型
          processComponent(vnode, rootContainer, parentComponent)
        }
        break
    }
  }

  function processText (vnode: any, rootContainer: any) {
    const { children } = vnode
    const textNode = (vnode.el = document.createTextNode(children))
    rootContainer.append(textNode)
  }

  function processFragment (vnode: any, rootContainer: any, parentComponent) {
    // 渲染children
    mountChildren(vnode, rootContainer, parentComponent)
  }

  function processElement (vnode, container, parentComponent) {
    // 分为 init 和 update
    // init
    mountElement(vnode, container, parentComponent)
  }

  function mountElement (vnode: any, container: any, parentComponent) {
    // 创建真实的element，然后挂载到container上面
    const { shapeFlag } = vnode
    // const el = (vnode.el = document.createElement(vnode.type))
    // custom render
    const el = (vnode.el = hostCreateElement(vnode.type))
    // 存在单个子元素
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.innerText = vnode.children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 存在多个子元素
      mountChildren(vnode, el, parentComponent)
    }
    const { props } = vnode
    for (const key in props) {
      const val = props[key]
      // // 具体的 click => 通用
      // const isOn = (key: string) => /^on[A-Z]/.test(key)
      // if (isOn(key)) {
      //   const event = key.slice(2).toLowerCase()
      //   el.addEventListener(event, val)
      // } else {
      //   el.setAttribute(key, val)
      // }
      hostPatchProp(el, key, val)
    }
    // container.appendChild(el)
    hostInsert(el, container)
  }
  function mountChildren (vnode, container, parentComponent) {
    vnode.children.forEach(v => {
      patch(v, container, parentComponent)
    })
  }

  function processComponent (vnode: any, rootContainer: any, parentComponent) {
    mountComponent(vnode, rootContainer, parentComponent)
  }

  function mountComponent (initialVNode: any, container: any, parentComponent) {
    // 创建组件实例
    const instance = createComponentInstance(initialVNode, parentComponent)
    setupComponent(instance)
    // 拆箱过程
    setupRenderEffect(instance, initialVNode, container)
  }

  function setupRenderEffect (instance, initialVNode, container) {
    // 因为把props属性，$slots属性，$el都挂载到了instance.proxy上面
    const subTree = instance.render.call(instance.proxy)
    // subTree 是 vnode

    // vnode => patch
    // vnode => element => mountElement
    patch(subTree, container, instance)
    initialVNode.el = subTree.el
  }
  return {
    createApp: createAppApi(render)
  }
}
