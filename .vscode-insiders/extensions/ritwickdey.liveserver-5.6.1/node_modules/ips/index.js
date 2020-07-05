// ips - Get local, docker and public IP addresses - Copyright (C) 2015 by yieme - All Rights Reserved - License: MIT

;(function() {
  'use strict';

  var ipify      = require('ipify')
    , internalIp = require('internal-ip')
    , ipRegex    = require('ip-regex')

  function dockerip() {
    var host   = process.env.DOCKER_HOST || ''
      , domain = host.split('://')[1]
      , ip     = (domain) ? domain.split(':')[0] : undefined
    return ip
  }

  var Ips = function(cb) {
    var ips = {
        local: internalIp()
      }
      , docker = dockerip()

    if (docker) ips.docker = docker

    if (cb) {
      ipify(function (err, ip) {
        var isIPv4 = ipRegex({exact: true}).test(ip)
          , isIPv6 = ipRegex.v6({exact: true}).test(ip)
        if (!err) {
          if (isIPv4 || isIPv6) ips.public = ip // only assign if a valid ip address returned
        }
        cb(err, ips)
      })
    }
    return ips
  }



  if (typeof exports === 'object') module.exports = Ips // support CommonJS
  // else if (typeof define === 'function' && define.amd) define(function() { return Ips }) // support AMD
  // else this.Ips = Ips // support browser
})();
