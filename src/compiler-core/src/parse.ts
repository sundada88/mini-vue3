import { NodeTypes } from './ast'
const enum TagType {
  START,
  END
}

export function baseParse (content: string) {
  const context = createParseContext(content)
  return createRoot(parseChildren(context, []))
}

function parseChildren (context, ancestor) {
  const nodes: any[] = []
  while (!isEnd(context, ancestor)) {
    let node

    // 差值表达式
    if (context.source.startsWith('{{')) {
      node = parseInterpolation(context)
    } else if (context.source[0] === '<') {
      // 标签
      if (/[a-z]/i.test(context.source[1])) {
        // element
        node = parseElement(context, ancestor)
      }
    }
    // text 文本
    if (!node) {
      // handle text
      node = parseText(context)
    }
    nodes.push(node)
  }
  return nodes
}

function isEnd (context, ancestor) {
  const s = context.source
  // 2. 当遇到结束标签的时候
  if (s.startsWith('</')) {
    // 有个问题就是只要结束标签和之前的所有开始标签有一个可以匹配上跳出循环
    // 所以抛出标签不匹配的逻辑应该 parseElement 的时候做
    for (let i = ancestor.length - 1; i >= 0; i--) {
      const tag = ancestor[i].tag
      // if (s.slice(2, 2 + tag.length) === tag) {
      //   return true
      // }
      if (startsWithEndTagOpen(s, tag)) {
        return true
      }
    }
  }

  // if (parentTag && s.startsWith(`</${parentTag}>`)) {
  //   return true
  // }
  // 1. source 有值的时候
  return !s
}

function parseText (context: any) {
  let endIndex = context.source.length
  let endTokens = ['<', '{{']
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }
  // 1. 获取content
  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseTextData (context: any, length) {
  const content = context.source.slice(0, length)
  // 2. 推进
  advanceBy(context, content.length)
  return content
}

function parseElement (context: any, ancestor) {
  // 1. 解析 tag
  const element: any = parseTag(context, TagType.START)

  ancestor.push(element)

  element.children = parseChildren(context, ancestor)

  // 从 ancestor 中抛出标签，应该在判断 ancestor 中的末尾标签和需要结束标签是不是同一个标签
  // if (context.source.slice(2, 2 + element.tag.length) === element.tag) {
  if (startsWithEndTagOpen(context.source, element.tag)) {
    ancestor.pop()
  } else {
    throw new Error(`缺少结束标签:${element.tag}`)
  }

  parseTag(context, TagType.END)

  return element
}

function startsWithEndTagOpen (source, tag) {
  return (
    source.startsWith('</') &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag
  )
}

function parseTag (context: any, type: TagType) {
  // const match: any = /^<([a-z]*)/i.exec(context.source) => 只是匹配了 <div>

  const match: any = /^<\/?([a-z]*)/i.exec(context.source)

  const tag = match[1]

  // 2. 删除处理完成的代码
  advanceBy(context, match[0].length)
  // 删除 标签后边的 >
  advanceBy(context, 1)

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
  // const rawContent = context.source.slice(0, rawContentLength)
  const rawContent = parseTextData(context, rawContentLength)
  const content = rawContent.trim()

  // context.source = context.source.slice(
  //   rawContentLength + closeDelimiter.length
  // )

  advanceBy(context, closeDelimiter.length)

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
    children,
    type: NodeTypes.ROOT
  }
}
