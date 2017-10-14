const Box = require('./box')
const FAIL = () => {
  throw new Error('FAIL')
}

describe('Box - async', () => {
  it('boxed async boxes get unboxed as async', () =>
    expect(Box(Box(Box(Promise.resolve(1))))()).resolves.toEqual(1))

  it('unboxes as resolving promise when not error or empty', () =>
    expect(Box(Promise.resolve(10))()).resolves.toEqual(10))

  it('unboxes as rejecting promise contains rejecting promise', done =>
    Box(Promise.reject(new Error('rejected')))().catch(err => {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toEqual('rejected')
      done()
    }))

  it('stay async when map returns non-promise', () =>
    expect(Box(Promise.resolve(1)).map(x => x + 1)()).resolves.toEqual(2))

  describe('happy async', () => {
    describe('opener resolves to value', () => {
      it('when opener empty', () =>
        expect(Box(Promise.resolve(1))()).resolves.toEqual(1))

      it('when opener given value', () =>
        expect(Box(Promise.resolve(1))(2)).resolves.toEqual(1))

      it('opener given function returning value', () =>
        expect(Box(Promise.resolve(1))(() => 2)).resolves.toEqual(1))

      it('when opener given resolving function', () =>
        expect(
          Box(Promise.resolve(1))(() => Promise.resolve(2))
        ).resolves.toEqual(1))

      it('when opener given rejecting function', () =>
        expect(
          Box(Promise.resolve(1))(() => Promise.reject(new Error('test')))
        ).resolves.toEqual(1))
    })

    describe('map', () => {
      it('create a new box when invoked without arguments', () => {
        const b1 = Box(Promise.resolve(1))
        const b2 = b1.map()
        expect(b1).not.toBe(b2)
      })

      it('can have no happy path specified', () =>
        expect(Box(Promise.resolve(1)).map(null, FAIL)()).resolves.toEqual(1))

      it('can map to simple values', () =>
        expect(Box(Promise.resolve(1)).map(n => n * 3)()).resolves.toEqual(3))

      it('can map to resolving values', () =>
        expect(
          Box(Promise.resolve(1)).map(n => Promise.resolve(n * 3))()
        ).resolves.toEqual(3))

      it('can map to rejecting values', () =>
        Box(Promise.resolve(1)).map(n =>
          Promise.reject(new Error('expected'))
        )().then(FAIL, err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toEqual('expected')
        }))

      it('can map to Box', () =>
        expect(
          Box(Promise.resolve(1)).map(n => Box(Promise.resolve(3)))()
        ).resolves.toEqual(3))
    })
  })

  describe('error async', () => {
    it('error box can be created by boxing a rejection', () =>
      Box(Promise.reject(new Error('test')))().then(FAIL, err => {
        expect(err.message).toEqual('test')
      }))

    const buildErrorBox = (msg = 'test') => Box(Promise.reject(new Error(msg)))

    describe('replacing from opener', () => {
      it('with value', () => expect(buildErrorBox()(10)).resolves.toEqual(10))

      it('with function', () =>
        expect(buildErrorBox()(() => 10)).resolves.toEqual(10))

      it('with promise', () =>
        expect(buildErrorBox()(() => Promise.resolve(10))).resolves.toEqual(10))

      it('with rejecing promise stays error', done =>
        buildErrorBox()(() => Promise.reject(new Error('still'))).then(
          () => done(new Error('fail')),
          err => {
            expect(err).toBeInstanceOf(Error)
            expect(err.message).toEqual('still')
            done()
          }
        ))

      it('with throwing function', () =>
        buildErrorBox()(() => {
          throw new Error('thrown')
        }).then(FAIL, err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toEqual('thrown')
        }))

      it('with async box', () =>
        expect(
          buildErrorBox()(() => Box(Promise.resolve(10)))
        ).resolves.toEqual(10))

      it('with sync box', () =>
        expect(buildErrorBox()(() => Box(10))).resolves.toEqual(10))
    })

    describe('map', () => {
      it('never calls happy path', () =>
        buildErrorBox('grumpy').map(FAIL)().then(FAIL, err =>
          expect(err.message).toEqual('grumpy')
        ))

      it('can replace with value', () =>
        expect(buildErrorBox().map(FAIL, 10)()).resolves.toEqual(10))

      it('can replace with function', () =>
        expect(buildErrorBox().map(FAIL, () => 10)()).resolves.toEqual(10))

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

      it('replacing with throwing function', done =>
        buildErrorBox().map(FAIL, () => {
          throw new Error('still')
        })().then(
          () => done(new Error('fail')),
          err => {
            expect(err).toBeInstanceOf(Error)
            expect(err.message).toEqual('still')
            done()
          }
        ))

      it('with async box', () =>
        expect(
          buildErrorBox().map(FAIL, () => Box(Promise.resolve(10)))()
        ).resolves.toEqual(10))

      it('with sync box', () =>
        expect(buildErrorBox().map(FAIL, () => Box(10))()).resolves.toEqual(10))
    })
  })

  describe('empty async', () => {
    const buildEmptyBox = () => Box(Promise.resolve())

    it('null is empty', done => {
      Box(Promise.resolve(null))().then(FAIL, err => {
        expect(err).toBeInstanceOf(Error)
        expect(err.message).toEqual('cannot open empty box')
        done()
      })
    })

    it('undefined is empty', done => {
      Box(Promise.resolve())().then(FAIL, err => {
        expect(err).toBeInstanceOf(Error)
        expect(err.message).toEqual('cannot open empty box')
        done()
      })
    })

    describe('map', () => {
      it('never calls happy path', () =>
        buildEmptyBox().map(FAIL)().then(FAIL, err =>
          expect(err.message).toEqual('cannot open empty box')
        ))

      it('can replace with value', () =>
        expect(buildEmptyBox().map(FAIL, 10)()).resolves.toEqual(10))

      it('can replace with function', () =>
        expect(buildEmptyBox().map(FAIL, () => 10)()).resolves.toEqual(10))

      it('can replace with promise', () =>
        expect(
          buildEmptyBox().map(FAIL, () => Promise.resolve(10))()
        ).resolves.toEqual(10))

      it('replae with empty promise stays empty', done =>
        buildEmptyBox().map(FAIL, () => Promise.resolve())().then(
          () => done(new Error('fail')),
          err => {
            expect(err).toBeInstanceOf(Error)
            expect(err.message).toEqual('cannot open empty box')
            done()
          }
        ))
    })

    describe('filling from opener', () => {
      it('with value', () => expect(buildEmptyBox()(10)).resolves.toEqual(10))

      it('with function', () =>
        expect(buildEmptyBox()(() => 10)).resolves.toEqual(10))

      it('with promise', () =>
        expect(buildEmptyBox()(() => Promise.resolve(10))).resolves.toEqual(10))

      it('with empty promise stays empty', done =>
        buildEmptyBox()(() => Promise.resolve()).then(
          () => done(new Error('fail')),
          err => {
            expect(err).toBeInstanceOf(Error)
            expect(err.message).toEqual('cannot open empty box')
            done()
          }
        ))
    })
  })

  it('Box.all returns a async box if all boxes passed are synchronous', () =>
    expect(
      Box.all([Box(Promise.resolve(1)), Box(Promise.resolve(2))])()
    ).resolves.toEqual([1, 2]))

  it('Box.all returns a async box if any of its boxes passed are async', () =>
    expect(Box.all([Box(Promise.resolve(1)), Box(2), 3])()).resolves.toEqual([
      1,
      2,
      3
    ]))

  it('Box.all returns an error box if any of its boxes are empty', () =>
    Box.all([Box(Promise.resolve()), 2])().then(FAIL, err => {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toEqual('cannot open empty box')
    }))

  it('Box.all returns an error box if any of its boxes contain errors', () =>
    Box.all([Box(Promise.reject(new Error('doh'))), 2])().then(FAIL, err => {
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toEqual('doh')
    }))
})
