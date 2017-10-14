# boxie

A tiny tool for synchronous and asynchronous functional programming.

## Why?
Because doing async properly, handling errors, and dealing with null is hard but doesn't need to be.

By adopting some powerful ideas from old school CompSci and wrapping it with a trivial API, you get to deal with that complexity like a grown up.

## What
Boxie provides synchronous and asynchronous wrappers around immutable values so that you can work with them without losing your mind, even when they're not behaving.

As an example take this brittle piece of code:

```js
const readFile = require('util').promisify(require('fs').readFile)

function loadAuthorPosts(postsPath, authorName) {
  return Promise.all([
    lookupAuthorId(authorName) // defined elsewhere,
    readFile(postsPath, 'utf-8').then(JSON.parse)
  ])
  .then(([authorId, posts]) => posts.filter(p => p.authorId === authorId))
  .catch(err => [])
}

loadAuthorPosts('all-posts.json', 'Allain')
  .then(console.log)
```

It will fail for at least these reasons:

1. The file does not exist or is not readable
1. The file contains malformed JSON
1. lookupAuthorId returns null

The fact that it's written using promises helps a bit; it will swallow the first few errors and return an array.

The 3rd failure is more subtle since it's not a hard failure. No exception or rejection occurs, and conceivably if some posts are anonymous they might have null authorIds and be incorreectly attributed to Allain.

Using Box to write the same piece of code:

```js
const Box = require('boxie')
const readFile = require('util').promisify(require('fs').readFile)

function loadAuthorPosts(postsPath, authorName) {
  return Box.all([
    lookupAuthorId(authorName),
    AsyncBox(readFile(postsPath, 'utf-8')).map(JSON.parse)
  ]).map(([posts, authorId]) => 
    posts => posts.filter(p => p.authorId === authorId)
  )(err => {
    console.error(err) // err is empty if box 
    return []
  })
}

loadAuthorPosts('all-posts.json', 'Allain')
  .then(console.log)
```
If you're hunting for the difference, it's subtle: instead of a catch call, it invokes the Box with a handler function. If something went wrong (an empty box, or an error while processing), the handler will be called with the content of the box (an Error, null, or undefined).

## Asynchronous Usage
Box can be used asynchronously by placing Promises in them. When the box is opened (by invoking it), it returns a promise.

```js
const result = Box(Promise.resolve(1)).map(x => x * 2).map(x => x * 3)()

// result is a promise so use it like one
result.then(console.log, console.error) // logs 6 to stdout
```

## Synchronous Usage
Box intelligently recognizes when it's doing things synchrnously. If a box does not contain a Promise or is not derived from a box that does, it's a synchronous box.

When synchronous boxes are unboxed, they return their contents, instead of Promise.

For example:
```js
const result = Box(1).map(x => x * 2).map(x => x * 3)()

// because no step of the computation involved Promises, when the box is opened (by invoking it), it returns 6
console.log(result)
```
## API

### `Box(value)`
Box is a factory function which returns box instances wrapping the value they are passed.

Examples:
```js
// synchrnous box containing 1 
Box(1) 

// Async box containing 1
Box(Promise.resolve(1)) 

// Synchronous empty box
Box(null)

// Synchronous error box
Box(new Error('huh?'))

// Async error box:
Box(Promise.reject(new Error('error')))
```

### `Box.map(fn, handler)`
If the box is not empty and is not an error box, `Box.map` applies the function `fn` to its content and then wraps it in a new box.

```js
// synchronous Box containing 3
Box(1).map(n => n + 2)

// Async box containing 3 
Box(1).map(n => Promise.resolve(n + 2)) 
Box(Promise.resolve(1)).map(n => n + 2) 

// A box containing an error
Box(1).map(n => { throw new Error('test') })

// An empty box
Box(1).map(n => null)
```

When the box is an error box `fn` is not called, and handler can be used to fix the error:

```js
// intercepts the error and returns a new box containing 100
Box(new Error('error'))
  .map(x => alert('?'))  // not called
  .map(null, err => 100) // fixes the error
```

Similarly if the box is empty, handler performs the same role, it creates a new box with the handler function or value:
```js
Box().map(null, x => 100) // a new box with 100 in it
Box().map(null, 200)      // a new box with 200 in it
```

### `box()` - Unboxing
A box can be unboxed by invoking it like so:

```js
Box(100)() // 100
Box(Promise.resolve(100))() // Promise resolving to 100
```

In the case of empty boxes if a handler is passed it will be used to fill the box:

```js
// Empty boxes
Box()()          // throws Error('cannot open empty box')
Box()(() => 100) // 100
Box()(100)       // 100 
Box(Promise.resolve())(() => 100) // Promise resolving to 100
Box(Promise.resolve(null))(100)   // Promise resolving to 100
```

When the box is an error box the handler can be used to fix the error:
```js
// Error Boxes
Box(new Error('error'))()    // throws Error('error') 

Box(new Error('error'))(100)       // 100
Box(new Error('error'))(() => 100) // 100

const asyncErr = Box(Promise.reject('huh'))
acyncErr()       // rejecting promise
asyncErr(100)    // resolves to 100
asyncErr((err) => `${err}!`)  // resolves to huh!
```

### `Box.all([...])`
Creates a box that contains the results of all of the boxes it's passed:

```js
// Synchronous Usage
Box.all([
  Box(1), Box(2)
])() // returns [1, 2]

// Asynchronous Usage
Box.all([
  Box(Promise.resolve(1)), 
  Box(Promise.resolve(2))
])() // Promise resolving to [1, 2]

// Mixed Usage. It knows that it must be asynchronous
Box.all([
  Box(Promise.resolve(1)), 
  Box(2)
])() // Promise resolving to [1, 2]
