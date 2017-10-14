const Sync = require('./sync-then.js')

const raise = err => {
  throw new Error(err)
}

const isPromise = x => x && isFunction(x.then) && isFunction(x.catch)
const isBox = x => isFunction(x) && isFunction(x.map)
const isEmpty = x => x === null || typeof x === 'undefined'
const isFunction = fn => typeof fn === 'function'
const toFunction = fn => {
  if (fn) return isFunction(fn) ? fn : () => fn
  return x => x
}

const handle = handler => toFunction(handler)
const unbox = b => (isBox(b) ? unbox(b()) : b)
const thenify = (x, async) =>
  (async || isPromise(x) ? Promise : Sync)[
    x instanceof Error ? 'reject' : 'resolve'
  ](x)

const buildInternal = (x, async) =>
  Object.assign(
    handler => {
      const lastThen = thenify(unbox(x), async || isPromise(x))
        .then(val => (isEmpty(val) ? handle(handler)(val) : val))
        .then(
          val => (isEmpty(val) ? raise('cannot open empty box') : val),
          handler ? err => unbox(handle(handler)(err)) : null
        )

      return isPromise(lastThen) ? lastThen : lastThen.unthen()
    },
    {
      _async: async,
      map: (fn, handler) =>
        buildInternal(
          thenify(unbox(x), async).then(
            val =>
              isEmpty(val) ? handle(handler)(val) : fn ? unbox(fn(val)) : val,
            handler ? err => unbox(handle(handler)(err)) : null
          ),
          async
        )
    }
  )

const Box = x => buildInternal(x, isPromise(x))
Box.all = boxes => {
  const anyAsync = boxes.some(b => isPromise(b) || (isBox(b) && b._async))
  if (anyAsync) return buildInternal(Promise.all(boxes.map(b => Box(b)())))

  try {
    return buildInternal(boxes.map(b => buildInternal(b, false)()), false)
  } catch (err) {
    return buildInternal(err, false)
  }
}

module.exports = Box
