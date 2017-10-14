// helper to turn try catch into an expression
const attempt = (action, fix) => {
  try {
    return action()
  } catch (err) {
    return fix(err)
  }
}

const SyncResolved = x =>
  x && x.then
    ? x
    : {
        then: fn => attempt(() => SyncResolved(fn(x)), SyncRejected),
        unthen: () => x
      }

const SyncRejected = err =>
  err && err.then
    ? err.then(SyncRejected)
    : {
        then: (_, fn) =>
          attempt(
            () => (fn ? SyncResolved(fn(err)) : SyncRejected(err)),
            SyncRejected
          ),
        unthen: () => {
          throw err
        }
      }

module.exports = {
  resolve: x => SyncResolved(x),
  reject: err => SyncRejected(err)
}
