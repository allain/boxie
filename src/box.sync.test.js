const Box = require('./box')
const FAIL = () => {
  throw new Error('FAIL')
}

describe('Box - sync', () => {
  it('boxed sync boxes get unboxed as sync', () =>
    expect(Box(Box(Box(1)))()).toEqual(1))

  it('unboxes as value when not error or empty', () =>
    expect(Box(10)()).toEqual(10))

  it('unboxes as throw when an Error Box', () =>
    expect(() =>
      Box(1).map(() => {
        throw new Error('error')
      })()
    ).toThrowError('error'))

  it('stay sync when map returns non-promise', () =>
    expect(Box(1).map(x => x + 1)()).toEqual(2))

  describe('happy sync', () => {
    describe('opener returns value', () => {
      it('when opener empty', () => expect(Box(1)()).toEqual(1))

      it('when opener given value', () => expect(Box(1)(2)).toEqual(1))

      it('opener given function returning value', () =>
        expect(Box(1)(() => 2)).toEqual(1))

      it('when opener given resolving function', () =>
        expect(Box(1)(() => Promise.resolve(2))).toEqual(1))

      it('when opener given throwing function', () =>
        expect(
          Box(1)(() => {
            throw new Error('test')
          })
        ).toEqual(1))
    })

    describe('map', () => {
      it('create a new box when invoked without arguments', () => {
        const b1 = Box(1)
        const b2 = b1.map()
        expect(b1).not.toBe(b2)
      })

      it('can have no happy path specified', () =>
        expect(Box(1).map(null, FAIL)()).toEqual(1))

      it('can map to simple values', () =>
        expect(Box(1).map(n => n * 3)()).toEqual(3))

      it('when maps to Promise becomes async', () =>
        expect(Box(1).map(n => Promise.resolve(n * 3))()).resolves.toEqual(3))

      it('can map to rejecting Promise becomes rejecting a sync', () =>
        Box(1).map(n => Promise.reject(new Error('expected')))().then(
          FAIL,
          err => {
            expect(err).toBeInstanceOf(Error)
            expect(err.message).toEqual('expected')
          }
        ))

      it('can map to Sync Box', () =>
        expect(Box(1).map(n => Box(3))()).toEqual(3))

      it('Mapping to Async Box becomes Async', () =>
        expect(Box(1).map(n => Box(Promise.resolve(3)))()).resolves.toEqual(3))
    })
  })

  describe('error', () => {
    it('error box can be created by boxign an Error', () => {
      expect(() => Box(new Error('test'))()).toThrowError('test')
    })

    const buildErrorBox = (msg = 'test') =>
      Box(1).map(() => {
        throw new Error(msg)
      })

    describe('replacing from opener', () => {
      it('with value', () => expect(buildErrorBox()(10)).toEqual(10))

      it('with function', () =>
        expect(
          Box(1).map(() => {
            throw new Error('test')
          })(() => 10)
        ).toEqual(10))

      it('with promise', () =>
        expect(
          Box(1).map(() => {
            throw new Error('test')
          })(() => Promise.resolve(10))
        ).resolves.toEqual(10))

      it('with rejecing promise stays error', done =>
        Box(1).map(() => {
          throw new Error('test')
        })(() => Promise.reject(new Error('still'))).then(FAIL, err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toEqual('still')
          done()
        }))

      it('with throwing function', () =>
        expect(() =>
          buildErrorBox()(() => {
            throw new Error('thrown')
          })
        ).toThrowError('thrown'))

      it('with async box', () =>
        expect(
          buildErrorBox()(() => Box(Promise.resolve(10)))
        ).resolves.toEqual(10))

      it('with sync box', () =>
        expect(buildErrorBox()(() => Box(10))).toEqual(10))
    })

    describe('map', () => {
      it('never calls happy path', () =>
        expect(() => buildErrorBox().map(FAIL)()).toThrowError('test'))

      it('can replace with value', () =>
        expect(buildErrorBox().map(FAIL, 10)()).toEqual(10))

      it('can replace with function', () =>
        expect(buildErrorBox().map(FAIL, () => 10)()).toEqual(10))

      it('can replace with promise', () =>
        expect(
          buildErrorBox().map(FAIL, () => Promise.resolve(10))()
        ).resolves.toEqual(10))

      it('replacing with rejecing promise stays error', done =>
        buildErrorBox().map(FAIL, () =>
          Promise.reject(new Error('still'))
        )().then(
          () => done(new Error('fail')),
          err => {
            expect(err).toBeInstanceOf(Error)
            expect(err.message).toEqual('still')
            done()
          }
        ))

      it('replacing with throwing function', () =>
        expect(() =>
          buildErrorBox().map(FAIL, () => {
            throw new Error('still')
          })()
        ).toThrowError('still'))

      it('with async box', () =>
        expect(
          buildErrorBox().map(FAIL, () => Box(Promise.resolve(10)))()
        ).resolves.toEqual(10))

      it('with sync box', () =>
        expect(buildErrorBox().map(FAIL, () => Box(10))()).toEqual(10))
    })
  })

  describe('empty sync', () => {
    it('null is empty', () =>
      expect(() => Box(null)()).toThrowError('cannot open empty box'))

    it('undefined is empty', () =>
      expect(() => Box(undefined)()).toThrowError('cannot open empty box'))

    describe('map', () => {
      it('never calls happy path', () =>
        expect(() => Box().map(FAIL)()).toThrowError('cannot open empty box'))

      it('can replace with value', () =>
        expect(Box().map(FAIL, 10)()).toEqual(10))

      it('can replace with function', () =>
        expect(Box().map(FAIL, () => 10)()).toEqual(10))

      it('can replace with promise', () =>
        expect(Box().map(FAIL, () => Promise.resolve(10))()).resolves.toEqual(
          10
        ))

      it('replace with empty promise stays empty', () =>
        Box().map(FAIL, () => Promise.resolve())().then(FAIL, err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toEqual('cannot open empty box')
        }))
    })

    describe('filling from opener', () => {
      it('with value', () => expect(Box()(10)).toEqual(10))

      it('with function', () => expect(Box()(() => 10)).toEqual(10))

      it('with function resolving to promise', () =>
        expect(Box()(() => Promise.resolve(10))).resolves.toEqual(10))

      it('with promise', () =>
        expect(Box()(Promise.resolve(10))).resolves.toEqual(10))

      it('with empty promise stays empty', () =>
        Box()(Promise.resolve()).then(FAIL, err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toEqual('cannot open empty box')
        }))
    })
  })

  it('Box.all returns a synchronous box if all boxes passed are synchrnous', () =>
    expect(Box.all([Box(1), Box(2)])()).toEqual([1, 2]))

  it('Box.all works with simple values', () =>
    expect(Box.all([1, 2])()).toEqual([1, 2]))

  it('Box.all returns an error box if any of its boxes are empty', () =>
    expect(() => Box.all([Box(), Box(2)])()).toThrowError(
      'cannot open empty box'
    ))
})
