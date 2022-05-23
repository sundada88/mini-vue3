import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

export function transform (root, options = {}) {
  const context = createTransformContext(root, options)

  // 1. 遍历 - 深度优先遍历
  traverseNode(root, context)
  // 2. 修改 text content

  // 3. 为 root 添加属性 codegenRoot ,方便后续 codegen 做操作
  createRootCodegen(root)
  root.helpers = [...context.helpers.keys()]
}

function createRootCodegen (root) {
  root.codegenNode = root.children[0]
}

function createTransformContext (root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper (key) {
      context.helpers.set(key, 1)
    }
  }
  return context
}

function traverseNode (node: any, context) {
  // 直接写死不够灵活 => 采用插件体系
  // if (node.type === NodeTypes.TEXT) {
  //   node.content += ' mini-vue'
  // }
  const nodeTransform = context.nodeTransforms

  for (let i = 0; i < nodeTransform.length; i++) {
    const transform = nodeTransform[i]
    transform(node)
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      // 在根节点上添加 helper
      context.helper(TO_DISPLAY_STRING)
      break

    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      // handle element ...
      transformChildren(node, context)
      break

    default:
      break
  }
}
function transformChildren (node: any, context: any) {
  const children = node.children
  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    traverseNode(node, context)
  }
}
