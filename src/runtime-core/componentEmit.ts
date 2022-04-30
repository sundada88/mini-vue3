import { camellize, toHandlerKey } from '../shared/index'

export function emit (instance, event, ...args) {
  const { props } = instance
  // console.log(event)
  // add => onAdd
  const handlerName = toHandlerKey(camellize(event))
  const handler = props[handlerName]
  handler && handler(...args)
}
