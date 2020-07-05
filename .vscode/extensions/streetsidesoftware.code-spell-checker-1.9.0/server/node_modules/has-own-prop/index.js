'use strict';
const hasOwnProp = Object.prototype.hasOwnProperty;

module.exports = (object, property) => hasOwnProp.call(object, property);
