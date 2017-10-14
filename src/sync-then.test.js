const Sync = require('./sync-then')
const FAIL = () => {
  throw new Error('FAIL')
}

describe('Sync', () => {
  describe('resolved', () => {
    it('creates resolved thenables', () => {
      expect(Sync.resolve().then).toBeInstanceOf(Function)
    })

    it('resolved thenables invoke then clause', done => {
      expect(
        Sync.resolve(1).then(x => {
          expect(x).toEqual(1)
          done()
        }, FAIL)
      )
    })
  })

  describe('rejected', () => {
    it('creates rejected thenables', () => {
      expect(Sync.reject().then).toBeInstanceOf(Function)
    })

    it('rejected thenables invoke error clause', () => {
      expect(
        Sync.reject(new Error('expected')).then(FAIL, err => {
          expect(err.message).toEqual('expected')
        })
      )
    })

    it('wraps a promise is explicitly rejected', () => {
      expect(Sync.reject(Sync.resolve(10))).rejects.toEqual(10)
    })
  })
})
