const isAsyncBox = x => isBox(x) && x.then

const EMPTY_ASYNC_BOX = Object.assign(
  () => Promise.reject(new Error('cannot open empty box')),
  {
    map: (_, empty) => (empty ? AsyncBox(empty()) : EMPTY_BOX),
    then: (_, err) =>
      err ? Promise.resolve(err()) : Promise.reject(new Error('Box is empty')),
    catch: handler => Promise.resolve(handler)
  }
)

const AsyncBox = x => {
  if (emptyValue(x)) return EMPTY_ASYNC_BOX
  const resolver = Promise.resolve(x)
  return Object.assign(() => resolver, {
    map: (f, empty) => AsyncBox(resolver.then(f, empty)),
    then: resolver.then.bind(resolver),
    catch: resolver.catch.bind(resolver)
  })
}
AsyncBox.isAsyncBox = isAsyncBox

const EMPTY_BOX = Object.assign(
  () => {
    throw new Error('Cannot open empty box')
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

const emptyValue = x => x === null || typeof x === 'undefined'

const isBox = x => typeof x.map === 'function' && !Array.isArray(x)

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
      : x.then
        ? AsyncBox(x)
        : Object.assign(() => x, {
            map: f => tryBox(() => f(x))
          })

Box.isBox = isBox

module.exports = {
  Box,
  AsyncBox
}
