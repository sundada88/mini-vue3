import { createVNodeCall, NodeTypes } from '../ast'

export function transformElement (node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      // 中间层处理

      // tag
      const vnodeTag = `'${node.tag}'`
      // props
      let vnodeProps
      // children
      const { children } = node
      let vnodeChildren = children[0]
      // const vnodeElement = {
      //   type: NodeTypes.ELEMENT,
      //   tag: vnodeTag,
      //   props: vnodeProps,
      //   children: vnodeChildren
      // }
      // node.codegenNode = vnodeElement
      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      )
    }
  }
}
