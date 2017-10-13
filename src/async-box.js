const isBox = x => x && x.map && !Array.isArray(x)
const isAsyncBox = x => isBox(x) && x._async
const isEmpty = x => x === null || typeof x === 'undefined'
const isFunction = f => typeof f === 'function'

const AsyncBox = x => {
  const value = Promise.resolve(isBox(x) ? x() : x)

  return Object.assign(
    handler =>
      value.then(y => {
        if (isEmpty(y)) {
          if (handler) {
            return isFunction(handler) ? handler() : handler
          }
          throw new Error('cannot open empty box')
        }

        return isBox(y) ? y() : y
      }, handler ? (isFunction(handler) ? handler : () => handler) : null),
    {
      map: (f, empty) =>
        AsyncBox(
          value.then(
            y =>
              isEmpty(y)
                ? empty ? (isFunction(empty) ? empty() : empty) : null
                : isAsyncBox(y) ? y.map(f) : f(y),
            empty ? (isFunction(empty) ? empty : () => empty) : empty
          )
        ),
      _async: true
    }
  )
}

AsyncBox.isAsyncBox = isAsyncBox
module.exports = AsyncBox
