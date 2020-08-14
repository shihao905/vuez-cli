#!/usr/bin/env node

const program = require('commander')
const create = require('../build/create')

program
  .version(require('../package.json').version, '-v, --version')

program
  .command('create <app-name>')
  .description('create a new project by vuez-cli')
  .action((appName) => {
    create(appName)
  })

program.parse(process.argv)
