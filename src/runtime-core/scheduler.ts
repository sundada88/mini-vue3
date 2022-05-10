const queue: any[] = []
let isFlushPending = false
const p = Promise.resolve()

export function queueJobs (fn) {
  if (!queue.includes(fn)) {
    queue.push(fn)
  }
  queueFlush()
}
export function nextTick (fn) {
  return fn ? p.then(fn) : p
}
function queueFlush () {
  if (isFlushPending) return
  isFlushPending = true
  nextTick(() => {
    isFlushPending = false
    let job
    while ((job = queue.shift())) {
      job && job()
    }
  })
}
