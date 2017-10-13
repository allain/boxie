const isBox = x => x && x.map && !Array.isArray(x)
const isAsyncBox = x => isBox(x) && x._async
const emptyValue = x => x === null || typeof x === 'undefined'

const AsyncBox = x => {
  const value = Promise.resolve(isBox(x) ? x() : x)

  return Object.assign(
    handler =>
      value.then(y => {
        if (emptyValue(y)) throw new Error('cannot open empty box')

        return isBox(y) ? y() : y
      }, handler),
    {
      map: (f, empty) =>
        AsyncBox(
          value.then(
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
