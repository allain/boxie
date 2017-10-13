const { AsyncBox } = require('./boxie')

describe('AsyncBox', () => {
  it('AsyncBox is a factory function', () => {
    expect(AsyncBox).toBeInstanceOf(Function)
    expect(AsyncBox.isAsyncBox(AsyncBox(10))).toBeTruthy()
    expect(AsyncBox.isAsyncBox(AsyncBox(10))).toBeTruthy()
  })

  it('AsyncBox works on all kinds of boxes', () => {
    expect(AsyncBox.isAsyncBox(AsyncBox(10))).toBeTruthy()
    expect(AsyncBox.isAsyncBox(AsyncBox(null))).toBeTruthy()
    expect(AsyncBox.isAsyncBox(AsyncBox())).toBeTruthy()
    expect(AsyncBox.isAsyncBox(AsyncBox(Promise.resolve()))).toBeTruthy()
  })

  it('boxes are always built synchronously', () => {
    expect(AsyncBox(10).map).toBeInstanceOf(Function)
    expect(AsyncBox(null).map).toBeInstanceOf(Function)
    expect(AsyncBox(undefined).map).toBeInstanceOf(Function)
    expect(AsyncBox(Promise.resolve(10)).map).toBeInstanceOf(Function)
  })

  it('map method returns a box', () => {
    expect(AsyncBox(1).map(x => x).map).toBeInstanceOf(Function)
    expect(AsyncBox(null).map(x => x).map).toBeInstanceOf(Function)
    expect(AsyncBox(undefined).map(x => x).map).toBeInstanceOf(Function)
    expect(AsyncBox(Promise.resolve(10)).map(x => x).map).toBeInstanceOf(
      Function
    )
  })

  it('supports async box usage when content is a Promise', done => {
    const start = Date.now()
    AsyncBox(
      new Promise(resolve => setTimeout(() => resolve(Date.now()), 10))
    ).map(now => {
      expect(now - start).toBeGreaterThanOrEqual(5) // can actually be 8 or 9 sometimes
      done()
    })
  })

  it('AsyncBox stays async after mapping', () =>
    expect(AsyncBox.isAsyncBox(AsyncBox(1).map(x => x + 1))).toBeTruthy())

  it('flattens maps when result is a box', () =>
    expect(AsyncBox(1).map(x => AsyncBox(x + 1))()).resolves.toEqual(2))

  it('supports calling as function to extract asynchronous result', () =>
    expect(AsyncBox(10)()).resolves.toEqual(10))

  it('rejects when opening an empty async box', () =>
    expect(AsyncBox(null)()).rejects.toBeInstanceOf(Error))

  it('does nothing fancy with function values', () =>
    expect(
      AsyncBox(x => y => x + y)
        .map(f => f(1))
        .map(f => f(2))()
    ).resolves.toEqual(3))
})
