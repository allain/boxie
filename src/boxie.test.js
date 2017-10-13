const { Box, AsyncBox } = require('./boxie')

describe('boxie', () => {
  it('Box is a factory function', () => {
    expect(Box).toBeInstanceOf(Function)
    expect(Box.isBox(Box(10))).toBeTruthy()
  })

  it('AsyncBox is a factory function', () => {
    expect(AsyncBox).toBeInstanceOf(Function)
    expect(Box.isBox(AsyncBox(10))).toBeTruthy()
    expect(AsyncBox.isAsyncBox(AsyncBox(10))).toBeTruthy()
  })

  it('isBox works on all kinds of boxes', () => {
    expect(Box.isBox(Box(10))).toBeTruthy()
    expect(Box.isBox(Box(null))).toBeTruthy()
    expect(Box.isBox(Box())).toBeTruthy()
    expect(Box.isBox(Box(Promise.resolve()))).toBeTruthy()
  })

  it('boxes are always built synchronously', () => {
    expect(Box(10).map).toBeInstanceOf(Function)
    expect(Box(null).map).toBeInstanceOf(Function)
    expect(Box(undefined).map).toBeInstanceOf(Function)
    expect(Box(Promise.resolve(10)).map).toBeInstanceOf(Function)
  })

  it('map method returns a box', () => {
    expect(Box(1).map(x => x).map).toBeInstanceOf(Function)
    expect(Box(null).map(x => x).map).toBeInstanceOf(Function)
    expect(Box(undefined).map(x => x).map).toBeInstanceOf(Function)
    expect(Box(Promise.resolve(10)).map(x => x).map).toBeInstanceOf(Function)
  })

  it('supports async box usage when content is a Promise', done => {
    const start = Date.now()
    Box(
      new Promise(resolve => setTimeout(() => resolve(Date.now()), 10))
    ).map(now => {
      expect(now - start).toBeGreaterThanOrEqual(5) // can actually be 8 or 9 sometimes
      done()
    })
  })

  it('AsyncBox stays async after mapping', () =>
    expect(AsyncBox.isAsyncBox(AsyncBox(1).map(x => x + 1))).toBeTruthy())

  it('flattens maps when result is a box', () =>
    expect(Box(1).map(x => Box(x + 1))()).toEqual(2))

  it('supports calling box as function to extract synchronous extraction', () =>
    expect(Box(10)()).toEqual(10))

  it('supports calling as function to extract asynchronous result', () =>
    expect(Box(Promise.resolve(10))()).resolves.toEqual(10))

  it('rejects when opening an empty async box', () =>
    expect(AsyncBox(null)()).rejects.toBeInstanceOf(Error))

  it('supports calling as promise to extract asynchronous result', () =>
    expect(Box(Promise.resolve(10))).resolves.toEqual(10))

  it('does nothing fancy with function values', () =>
    expect(
      Box(x => y => x + y)
        .map(f => f(1))
        .map(f => f(2))()
    ).toEqual(3))
})
