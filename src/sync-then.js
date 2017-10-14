/**
 * This module gives us a synchronous version of a 
 */

// helper to turn try catch into a function
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
