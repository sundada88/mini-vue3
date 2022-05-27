import { shallowReadonly } from '../reactivity/reactive'
import { proxyRefs } from '../reactivity/ref'
import { emit } from './componentEmit'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentsSlots'

export function createComponentInstance (vnode, parent) {
  //  vnode => {
  //   type,
  //   props,
  //   children,
  //   shapeFlag: getShapeFlag(type),
  //   el: null
  // }
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    update: null,
    inMounted: false,
    subTree: {},
    emit: ''
  }
  component.emit = emit.bind(null, component) as any
  return component
}

export function setupComponent (instance) {
  // TODO
  // initProps
  initProps(instance, instance.vnode.props)
  // initSlots
  initSlots(instance, instance.vnode.children)

  // 处理 setup
  setupStatefulComponent(instance)
}

function setupStatefulComponent (instance) {
  const Component = instance.type

  const { setup } = Component
  if (setup) {
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })

    //
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
    // setupResult 可以是 function 或者 object
    //
    setCurrentInstance(null)
    // instance
    handleSetupResult(instance, setupResult)
  }
}
function handleSetupResult (instance, setupResult: any) {
  // TODO function
  if (typeof setupResult === 'object') {
    instance.setupState = proxyRefs(setupResult)
  }
  // 保证组件的 render 一定有值
  finishComponentSetup(instance)
}

function finishComponentSetup (instance: any) {
  const Component = instance.type
  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template)
    }
  }
  // 保证一定要有 render 函数
  instance.render = Component.render
}

let currentInstance = null

export function getCurrentInstance () {
  return currentInstance
}

function setCurrentInstance (instance) {
  currentInstance = instance
}

let compiler

export function registerRuntimeCompiler (_compiler) {
  compiler = _compiler
}
