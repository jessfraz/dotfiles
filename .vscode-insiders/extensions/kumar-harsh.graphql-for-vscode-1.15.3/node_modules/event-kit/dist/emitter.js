"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Disposable = require("./disposable");

var CompositeDisposable = require("./composite-disposable"); // Essential: Utility class to be used when implementing event-based APIs that
// allows for handlers registered via `::on` to be invoked with calls to
// `::emit`. Instances of this class are intended to be used internally by
// classes that expose an event-based API.
//
// For example:
//
// ```js
// class User {
//   constructor() {
//     this.emitter = new Emitter()
//   }
//
//   onDidChangeName(callback) {
//     this.emitter.on('did-change-name', callback)
//   }
//
//   setName(name) {
//     if (name !== this.name) {
//       this.name = name
//       this.emitter.emit('did-change-name', name)
//     }
//
//     return this.name
//   }
// }
// ```


var Emitter =
/*#__PURE__*/
function () {
  _createClass(Emitter, null, [{
    key: "onEventHandlerException",
    value: function onEventHandlerException(exceptionHandler) {
      var _this = this;

      if (this.exceptionHandlers.length === 0) {
        this.dispatch = this.exceptionHandlingDispatch;
      }

      this.exceptionHandlers.push(exceptionHandler);
      return new Disposable(function () {
        _this.exceptionHandlers.splice(_this.exceptionHandlers.indexOf(exceptionHandler), 1);

        if (_this.exceptionHandlers.length === 0) {
          return _this.dispatch = _this.simpleDispatch;
        }
      });
    }
  }, {
    key: "simpleDispatch",
    value: function simpleDispatch(handler, value) {
      return handler(value);
    }
  }, {
    key: "exceptionHandlingDispatch",
    value: function exceptionHandlingDispatch(handler, value) {
      try {
        return handler(value);
      } catch (exception) {
        return this.exceptionHandlers.map(function (exceptionHandler) {
          return exceptionHandler(exception);
        });
      }
    }
    /*
    Section: Construction and Destruction
    */
    // Public: Construct an emitter.
    //
    // ```js
    // this.emitter = new Emitter()
    // ```

  }]);

  function Emitter() {
    _classCallCheck(this, Emitter);

    this.disposed = false;
    this.clear();
  } // Public: Clear out any existing subscribers.


  _createClass(Emitter, [{
    key: "clear",
    value: function clear() {
      if (this.subscriptions != null) {
        this.subscriptions.dispose();
      }

      this.subscriptions = new CompositeDisposable();
      this.handlersByEventName = {};
    } // Public: Unsubscribe all handlers.

  }, {
    key: "dispose",
    value: function dispose() {
      this.subscriptions.dispose();
      this.handlersByEventName = null;
      this.disposed = true;
    }
    /*
    Section: Event Subscription
    */
    // Public: Register the given handler function to be invoked whenever events by
    // the given name are emitted via {::emit}.
    //
    // * `eventName` {String} naming the event that you want to invoke the handler
    //   when emitted.
    // * `handler` {Function} to invoke when {::emit} is called with the given
    //   event name.
    //
    // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.

  }, {
    key: "on",
    value: function on(eventName, handler, unshift) {
      var _this2 = this;

      if (unshift == null) {
        unshift = false;
      }

      if (this.disposed) {
        throw new Error("Emitter has been disposed");
      }

      if (typeof handler !== "function") {
        throw new Error("Handler must be a function");
      }

      var currentHandlers = this.handlersByEventName[eventName];

      if (currentHandlers) {
        if (unshift) {
          this.handlersByEventName[eventName].unshift(handler);
        } else {
          this.handlersByEventName[eventName].push(handler);
        }
      } else {
        this.handlersByEventName[eventName] = [handler];
      } // When the emitter is disposed, we want to dispose of all subscriptions.
      // However, we also need to stop tracking disposables when they're disposed
      // from outside, otherwise this class will hold references to all the
      // disposables it created (instead of just the active ones).


      var cleanup = new Disposable(function () {
        _this2.subscriptions.remove(cleanup);

        return _this2.off(eventName, handler);
      });
      this.subscriptions.add(cleanup);
      return cleanup;
    } // Public: Register the given handler function to be invoked the next time an
    // events with the given name is emitted via {::emit}.
    //
    // * `eventName` {String} naming the event that you want to invoke the handler
    //   when emitted.
    // * `handler` {Function} to invoke when {::emit} is called with the given
    //   event name.
    //
    // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.

  }, {
    key: "once",
    value: function once(eventName, handler, unshift) {
      if (unshift == null) {
        unshift = false;
      }

      var wrapped = function wrapped(value) {
        disposable.dispose();
        return handler(value);
      };

      var disposable = this.on(eventName, wrapped, unshift);
      return disposable;
    } // Public: Register the given handler function to be invoked *before* all
    // other handlers existing at the time of subscription whenever events by the
    // given name are emitted via {::emit}.
    //
    // Use this method when you need to be the first to handle a given event. This
    // could be required when a data structure in a parent object needs to be
    // updated before third-party event handlers registered on a child object via a
    // public API are invoked. Your handler could itself be preempted via
    // subsequent calls to this method, but this can be controlled by keeping
    // methods based on `::preempt` private.
    //
    // * `eventName` {String} naming the event that you want to invoke the handler
    //   when emitted.
    // * `handler` {Function} to invoke when {::emit} is called with the given
    //   event name.
    //
    // Returns a {Disposable} on which `.dispose()` can be called to unsubscribe.

  }, {
    key: "preempt",
    value: function preempt(eventName, handler) {
      return this.on(eventName, handler, true);
    } // Private: Used by the disposable.

  }, {
    key: "off",
    value: function off(eventName, handlerToRemove) {
      if (this.disposed) {
        return;
      }

      var handlers = this.handlersByEventName[eventName];

      if (handlers) {
        var handlerIndex = handlers.indexOf(handlerToRemove);

        if (handlerIndex >= 0) {
          handlers.splice(handlerIndex, 1);
        }

        if (handlers.length === 0) {
          delete this.handlersByEventName[eventName];
        }
      }
    }
    /*
    Section: Event Emission
    */
    // Public: Invoke handlers registered via {::on} for the given event name.
    //
    // * `eventName` The name of the event to emit. Handlers registered with {::on}
    //   for the same name will be invoked.
    // * `value` Callbacks will be invoked with this value as an argument.

  }, {
    key: "emit",
    value: function emit(eventName, value) {
      var handlers = this.handlersByEventName && this.handlersByEventName[eventName];

      if (handlers) {
        // create a copy of `handlers` so that if any handler mutates `handlers`
        // (e.g. by calling `on` on this same emitter), this does not result in
        // changing the handlers being called during this same `emit`.
        var handlersCopy = handlers.slice();

        for (var i = 0; i < handlersCopy.length; i++) {
          this.constructor.dispatch(handlersCopy[i], value);
        }
      }
    }
  }, {
    key: "emitAsync",
    value: function emitAsync(eventName, value) {
      var _this3 = this;

      var handlers = this.handlersByEventName && this.handlersByEventName[eventName];

      if (handlers) {
        var promises = handlers.map(function (handler) {
          return _this3.constructor.dispatch(handler, value);
        });
        return Promise.all(promises).then(function () {});
      }

      return Promise.resolve();
    }
  }, {
    key: "getEventNames",
    value: function getEventNames() {
      return Object.keys(this.handlersByEventName);
    }
  }, {
    key: "listenerCountForEventName",
    value: function listenerCountForEventName(eventName) {
      var handlers = this.handlersByEventName[eventName];
      return handlers == null ? 0 : handlers.length;
    }
  }, {
    key: "getTotalListenerCount",
    value: function getTotalListenerCount() {
      var result = 0;

      var _arr = Object.keys(this.handlersByEventName);

      for (var _i = 0; _i < _arr.length; _i++) {
        var eventName = _arr[_i];
        result += this.handlersByEventName[eventName].length;
      }

      return result;
    }
  }]);

  return Emitter;
}();

Emitter.dispatch = Emitter.simpleDispatch;
Emitter.exceptionHandlers = [];
module.exports = Emitter;