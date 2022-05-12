import { NodeTypes } from './ast'
const enum TagType {
  START,
  END
}

export function baseParse (content: string) {
  const context = createParseContext(content)
  return createRoot(parseChildren(context))
}

function parseChildren (context) {
  const nodes: any[] = []
  let node
  if (context.source.startsWith('{{')) {
    node = parseInterpolation(context)
  } else if (context.source[0] === '<') {
    if (/[a-z]/i.test(context.source[1])) {
      // element
      node = parseElement(context)
    }
  }
  nodes.push(node)
  return nodes
}

function parseElement (context) {
  // 1. 解析 tag
  const element = parseTag(context, TagType.START)

  parseTag(context, TagType.END)

  return element
}

function parseTag (context: any, type: TagType) {
  // const match: any = /^<([a-z]*)/i.exec(context.source) => 只是匹配了 <div>

  const match: any = /^<\/?([a-z]*)/i.exec(context.source)

  const tag = match[1]

  // 2. 删除处理完成的代码
  advanceBy(context, match[0].length)
  // 删除 标签后边的 >
  advanceBy(context, 1)
  console.log(context.source)

  if (type === TagType.END) return
  return {
    type: NodeTypes.ELEMENT,
    tag
  }
}

function parseInterpolation (context) {
  // {{message}}

  const openDelimiter = '{{'
  const closeDelimiter = '}}'
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  )

  // context.source = context.source.slice(openDelimiter.length)
  advanceBy(context, openDelimiter.length)

  const rawContentLength = closeIndex - openDelimiter.length
  const rawContent = context.source.slice(0, rawContentLength)
  const content = rawContent.trim()

  // context.source = context.source.slice(
  //   rawContentLength + closeDelimiter.length
  // )

  advanceBy(context, rawContentLength + closeDelimiter.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content
    }
  }
}

function advanceBy (context: any, length: number) {
  context.source = context.source.slice(length)
}

function createParseContext (content: string): any {
  return {
    source: content
  }
}
function createRoot (children) {
  return {
    children
  }
}