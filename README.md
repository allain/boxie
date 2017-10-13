# boxie

A tiny tool for synchronous and asynchronous functional programming.

**Note:** None of the ideas used to make this tool are my own, I'm just trying to combine them in a way that has the smallest possible API. It's Maybe monads + some other niceties.

## Idea

The basic unit of boxie is an immutable Box.

Boxes can be Full Boxes, Empty Boxes, or Error Boxes. Once they are created they can never change.

```js
const fullBox = Box('hello')
const emptyBox = Box() // or Box(null)
const errorBox = Box.error(new Error('Huh?'))
```

To access the value in the box, you invoke it like so:
```js
helloBox() // returns 'hello'
emptyBox() // throws Error('cannot open empty box')
errorBox() // throws Error('Huh?')
```

Notice that empty boxes and error boxes don't bahave too well. We can pass a filler function, or a value when invoking the box to fix this:

```js
emptyBox('roomy') // 'roomy'
errorBox(err => `ignoring: ${err.message}`) // 'ignoring: Huh?'
```
Boxes can be asked to create new boxes by invoking their one and only method (`map`):

```js
const box2 = Box(1).map(n => n * 2) // A box containing 2
```

Since `map` returns a box, it can be invoked in a chain like so:
```js
const result = Box(1)
               .map(n => n * 2)
               .map(n => n * 3)
               .map(n => n + 1)
console.log(result()) // 7
```

## Hell Breaking Loose

Now, the real power of Boxie is what happens when things go off the rails. Consider the following code that computes a person's full name given a person object:

```js
Box(person)
  .map(p => p.first + ' ' + p.last)
  () // returns the person's full name
```

If by some blue smoke magic the person is null, the code will throw a **cannot open empty box** error.

If we wanted to handle it differently, by returning null. We could tell it so explicitly, by giving it a value (as below) or by giving it a function that computes a value.

```js
Box(loadPerson())
  .map(p => p.first + ' ' + p.last)
  (null)  // returns null 
```
**The important thing** is that the [happy path](https://en.wikipedia.org/wiki/Happy_path) didn't get polluted with null checks or any conditional logic.

### Errors
Additionally consider the code below. It will fail to extract a province and will throw a **Cannot read property 'province' of undefined** error.

```js
function extractProvince(account) {
  return account.contact.address.province
}

console.log(extractProvince({contact: {name: 'Allain'}}))
```

This can be resolved by using a Box like so:

```js
function extractProvince(account) {
  return Box(account)
    .map(a => a.contact.address.province)
    (err => null) // or (null)
}
console.log(extractProvince({contact: {name: 'Allain'}})) // null
```

### Empty and Error box handling while mapping

As a convenience, the `map` method accepts a second parameter. Empty and Error boxes will be use to fill a new box instead of operating on the current one.

For example:

```js
// Error handling
Box.error(new Error('hello'))
  .map(null, err => err.message) // a handler
  .map(x => x + ' world')
  () // 'hello world'

// Empty handling
Box()
  .map(null, 'hello') // a value
  .map(x => x + ' world')
  () // hello world
```

## AsyncBox
An AsyncBox is just like a normal Box, except that when opened it returns a Promise.

It can be used exactly like a normal Box, and follows the same rules:

```js
let result = AsyncBox(fetch('https://jsonplaceholder.typicode.com/posts'))
  .map(r => r.json())
  .map(posts => posts.filter(p => p.id % 2))
  .map(posts => posts.map(p => p.title))
  (err => []) // generate promise that even on failure returns an array

result.then(console.log) // list of titles of odd posts
```

It can accept promises or simple values when building boxes.
