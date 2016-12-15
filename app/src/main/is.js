/**
 * Webpack & electron-is (https://www.npmjs.com/package/electron-is) couldnt agree
 * so just do this
 */
const os = require('os')

function dev () {
  return process.env.NODE_ENV === 'development'
}

function osx () {
  return os.type() === 'Darwin'
}

module.exports = {
  dev: dev,
  osx: osx
}
