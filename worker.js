
var fs = require('fs')
  , path = require('path')
  , runScript = require('strider-custom').runScript;

require('js-yaml');
var TRAVIS_YML = '.travis.yml';

module.exports = function (ctx, cb) {

  ctx.addDetectionRule({
    filename:TRAVIS_YML,
    exists: true,
    language: 'travis',
    framework: null,
    prepare:function (ctx, cb) {
      console.log('travis', ctx.workingDir);
      try {
        var config = require(path.join(ctx.workingDir, TRAVIS_YML));
      } catch (e) {
        console.log('fail travis');
        cb(null);
      }
      ctx.travisConfig = config;
      var prepare = [];
      if (config.install) {
        runScript(ctx, 'prepare', config.install, function (err) {
          if (err) return cb(err);
          if (!config.before_script) return cb(0);
          runScript(ctx, 'prepare', config.before_script, cb);
        });
      } else if (config.before_script) {
        runScript(ctx, 'prepare', config.before_script, cb);
      } else {
        cb(0);
      }
    },
    test: function (ctx, cb) {
      if (!ctx.travisConfig || !ctx.travisConfig.script) return;
      runScript(ctx, 'test', ctx.travisConfig.script, cb);
    }
  });
}
