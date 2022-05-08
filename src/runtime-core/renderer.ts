import { effect } from '../reactivity/effect'
import { EMPTY_OBJ } from '../shared'
import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { shouldUpdateComponent } from './componentUpdateUtils'
import { createAppApi } from './createApp'
import { Fragment, Text } from './vnode'
export function createRenderer (options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options

  function render (vnode, rootContainer) {
    // patch => 为了方便递归的处理
    rootContainer = document.querySelector(rootContainer)
    patch(null, vnode, rootContainer, null, null)
  }

  function patch (n1, n2: any, rootContainer: any, parentComponent, anchor) {
    // 如果vnode是element类型 => 处理 element
    // 如何区分component还是element类型
    // 通过 vnode.type 来判断是component还是element

    const { shapeFlag, type } = n2
    // Fragment => 只渲染children
    switch (type) {
      case Fragment:
        processFragment(n1, n2, rootContainer, parentComponent, anchor)
        break

      case Text:
        processText(n1, n2, rootContainer)
        break
      default:
        // Element类型
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, rootContainer, parentComponent, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 根据类型去处理组件或者元素
          // Component 类型
          processComponent(n1, n2, rootContainer, parentComponent, anchor)
        }
        break
    }
  }

  function processText (n1, n2: any, rootContainer: any) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    rootContainer.append(textNode)
  }

  function processFragment (
    n1,
    n2: any,
    rootContainer: any,
    parentComponent,
    anchor
  ) {
    // 渲染children
    mountChildren(n2.children, rootContainer, parentComponent, anchor)
  }

  function processElement (n1, n2, container, parentComponent, anchor) {
    // 分为 init 和 update
    if (!n1) {
      // init
      mountElement(n2, container, parentComponent, anchor)
    } else {
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }
  function patchElement (n1, n2, container, parentComponent, anchor) {
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
    patchChildren(n1, n2, el, parentComponent, anchor)
    patchProps(el, oldProps, newProps)
    // update children
  }

  function patchChildren (n1, n2, container, parentComponent, anchor) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1
    const { shapeFlag, children: c2 } = n2

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 老的是Array，新的是Text
        //1. 把老子的 children 清空
        unmountChildren(c1)
        //2. 设置 text
        // hostSetElementText(container, c2)
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 老的是Text 新的是Array
        hostSetElementText(container, '')
        // 将新的渲染出来
        mountChildren(c2, container, parentComponent, anchor)
      } else {
        // 老的是Array 新的也是 Array
        patchKeyedChildren(c1, c2, container, parentComponent, anchor)
      }
    }
  }

  function isSameVNodeType (n1, n2) {
    return n1.key === n2.key && n1.type === n2.type
  }

  function patchKeyedChildren (
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    const l2 = c2.length
    let i = 0,
      e1 = c1.length - 1,
      e2 = l2 - 1
    // 左侧
    while (i <= e1 && i <= e2) {
      // (a, b) c
      // (a, b)
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }
      i++
    }
    // 右侧

    while (i <= e1 && i <= e2) {
      // c (a, b)
      //   (a, b)
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }
      e1--
      e2--
    }
    console.log(e1, e2)
    //3. 新的比老的多 创建 (a, b) => (a, b) c || c (a, b) => (a, b(a, b) => (a, b) c)
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1
        const anchor = nextPos > l2 ? null : c2[nextPos].el
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 左侧比较
      // 老的比新的多 (a, b), c => (a, b)

      // 右侧比较
      // 老的比新的多  c (a, b) => (a, b)
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    } else {
      // 中间对比
      // 乱序比较
      // i -> e1 => 老的
      // i -> e2 => 新的
      let s1 = i
      let s2 = i
      // 有多少需要比对的
      const toBePatched = e2 - s2 + 1
      // 已经比对了多少个
      let patched = 0
      // 建立 c2 的 key 和 index 映射
      const keyToNewIndexMap = new Map()

      // 新的 index 和老的 index 建立一个新的映射关系
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)
      // 标志位用来判断是否需要移动元素
      let moved = false
      let maxNewIndexSoFar = 0

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        keyToNewIndexMap.set(nextChild.key, i)
      }

      // 遍历老的,看看新的中间是否有和老的相同的

      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i]

        if (patched >= toBePatched) {
          hostRemove(prevChild.el)
          continue
        }

        let newIndex

        // 如果有 key ，找到新的子节点中的 index
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // 如果没有key，则找出新的中的和老的相等的那个 index
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j
              break
            }
          }
        }
        // 如果没有在新的找到
        if (newIndex === undefined) {
          hostRemove(prevChild.el)
        } else {
          if (newIndex > maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          // 如有在新的找到，直接 patch
          patch(prevChild, c2[newIndex], container, parentComponent, null)
          patched++
        }
      }
      console.log('newIndexToOldIndexMap', newIndexToOldIndexMap)
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : []
      let j = increasingNewIndexSequence.length - 1
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null

        // 当 newIndexToOldIndexMap 中的为 0 表明在老的里面没有找到
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor)
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor)
          } else {
            j--
          }
        }
      }
    }
  }

  function unmountChildren (children) {
    children.forEach(child => {
      hostRemove(child.el)
    })
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

  function mountElement (vnode: any, container: any, parentComponent, anchor) {
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
      mountChildren(vnode.children, el, parentComponent, anchor)
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
    hostInsert(el, container, anchor)
  }
  function mountChildren (children, container, parentComponent, anchor) {
    children.forEach(v => {
      patch(null, v, container, parentComponent, anchor)
    })
  }

  function processComponent (
    n1,
    n2: any,
    rootContainer: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      mountComponent(n2, rootContainer, parentComponent, anchor)
    } else {
      debugger
      updateComponent(n1, n2)
    }
  }

  function updateComponent (n1, n2) {
    // 调用更新组建的 render 函数，生成新的 VNode, 然后再进行 patch
    // 其实就是调用  setupRenderEffect
    // 我们可以将 setupRenderEffect 放在 component 实例的属性上

    // 如果组件需要更新在执行更新过程

    const instance = (n2.component = n1.component)
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2
      instance.update()
    } else {
      n2.el = n1.el
      instance.vnode = n2
    }
  }

  function mountComponent (
    initialVNode: any,
    container: any,
    parentComponent,
    anchor
  ) {
    // 创建组件实例
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ))
    setupComponent(instance)
    // 拆箱过程
    setupRenderEffect(instance, initialVNode, container, anchor)
  }

  function setupRenderEffect (instance, initialVNode, container, anchor) {
    instance.update = effect(() => {
      //需要区分是不是第一次 init 还是后续更新 update
      if (!instance.isMounted) {
        // 因为把props属性，$slots属性，$el都挂载到了instance.proxy上面
        const subTree = (instance.subTree = instance.render.call(
          instance.proxy
        ))
        // subTree 是 vnode

        // vnode => patch
        // vnode => element => mountElement
        patch(null, subTree, container, instance, anchor)
        initialVNode.el = subTree.el
        instance.isMounted = true
      } else {
        const { next, vnode } = instance
        if (next) {
          next.el = vnode.el
          // 更新组建的 props 属性
          updateComponentPreRender(instance, next)
        }
        const prevVNode = instance.subTree
        const subTree = (instance.subTree = instance.render.call(
          instance.proxy
        ))
        // console.log('update ---> ', prevVNode, subTree)
        patch(prevVNode, subTree, container, instance, anchor)
      }
    })
  }
  return {
    createApp: createAppApi(render)
  }
}

function updateComponentPreRender (instance, nextVNode) {
  // 更新组建实例的 vnode
  instance.vnode = nextVNode
  instance.next = null

  // 更新组建的 props
  instance.props = nextVNode.props
}

function getSequence (arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
