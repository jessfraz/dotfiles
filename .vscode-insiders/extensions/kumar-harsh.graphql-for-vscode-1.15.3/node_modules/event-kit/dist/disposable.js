"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// Essential: A handle to a resource that can be disposed. For example,
// {Emitter::on} returns disposables representing subscriptions.
module.exports =
/*#__PURE__*/
function () {
  _createClass(Disposable, null, [{
    key: "isDisposable",
    // Public: Ensure that `object` correctly implements the `Disposable`
    // contract.
    //
    // * `object` An {Object} you want to perform the check against.
    //
    // Returns a {Boolean} indicating whether `object` is a valid `Disposable`.
    value: function isDisposable(object) {
      return typeof (object != null ? object.dispose : undefined) === "function";
    }
    /*
    Section: Construction and Destruction
    */
    // Public: Construct a Disposable
    //
    // * `disposalAction` A {Function} to call when {::dispose} is called for the
    //   first time.

  }]);

  function Disposable(disposalAction) {
    _classCallCheck(this, Disposable);

    this.disposed = false;
    this.disposalAction = disposalAction;
  } // Public: Perform the disposal action, indicating that the resource associated
  // with this disposable is no longer needed.
  //
  // You can call this method more than once, but the disposal action will only
  // be performed the first time.


  _createClass(Disposable, [{
    key: "dispose",
    value: function dispose() {
      if (!this.disposed) {
        this.disposed = true;

        if (typeof this.disposalAction === "function") {
          this.disposalAction();
        }

        this.disposalAction = null;
      }
    }
  }]);

  return Disposable;
}();