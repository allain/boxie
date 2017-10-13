const emptyValue = x => x === null || typeof x === 'undefined'
const isBox = x => typeof x.map === 'function' && !Array.isArray(x)

const EMPTY_BOX = Object.assign(
  () => {
    throw new Error('cannot open empty box')
  },
  {
    map: (_, empty) => (empty ? Box(empty()) : EMPTY_BOX)
  }
)

const ErrorBox = err => {
  const errorBox = Object.assign(
    () => {
      throw new Error('Unhandled error: ' + err)
    },
    {
      map: (_, handle) => (handle ? tryBox(() => handle(err)) : errorBox)
    }
  )
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
