const emptyValue = x => x === null || typeof x === 'undefined'
const isBox = x => typeof x.map === 'function' && !Array.isArray(x)
const isFunction = f => typeof f === 'function'
const handle = (handler, val) => (isFunction(handler) ? handler(val) : handler)
const unbox = val => (isBox(val) ? val() : val)

const Box = x =>
  emptyValue(x)
    ? EMPTY_BOX
    : isBox(x)
      ? x
      : Object.assign(() => x, {
          map: f => tryBox(() => f(x))
        })

Box.isBox = isBox
Box.error = err => ErrorBox(err)

const tryBox = val => {
  try {
    return Box(handle(val))
  } catch (err) {
    return ErrorBox(err)
  }
}

const EMPTY_BOX = Object.assign(
  (...args) => {
    if (args.length) return handle(args[0])

    throw new Error('cannot open empty box')
  },
  {
    map: (_, filler) => (filler ? tryBox(filler) : EMPTY_BOX)
  }
)

const ErrorBox = err => {
  const errorBox = Object.assign(
    (...args) => {
      if (args.length) return unbox(handle(args[0], err))

      throw err
    },
    {
      map: (_, handler) =>
        handler ? tryBox(() => handle(handler, err)) : errorBox
    }
  )

  return errorBox
}

module.exports = Box
