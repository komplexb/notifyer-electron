'use strict'

const path = require('path')

let config = {
  // Name of electron app
  // Will be used in production builds
  name: 'Notifyer',

  // Use ESLint (extends `airbnb`)
  // Further changes can be made in `.eslintrc.js`
  eslint: true,

  // webpack-dev-server port
  port: 9080,

  // electron-packager options
  // Docs: https://simulatedgreg.gitbooks.io/electron-vue/content/docs/building_your_app.html
  building: {
    arch: 'x64',
    asar: true,
    dir: path.join(__dirname, 'app'),
    icon: path.join(__dirname, 'app/icons/icon'),
    // ignore: /\b(node_modules|src|index\.ejs|icons)\b/,
    ignore: /\b(node_modules\/(?!moment|electron-is-dev|electron-is|electron-log|nteract|node-schedule|long-timeout|cron-parser|node-persist|q|mkdirp|semver).*|index\.ejs|icons)\b/,
    out: path.join(__dirname, 'builds'),
    overwrite: true,
    platform: process.env.PLATFORM_TARGET || 'all',
    win32metadata: {
      CompanyName: 'Byron Buckley',
      FileDescription: 'Notifyer Desktop',
      ProductName: 'Notifyer'
    }
  }
}

config.building.name = config.name

module.exports = config
