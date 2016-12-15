const os = require('os')

function dev() {
  return process.env.NODE_ENV === 'development'
}

function osx() {
  return os.type() === 'Darwin'
}

module.exports = {
  dev: dev,
  osx: osx
}
