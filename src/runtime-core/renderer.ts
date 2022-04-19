import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, rootContainer) {
  // patch => 为了方便递归的处理
  patch(vnode, rootContainer)

}

function patch(vnode: any, rootContainer: any) {

  // 如果vnode是element类型 => 处理 element
  // 如何区分component还是element类型
  processElement()

  // 根据类型去处理组件或者元素
  processComponent(vnode, rootContainer)

}


function processElement() {
  throw new Error("Function not implemented.")
}

function processComponent(vnode: any, rootContainer: any) {
  mountComponent(vnode, rootContainer)
}

function mountComponent(vnode: any, container: any) {
  // 创建组件实例
  const instance = createComponentInstance(vnode)
  setupComponent(instance)
  // 拆箱过程
  setupRenderEffect(instance, container)
}

function setupRenderEffect(instance, container) {
  const subTree = instance.render()
  // subTree 是 vnode

  // vnode => patch
  // vnode => element => mountElement
  patch(subTree, container)
}


