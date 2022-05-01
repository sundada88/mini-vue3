import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { Fragment, Text } from './vnode'

export function render (vnode, rootContainer) {
  // patch => 为了方便递归的处理
  patch(vnode, rootContainer)
}

function patch (vnode: any, rootContainer: any) {
  // 如果vnode是element类型 => 处理 element
  // 如何区分component还是element类型
  // 通过 vnode.type 来判断是component还是element

  const { shapeFlag, type } = vnode
  // Fragment => 只渲染children
  switch (type) {
    case Fragment:
      processFragment(vnode, rootContainer)
      break

    case Text:
      processText(vnode, rootContainer)
      break
    default:
      // Element类型
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, rootContainer)
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 根据类型去处理组件或者元素
        // Component 类型
        processComponent(vnode, rootContainer)
      }
      break
  }
}

function processText (vnode: any, rootContainer: any) {
  const { children } = vnode
  const textNode = (vnode.el = document.createTextNode(children))
  rootContainer.append(textNode)
}

function processFragment (vnode: any, rootContainer: any) {
  // 渲染children
  mountChildren(vnode, rootContainer)
}

function processElement (vnode, container) {
  // 分为 init 和 update
  // init
  mountElement(vnode, container)
}

function mountElement (vnode: any, container: any) {
  // 创建真实的element，然后挂载到container上面
  const { shapeFlag } = vnode
  const el = (vnode.el = document.createElement(vnode.type))
  // 存在单个子元素
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.innerText = vnode.children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    // 存在多个子元素
    mountChildren(vnode, el)
  }
  const { props } = vnode
  for (const key in props) {
    const val = props[key]
    // 具体的 click => 通用
    const isOn = (key: string) => /^on[A-Z]/.test(key)
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase()
      el.addEventListener(event, val)
    } else {
      el.setAttribute(key, val)
    }
  }
  // el.setAttribute('id', 'nicai')
  container.appendChild(el)
}
function mountChildren (vnode, container) {
  vnode.children.forEach(v => {
    patch(v, container)
  })
}

function processComponent (vnode: any, rootContainer: any) {
  mountComponent(vnode, rootContainer)
}

function mountComponent (initialVNode: any, container: any) {
  // 创建组件实例
  const instance = createComponentInstance(initialVNode)
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
  patch(subTree, container)
  initialVNode.el = subTree.el
}
