const { Box } = require('./boxie')

describe('Box', () => {
  it('Box is a factory function', () => {
    expect(Box).toBeInstanceOf(Function)
    expect(Box.isBox(Box(10))).toBeTruthy()
  })

  it('isBox works on all kinds of boxes', () => {
    expect(Box.isBox(Box(10))).toBeTruthy()
    expect(Box.isBox(Box(Box(10)))).toBeTruthy()
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

  it('unboxes boxes when placed in a box', () =>
    expect(Box(Box(Box(1)))()).toEqual(1))

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

  it('throws exception when opening a box with an Error in it', () => {
    const ex = new Error('Expected')
    try {
      Box(1).map(() => {
        throw ex
      })()
    } catch (err) {
      expect(err).toBe(ex)
    }
  })

  it('ignores errors until the last possible moment', () =>
    expect(
      Box(1)
        .map(x => {
          throw new Error('expected')
        })
        .map(x => expect.fail('should not reach'))
        .map(x => expect.fail('should not reach'))(_ => 'fixed')
    ).toEqual('fixed'))

  it('errors can be handled using handler on map', () => {
    expect(
      Box(1)
        .map(() => {
          throw new Error('Expected')
        })
        .map(null, err => err.message)()
    ).toEqual('Expected')
  })

  it('if handler on map returns box it gets unboxed', () => {
    expect(
      Box(1)
        .map(() => {
          throw new Error('Expected')
        })
        .map(null, _ => Box('unboxed'))()
    ).toEqual('unboxed')
  })

  it('errors can be andled using handler on opener', () => {
    expect(
      Box(1).map(() => {
        throw new Error('Expected')
      })(err => err.message)
    ).toEqual('Expected')
  })

  it('if handler on opener returns box it unboxes it', () => {
    expect(
      Box(1).map(() => {
        throw new Error('Expected')
      })(_ => Box('unboxed'))
    ).toEqual('unboxed')
  })

  it('supports filling box using filler', () =>
    expect(Box(null).map(null, () => 'filled')()).toEqual('filled'))

  it('supports filling box using opener', () =>
    expect(Box(null)(() => 'filled')).toEqual('filled'))

  it('supports specifying a value to the empty opener', () =>
    expect(Box(null)(5)).toEqual(5))

  it('supports specifying a value to the error opener', () =>
    expect(
      Box(1).map(() => {
        throw new Error()
      })(5)
    ).toEqual(5))

  it('supports specifying a value to the empty handler', () =>
    expect(Box(null).map(null, 5)()).toEqual(5))

  it('supports specifying a value to the error handler', () =>
    expect(
      Box(1)
        .map(x => {
          throw new Error()
        })
        .map(null, 5)()
    ).toEqual(5))

  it('supports null as an opener alue', () =>
    expect(Box(null)(null)).toBeNull())

  it('has error box helper', () =>
    expect(Box.isBox(Box.error(new Error('Testing')))).toBeTruthy())
})
