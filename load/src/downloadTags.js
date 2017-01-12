'use strict';
var request = require('request');

module.exports = function(done) {
  var request = require('request');
  request('https://s3.amazonaws.com/tofix/osmEditReport/tags.json', function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var tags = JSON.parse(body);
      done(tags);
    } else {
      done(false);
    }
  });
};