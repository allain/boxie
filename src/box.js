const emptyValue = x => x === null || typeof x === 'undefined'
const isBox = x => typeof x.map === 'function' && !Array.isArray(x)

const EMPTY_BOX = Object.assign(
  filler => {
    if (filler) return filler()

    throw new Error('cannot open empty box')
  },
  {
    map: (_, filler) => (filler ? tryBox(filler) : EMPTY_BOX)
  }
)

const ErrorBox = err => {
  const errorBox = Object.assign(
    handler => {
      if (handler) {
        const handled = handler(err)
        return isBox(handled) ? handled() : handled
      }

      throw new Error('box contained error: ' + err)
    },
    {
      map: (_, handle) => (handle ? tryBox(() => handle(err)) : errorBox)
    }
  )

  return errorBox
}

const tryBox = fn => {
  try {
    return Box(fn())
  } catch (err) {
    return ErrorBox(err)
  }
}

const Box = x =>
  emptyValue(x)
    ? EMPTY_BOX
    : isBox(x)
      ? x
      : Object.assign(() => x, {
          map: f => tryBox(() => f(x))
        })

Box.isBox = isBox

module.exports = Box
