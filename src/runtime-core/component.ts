import { PublicInstanceProxyHandlers } from "./componentPublicInstance"

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type
  }
  return component
}

export function setupComponent(instance) {
  // TODO
  // initProps
  // initSlots

  // 处理 setup
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  const Component = instance.type

  const { setup } = Component
  if (setup) {
    const setupResult = setup()

    // 
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
    // setupResult 可以是 function 或者 object
    // 
    // instance
    handleSetupResult(instance, setupResult)
  }
}
function handleSetupResult(instance, setupResult: any) {
  // TODO function
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }
  // 保证组件的 render 一定有值
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type
  // 保证一定要有 render 函数
  instance.render = Component.render
}

