import { isObject } from "../shared/index"
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, rootContainer) {
  // patch => 为了方便递归的处理
  patch(vnode, rootContainer)

}

function patch(vnode: any, rootContainer: any) {

  // 如果vnode是element类型 => 处理 element
  // 如何区分component还是element类型
  // 通过 vnode.type 来判断是component还是element

  if (typeof vnode.type === 'string') {
    processElement(vnode, rootContainer)
  } else if (isObject(vnode.type)) {
    // 根据类型去处理组件或者元素
    processComponent(vnode, rootContainer)
  }

}


function processElement(vnode, container) {
  // 分为 init 和 update
  mountElement(vnode, container)
}

function mountElement(vnode: any, container: any) {
  // 创建真实的element，然后挂载到container上面
  const { children } = vnode
  const el = vnode.el = document.createElement(vnode.type)
  if (typeof children === 'string') {
    el.innerText = vnode.children
  } else if (Array.isArray(children)) {
    // vnode
    mountChildren(vnode, el)
  }
  const { props } = vnode
  for (const key in props) {
    const val = props[key]
    el.setAttribute(key, val)
  }
  // el.setAttribute('id', 'nicai')
  container.appendChild(el)
}
function mountChildren(vnode, container) {

  vnode.children.forEach(v => {
    patch(v, container)
  })
}

function processComponent(vnode: any, rootContainer: any) {
  mountComponent(vnode, rootContainer)
}

function mountComponent(vnode: any, container: any) {
  // 创建组件实例
  const instance = createComponentInstance(vnode)
  setupComponent(instance)
  // 拆箱过程
  setupRenderEffect(instance, vnode, container)
}

function setupRenderEffect(instance, vnode, container) {
  const subTree = instance.render.call(instance.proxy)
  // subTree 是 vnode

  // vnode => patch
  // vnode => element => mountElement
  patch(subTree, container)
  vnode.el = subTree.el
}



