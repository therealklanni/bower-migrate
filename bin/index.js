#!/usr/bin/env node
'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mapStream = require('map-stream');

var _mapStream2 = _interopRequireDefault(_mapStream);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var question = function question(pkg) {
  return {
    type: 'confirm',
    name: pkg.name,
    semver: pkg.semver,
    group: pkg.group,
    message: 'Package ' + _chalk2['default'].green(pkg.name + ' (' + pkg.semver + ')') + ' already exists in ' + _chalk2['default'].blue('' + pkg.group) + '.\n  package.json has semver ' + _chalk2['default'].green('' + pkg.existingSemver) + ', overwrite?'
  };
};

var pkgJsonWrite = _fs2['default'].createWriteStream('./package.json', { flags: 'r+' });

var pkgJsonRead = _fs2['default'].createReadStream('./package.json').pipe((0, _mapStream2['default'])(function (pkgJson, pkgCb) {
  pkgJson = JSON.parse(pkgJson.toString());

  var _pkgJson$dependencies = pkgJson.dependencies;
  var outDeps = _pkgJson$dependencies === undefined ? {} : _pkgJson$dependencies;
  var _pkgJson$devDependencies = pkgJson.devDependencies;
  var outDevDeps = _pkgJson$devDependencies === undefined ? {} : _pkgJson$devDependencies;

  var bowerJsonRead = _fs2['default'].createReadStream('./bower.json').pipe((0, _mapStream2['default'])(function (bowerJson, bowerCb) {
    var _JSON$parse = JSON.parse(bowerJson.toString());

    var _JSON$parse$devDependencies = _JSON$parse.devDependencies;
    var devDependencies = _JSON$parse$devDependencies === undefined ? {} : _JSON$parse$devDependencies;
    var _JSON$parse$dependencies = _JSON$parse.dependencies;
    var dependencies = _JSON$parse$dependencies === undefined ? {} : _JSON$parse$dependencies;

    var qs = [];

    for (var pkg in dependencies) {
      if (outDeps[pkg]) {
        qs.push(question({
          name: pkg,
          group: 'dependencies',
          semver: dependencies[pkg],
          existingSemver: outDeps[pkg]
        }));
      } else {
        outDeps[pkg] = dependencies[pkg];
      }
    }

    for (var pkg in devDependencies) {
      if (outDevDeps[pkg]) {
        qs.push(question({
          name: pkg,
          group: 'devDependencies',
          semver: devDependencies[pkg],
          existingSemver: outDevDeps[pkg]
        }));
      } else {
        outDevDeps[pkg] = devDependencies[pkg];
      }
    }

    // confirm overwriting duplicates
    _inquirer2['default'].prompt(qs, function (answers) {
      qs.forEach(function (dupe) {
        if (answers[dupe.name]) {
          var isDep = dupe.group === 'dependencies';
          var _name = dupe.name;
          var semver = dupe.semver;

          isDep ? outDeps[_name] = semver : outDevDeps[_name] = semver;
        }
      });

      var newPkg = pkgJson;

      bowerCb();
      pkgCb(null, JSON.stringify(newPkg, null, 2));
    });
  }));
})).pipe(pkgJsonWrite);

