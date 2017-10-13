const { Box, AsyncBox } = require('./boxie')

describe('AsyncBox', () => {
  it('AsyncBox is a factory function', () => {
    expect(AsyncBox).toBeInstanceOf(Function)
    expect(AsyncBox.isAsyncBox(AsyncBox(10))).toBeTruthy()
    expect(AsyncBox.isAsyncBox(AsyncBox(10))).toBeTruthy()
  })

  it('AsyncBox works on all kinds of boxes', () => {
    expect(AsyncBox.isAsyncBox(AsyncBox(10))).toBeTruthy()
    expect(AsyncBox.isAsyncBox(AsyncBox(Box(1)))).toBeTruthy()
    expect(AsyncBox.isAsyncBox(AsyncBox(AsyncBox(1)))).toBeTruthy()
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
    expect(
      AsyncBox(1)
        .map(x => AsyncBox(x + 1))
        .map(x => AsyncBox(x + 1))()
    ).resolves.toEqual(3))

  it('supports calling as function to extract asynchronous result', () =>
    expect(AsyncBox(10)()).resolves.toEqual(10))

  it('rejects when opening an empty async box', () =>
    expect(AsyncBox(null)()).rejects.toBeInstanceOf(Error))

  it('map handler can fill empty box', () =>
    expect(AsyncBox(null).map(null, () => 'test')()).resolves.toEqual('test'))

  it('does nothing fancy with function values', () =>
    expect(
      AsyncBox(x => y => x + y)
        .map(f => f(1))
        .map(f => f(2))()
    ).resolves.toEqual(3))

  it('rejects when opening a box with an Error in it', () =>
    expect(
      AsyncBox(1).map(() => {
        throw new Error('Expected')
      })()
    ).rejects.toBeInstanceOf(Error))

  it('errors can be andled using handler on map', () =>
    expect(
      AsyncBox(1)
        .map(() => {
          throw new Error('Expected')
        })
        .map(null, err => err.message)()
    ).resolves.toEqual('Expected'))

  it('errors can be andled using handler on opener', () =>
    expect(
      AsyncBox(1).map(() => {
        throw new Error('Expected')
      })(err => err.message)
    ).resolves.toEqual('Expected'))

  it('supports mixing Boxes with AsyncBoxes', () =>
    expect(AsyncBox(1).map(x => Box(x + 1).map(x => x + 1))()).resolves.toEqual(
      3
    ))

  it('can handle Boxing a promise that resolves to a Box', () =>
    expect(AsyncBox(Promise.resolve(Box(1)))()).resolves.toEqual(1))

  it('can handle Boxing a promise that resolves to an AsyncBox', () =>
    expect(AsyncBox(Promise.resolve(AsyncBox(1)))()).resolves.toEqual(1))
})
