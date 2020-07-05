'use strict';

var util = require('./util');

function getConfigLocation() {
    return util.configLocation;
}

module.exports = {
  getConfigLocation,
};
