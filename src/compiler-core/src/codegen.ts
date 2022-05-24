import { NodeTypes } from './ast'
import {
  CREATE_ELEMENT_VNODE,
  helperMapName,
  TO_DISPLAY_STRING
} from './runtimeHelpers'

export function generate (ast) {
  const context = createCodegenContext()
  const { push } = context

  // 都是动态的 => 并且只有在 interpolation 的时候才会有 toDisplayString
  // 此处的 helpers 不应该放在这边 => helpers 应该根据处理的类型不同而进行添加， 比如 interpolation 就需要 toDisplayString 等 helper
  genFunctionPreamble(ast, context)

  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(',')
  push(`function ${functionName}(${signature}) {`)
  push(`return `)
  genNode(ast.codegenNode, context)
  push('}')

  return {
    code: context.code
  }
  // return context.code
}

function genFunctionPreamble (ast: any, context) {
  const { push } = context
  const VueBinging = 'Vue'
  // const helpers = ['toDisplayString']
  const aliasHelpers = s => `${helperMapName[s]}: _${helperMapName[s]}`
  // push(`const { ${helpers.map(aliasHelpers).join(',')} } = ${VueBinging}`)
  // 直接在 ast 上面就有 helpers 属性
  if (ast.helpers.length) {
    push(`const { ${ast.helpers.map(aliasHelpers).join(',')} } = ${VueBinging}`)
  }
  push('\n')
  push('return ')
}

function createCodegenContext () {
  const context = {
    code: '',
    push (source) {
      context.code += source
    },
    helper (key) {
      return `_${helperMapName[key]}`
    }
  }
  return context
}

function genNode (node: any, context: any) {
  switch (node.type) {
    case NodeTypes.TEXT:
      // text
      genText(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break

    // 处理表达式类型
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break

    case NodeTypes.ELEMENT:
      genElement(node, context)
      break
    default:
      break
  }
  // text
  // const { push } = context
  // push(`"${node.content}"`)
}
function genText (node: any, context: any) {
  // text
  const { push } = context
  push(`"${node.content}"`)
}
function genInterpolation (node: any, context: any) {
  // Implement
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(`)`)
}
function genExpression (node: any, context: any) {
  const { push } = context
  push(`${node.content}`)
}

function genElement (node: any, context: any) {
  const { push, helper } = context
  const { tag, children } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}("${tag}"), null, `)
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    genNode(child, context)
  }
  push(')')
}
