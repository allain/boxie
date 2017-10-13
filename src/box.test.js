const { Box } = require('./boxie')

describe('Box', () => {
  it('Box is a factory function', () => {
    expect(Box).toBeInstanceOf(Function)
    expect(Box.isBox(Box(10))).toBeTruthy()
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
  })

  it('map method returns a box', () => {
    expect(Box(1).map(x => x).map).toBeInstanceOf(Function)
    expect(Box(null).map(x => x).map).toBeInstanceOf(Function)
    expect(Box(undefined).map(x => x).map).toBeInstanceOf(Function)
    expect(Box(Promise.resolve(10)).map(x => x).map).toBeInstanceOf(Function)
  })

  it('flattens maps when result is a box', () =>
    expect(Box(1).map(x => Box(x + 1))()).toEqual(2))

  it('supports calling box as function to extract synchronous extraction', () =>
    expect(Box(10)()).toEqual(10))

  it('throws when opening an empty synchronous box', () =>
    expect(() => Box()()).toThrowError('cannot open empty box'))

  it('does nothing fancy with function values', () =>
    expect(
      Box(x => y => x + y)
        .map(f => f(1))
        .map(f => f(2))()
    ).toEqual(3))

  it('does nothing special with Promises in the box', () => {
    const p = Promise.resolve(10)
    const result = Box(p).map(x => x.then(y => null))()
    expect(result).toBeInstanceOf(Promise)
    expect(result).resolves.toBeNull()
  })
})
