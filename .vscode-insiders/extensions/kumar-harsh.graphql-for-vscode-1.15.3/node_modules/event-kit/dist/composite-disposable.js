"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CompositeDisposable;
var Disposable; // Essential: An object that aggregates multiple {Disposable} instances together
// into a single disposable, so they can all be disposed as a group.
//
// These are very useful when subscribing to multiple events.
//
// ## Examples
//
// ```js
// const {CompositeDisposable} = require('atom')
//
// class Something {
//   constructor() {
//     this.disposables = new CompositeDisposable()
//     const editor = atom.workspace.getActiveTextEditor()
//     this.disposables.add(editor.onDidChange(() => {})
//     this.disposables.add(editor.onDidChangePath(() => {})
//   }
//
//   destroy() {
//     this.disposables.dispose();
//   }
// }
// ```

module.exports =
/*#__PURE__*/
function () {
  /*
  Section: Construction and Destruction
  */
  // Public: Construct an instance, optionally with one or more disposables
  function CompositeDisposable() {
    _classCallCheck(this, CompositeDisposable);

    this.disposed = false;
    this.disposables = new Set();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = arguments[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var disposable = _step.value;
        this.add(disposable);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  } // Public: Dispose all disposables added to this composite disposable.
  //
  // If this object has already been disposed, this method has no effect.


  _createClass(CompositeDisposable, [{
    key: "dispose",
    value: function dispose() {
      if (!this.disposed) {
        this.disposed = true;
        this.disposables.forEach(function (disposable) {
          return disposable.dispose();
        });
        this.disposables = null;
      }
    }
    /*
    Section: Managing Disposables
    */
    // Public: Add disposables to be disposed when the composite is disposed.
    //
    // If this object has already been disposed, this method has no effect.
    //
    // * `...disposables` {Disposable} instances or any objects with `.dispose()`
    //   methods.

  }, {
    key: "add",
    value: function add() {
      if (!this.disposed) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = arguments[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var disposable = _step2.value;
            assertDisposable(disposable);
            this.disposables.add(disposable);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
    } // Public: Remove a previously added disposable.
    //
    // * `disposable` {Disposable} instance or any object with a `.dispose()`
    //   method.

  }, {
    key: "remove",
    value: function remove(disposable) {
      if (!this.disposed) {
        this.disposables.delete(disposable);
      }
    } // Public: Alias to {CompositeDisposable::remove}

  }, {
    key: "delete",
    value: function _delete(disposable) {
      this.remove(disposable);
    } // Public: Clear all disposables. They will not be disposed by the next call
    // to dispose.

  }, {
    key: "clear",
    value: function clear() {
      if (!this.disposed) {
        this.disposables.clear();
      }
    }
  }]);

  return CompositeDisposable;
}();

function assertDisposable(disposable) {
  if (Disposable == null) {
    Disposable = require("./disposable");
  }

  if (!Disposable.isDisposable(disposable)) {
    throw new TypeError("Arguments to CompositeDisposable.add must have a .dispose() method");
  }
}