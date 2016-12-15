const URLS = {
  OAUTH_AUTHORIZE: 'https://login.live.com/oauth20_authorize.srf',
  OAUTH_TOKEN: 'https://login.live.com/oauth20_token.srf',
  LOGOUT: 'https://login.live.com/oauth20_logout.srf',
  SHARE: 'https://www.onenote.com/api/v1.0/me/notes/pages',
  SECTION: 'https://www.onenote.com/api/v1.0/me/notes/sections/',
  THUMBNAIL: './static/images/placeholder/image.png',
  SETTINGS: 'notifyer-settings'
}

const WINDOW = {
  height: 510,
  width: 318
}

const TIMEOUTS = {
  response: 10000,  // Wait 10 seconds for the server to start sending,
  deadline: 60000 // but allow 1 minute for the file to finish loading.
}

const DEFAULT_SETTINGS = new Map([
  ['sectionName', 'Quotes'],
  ['schedule', 9],
  ['openWith', 'Browser'],
  ['shortcutKey', 'CmdOrCtrl+Alt+O']
])

module.exports = {
  URLS: URLS,
  WINDOW: WINDOW,
  TIMEOUTS: TIMEOUTS,
  DEFAULT_SETTINGS: DEFAULT_SETTINGS
}
