'use strict'

import fs from 'fs'
import map from 'map-stream'
import inquirer from 'inquirer'
import chalk from 'chalk'

const question = (pkg) => ({
  type: 'confirm',
  name: pkg.name,
  semver: pkg.semver,
  group: pkg.group,
  message: `Package ${chalk.green(`${pkg.name} (${pkg.semver})`)} already exists in ${chalk.blue(`${pkg.group}`)}.
  package.json has semver ${chalk.green(`${pkg.existingSemver}`)}, overwrite?`
})

const pkgJsonWrite = fs.createWriteStream('./package.json', { flags: 'r+' })

const pkgJsonRead = fs.createReadStream('./package.json').pipe(map((pkgJson, pkgCb) => {
  pkgJson = JSON.parse(pkgJson.toString())

  let {
    dependencies: outDeps = {},
    devDependencies: outDevDeps = {}
  } = pkgJson

  const bowerJsonRead = fs.createReadStream('./bower.json').pipe(map((bowerJson, bowerCb) => {
    const { devDependencies = {}, dependencies = {} } = JSON.parse(bowerJson.toString())
    let qs = []

    for (let pkg in dependencies) {
      if (outDeps[pkg]) {
        qs.push(question({
          name: pkg,
          group: 'dependencies',
          semver: dependencies[pkg],
          existingSemver: outDeps[pkg]
        }))
      } else {
        outDeps[pkg] = dependencies[pkg]
      }
    }

    for (let pkg in devDependencies) {
      if (outDevDeps[pkg]) {
        qs.push(question({
          name: pkg,
          group: 'devDependencies',
          semver: devDependencies[pkg],
          existingSemver: outDevDeps[pkg]
        }))
      } else {
        outDevDeps[pkg] = devDependencies[pkg]
      }
    }

    // confirm overwriting duplicates
    inquirer.prompt(qs, (answers) => {
      qs.forEach((dupe) => {
        if (answers[dupe.name]) {
          const isDep = dupe.group === 'dependencies'
          const { name, semver } = dupe
          isDep ? outDeps[name] = semver : outDevDeps[name] = semver
        }
      })

      let newPkg = pkgJson

      bowerCb()
      pkgCb(null, JSON.stringify(newPkg, null, 2))
    })

  }))
})).pipe(pkgJsonWrite)
