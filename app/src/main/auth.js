const apiRequests = require('superagent')
const {URLS,TIMEOUTS} = require('../../app.config')
const {ONENOTE} = require('../../onenote.config')
const storage = require('./store')

function requestOneNoteToken (options) {
  return new Promise((resolve, reject) => {
    apiRequests
			.post(URLS.OAUTH_TOKEN, options)
            .timeout(TIMEOUTS)
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.then(function (response) {
        if (response && response.ok) {
					// Success - Received Token.
					// TODO: use spread in update
          const {body} = response
          const onenote = {
            token_type: body.token_type,
            expires_in: body.expires_in,
            scope: body.scope,
            access_token: body.access_token,
            refresh_token: body.refresh_token,
            user_id: body.user_id,
            datestamp: Date.now()
          }
          // debugger
          storage.setItem('onenote', onenote)
          resolve()
        }
        else {
          console.log(options.grant_type, response)
          reject(response)
        }
      })
			.catch(function (err) {
        console.log(options.grant_type, err)
        reject(err)
      })
    })
}

/**
 *
 */
function refreshOneNoteToken () {
  return new Promise((resolve, reject) => {
    if (isTokenExpired() === true) {
      const {datestamp, expires_in, refresh_token} = storage.getItem('onenote')
      requestOneNoteToken({
        grant_type: 'refresh_token',
        client_id: ONENOTE.client_id,
        client_secret: ONENOTE.client_secret,
        redirect_uri: ONENOTE.redirect_uri,
        refresh_token: refresh_token
      })
      .then(() => {
        resolve()
      })
      .catch(() => {
        reject()
      })
    }
    else {
      resolve()
    }
  })
}


/**
 * - Delete any cached access tokens or refresh tokens you've received or stored.
 * - Perform any sign out actions in your application (for example, cleaning up local state, removing any cached items, etc.).
 * - Make a call to the authorization service using this URL:
 *
 * @returns {type} Description
 */
function logout () {
  storage.removeItem('onenote')
  storage.removeItem('onenote_section_id')

  apiRequests
    .get(`${URLS.LOGOUT}`, {
      client_id: ONENOTE.client_id,
      redirect_uri: ONENOTE.redirect_uri
    })
    .timeout(TIMEOUTS)
    .then(function (response) {
      if (response && response.ok) {
        console.log('Logged out?', response.ok)
      }
      else {
        console.log(response)
      }
    })
    .catch(function (err) {
      console.log(err)
    })
}

function isTokenExpired () {
  if (storage.getItem('onenote') === null) {
    return true
  }
  else {
    const {datestamp, expires_in} = storage.getItem('onenote')
    if (Date.now() - parseInt(datestamp) > expires_in) {
      return true
    }
  }
  return false
}

function hasAccessToken () {
  if (storage.getItem('onenote') === null) {
    return false
  }
  else {
    const {access_token} = storage.getItem('onenote')

    if (access_token === undefined || null || '') {
      return false
    }
  }
  return true
}

function toggleLogon (bool) {
  return !bool
}

module.exports = {
  requestOneNoteToken: requestOneNoteToken,
  refreshOneNoteToken: refreshOneNoteToken,
  toggleLogon: toggleLogon,
  isTokenExpired: isTokenExpired,
  hasAccessToken: hasAccessToken,
  logout: logout
}
