# event-kit
[![OS X Build Status](https://travis-ci.org/atom/event-kit.svg?branch=master)](https://travis-ci.org/atom/event-kit) [![Windows Build Status](https://ci.appveyor.com/api/projects/status/lb32q70204lpmlxo/branch/master?svg=true)](https://ci.appveyor.com/project/Atom/event-kit/branch/master) [![Dependency Status](https://david-dm.org/atom/event-kit.svg)](https://david-dm.org/atom/event-kit)

This is a simple library for implementing event subscription APIs.

## Implementing Event Subscription APIs

```js
const {Emitter} = require('event-kit')

class User {
  constructor() {
    this.emitter = new Emitter()
  }

  onDidChangeName(callback) {
    this.emitter.on('did-change-name', callback)
  }

  setName(name) {
    if (name !== this.name) {
      this.name = name
      this.emitter.emit('did-change-name', name)
    }

    return this.name
  }

  destroy() {
    this.emitter.dispose()
  }
}
```

In the example above, we implement `::onDidChangeName` on the user object, which
will register callbacks to be invoked whenever the user's name changes. To do
so, we make use of an internal `Emitter` instance. We use `::on` to subscribe
the given callback in `::onDidChangeName`, and `::emit` in `::setName` to notify
subscribers. Finally, when the `User` instance is destroyed we call `::dispose`
on the emitter to unsubscribe all subscribers.

## Consuming Event Subscription APIs

`Emitter::on` returns a `Disposable` instance, which has a `::dispose` method.
To unsubscribe, simply call dispose on the returned object.

```js
const subscription = user.onDidChangeName((name) => console.log(`My name is ${name}`))
// Later, to unsubscribe...
subscription.dispose()
```

You can also use `CompositeDisposable` to combine disposable instances together.

```js
const {CompositeDisposable} = require('event-kit')

const subscriptions = new CompositeDisposable()
subscriptions.add(user1.onDidChangeName((name) => console.log(`User 1: ${name}`))
subscriptions.add(user2.onDidChangeName((name) => console.log(`User 2: ${name}`))

// Later, to unsubscribe from *both*...
subscriptions.dispose()
```

## Creating Your Own Disposables

Disposables are convenient ways to represent a resource you will no longer
need at some point. You can instantiate a disposable with an action to take when
no longer needed.

```js
const {Disposable} = require('event-kit')

const disposable = new Disposable(() => this.destroyResource())
```
