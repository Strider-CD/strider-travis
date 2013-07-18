
var fs = require('fs')
  , path = require('path');

require('js-yaml');
var TRAVIS_YML = '.travis.yml';

var runScript = function(ctx, phase, script, cb) {
  if (typeof(script) === 'string') {
    return runCmd(ctx, phase, script, cb);
  }
  // assume it's a list of shell commands
  var next = function (i) {
    runCmd(ctx, phase, script[i], function (exitCode) {
      if (exitCode !== 0 || i + 1 >= script.length) return cb(exitCode);
      next(i + 1);
    });
  };
  next(0);
};

var runCmd = function(ctx, phase, cmd, cb){
  var sh = ctx.shellWrap(cmd);
  ctx.forkProc(ctx.workingDir, sh.cmd, sh.args, function(exitCode) {
    if (exitCode !== 0) {
      ctx.striderMessage("Custom " + phase + " command `" +
                         cmd + "` failed with exit code " + exitCode);
      return cb(exitCode);
    }
    return cb(0);
  });
};

module.exports = function (ctx, cb) {

  ctx.addDetectionRule({
    filename:TRAVIS_YML,
    exists: true,
    language: 'travis',
    framework: null,
    prepare:function (ctx, cb) {
      var config;
      try {
        config = require(path.join(ctx.workingDir, TRAVIS_YML));
      } catch (e) {
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
      if (!ctx.travisConfig || !ctx.travisConfig.script) return cb(0);
      runScript(ctx, 'test', ctx.travisConfig.script, cb);
    }
  });
};
