import { getCurrentInstance } from './component'

export function provide (key, val) {
  // 存
  const currentInstance: any = getCurrentInstance()
  if (currentInstance) {
    let { provides } = currentInstance
    // 将当前实例的 provides 的原型指向 父级组件实例
    const parentProvides = currentInstance.parent.provides
    // init
    // 通过 provides 是否等于父实例的 provides 来判断是第一次初始化 (会在 createComponentInstance 中)
    if (provides === parentProvides) {
      // 初始化的状态
      provides = currentInstance.provides = Object.create(parentProvides)
    }

    provides[key] = val
  }
}

export function inject (key, defaultVal) {
  // 取
  const currentInstance: any = getCurrentInstance()
  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides
    if (key in parentProvides) {
      return parentProvides[key]
    } else if (defaultVal) {
      // inject('bar', () => 'barValue')
      if (typeof defaultVal === 'function') {
        return defaultVal()
      }
      // inject('bar', 'barValue')
      return defaultVal
    }
  }
}
