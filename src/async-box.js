const isAsyncBox = x => x && x._async && x.map && !Array.isArray(x)
const emptyValue = x => x === null || typeof x === 'undefined'

const AsyncBox = x => {
  const resolver = Promise.resolve(x)

  return Object.assign(
    () =>
      resolver.then(y => {
        if (emptyValue(y)) throw new Error('cannot open empty box')

        if (isAsyncBox(y)) return y()

        return y
      }),
    {
      map: (f, empty) =>
        AsyncBox(
          resolver.then(
            y =>
              emptyValue(y)
                ? empty ? empty() : null
                : isAsyncBox(y) ? y.map(f) : f(y),
            empty
          )
        ),
      _async: true
    }
  )
}

AsyncBox.isAsyncBox = isAsyncBox
module.exports = AsyncBox
