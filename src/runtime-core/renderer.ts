import { effect } from '../reactivity/effect'
import { EMPTY_OBJ } from '../shared'
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
    rootContainer = document.querySelector(rootContainer)
    patch(null, vnode, rootContainer, null)
  }

  function patch (n1, n2: any, rootContainer: any, parentComponent) {
    // 如果vnode是element类型 => 处理 element
    // 如何区分component还是element类型
    // 通过 vnode.type 来判断是component还是element

    const { shapeFlag, type } = n2
    // Fragment => 只渲染children
    switch (type) {
      case Fragment:
        processFragment(n1, n2, rootContainer, parentComponent)
        break

      case Text:
        processText(n1, n2, rootContainer)
        break
      default:
        // Element类型
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, rootContainer, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 根据类型去处理组件或者元素
          // Component 类型
          processComponent(n1, n2, rootContainer, parentComponent)
        }
        break
    }
  }

  function processText (n1, n2: any, rootContainer: any) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    rootContainer.append(textNode)
  }

  function processFragment (n1, n2: any, rootContainer: any, parentComponent) {
    // 渲染children
    mountChildren(n2, rootContainer, parentComponent)
  }

  function processElement (n1, n2, container, parentComponent) {
    // 分为 init 和 update
    if (!n1) {
      // init
      mountElement(n2, container, parentComponent)
    } else {
      patchElement(n1, n2, container)
    }
  }
  function patchElement (n1, n2, container) {
    console.log('update ---->')
    console.log('n1', n1)
    console.log('n2', n2)
    // update element
    // update props
    /*
      {foo: 'foo'} => {foo: 'foo1'} (update)
      {foo: 'foo'} => {foo: null | undefined} || {} (delete)
      {foo: 'foo'} => {foo: 'foo', bar: 'bar'} (add)
    */
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ
    const el = (n2.el = n1.el)
    patchProps(el, oldProps, newProps)
    // update children
  }

  function patchProps (el, oldProps, newProps) {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const prevProp = oldProps[key]
        const nextProp = newProps[key]
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp)
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
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
      hostPatchProp(el, key, null, val)
    }
    // container.appendChild(el)
    hostInsert(el, container)
  }
  function mountChildren (n2, container, parentComponent) {
    n2.children.forEach(v => {
      patch(null, v, container, parentComponent)
    })
  }

  function processComponent (n1, n2: any, rootContainer: any, parentComponent) {
    mountComponent(n2, rootContainer, parentComponent)
  }

  function mountComponent (n2: any, container: any, parentComponent) {
    // 创建组件实例
    const instance = createComponentInstance(n2, parentComponent)
    setupComponent(instance)
    // 拆箱过程
    setupRenderEffect(instance, n2, container)
  }

  function setupRenderEffect (instance, initialVNode, container) {
    effect(() => {
      //需要区分是不是第一次 init 还是后续更新 update
      if (!instance.isMounted) {
        // 因为把props属性，$slots属性，$el都挂载到了instance.proxy上面
        const subTree = (instance.subTree = instance.render.call(
          instance.proxy
        ))
        // subTree 是 vnode

        // vnode => patch
        // vnode => element => mountElement
        patch(null, subTree, container, instance)
        initialVNode.el = subTree.el
        instance.isMounted = true
      } else {
        const prevVNode = instance.subTree
        const subTree = (instance.subTree = instance.render.call(
          instance.proxy
        ))
        // console.log('update ---> ', prevVNode, subTree)
        patch(prevVNode, subTree, container, instance)
      }
    })
  }
  return {
    createApp: createAppApi(render)
  }
}
