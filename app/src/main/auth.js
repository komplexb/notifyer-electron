const apiRequests = require('superagent')
const {URLS, TIMEOUTS} = require('../../app.config')
const {ONENOTE} = require('../../onenote.config')
const storage = require('./store')

/**
 * Exchange the authorization code for an access token [and refresh token].
 * Send the following HTTP request with a properly encoded URL string in the message body.
 * https://msdn.microsoft.com/en-us/office/office365/howto/onenote-auth#code-flow
 *
 * @returns {Promise} Ensures the caller acts after response is received
 */
function requestOneNoteToken (postParams) {
  return new Promise((resolve, reject) => {
    apiRequests
    .post(URLS.OAUTH_TOKEN, postParams)
    .timeout(TIMEOUTS)
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .then(function (response) {
      if (response && response.ok) {
        // Success - Received Token.
        storage.setItem('onenote', { datestamp: Date.now(), ...response.body })
        resolve()
      } else {
        console.log(postParams.grant_type, response)
        reject(response)
      }
    })
    .catch(function (err) {
      console.log(postParams.grant_type, err)
      reject(err)
    })
  })
}

/**
 * Get a new access token after it expires (consumer apps)
 * Request a new access token by using the refresh token or
 * by repeating the auth process from the beginning.
 * When an access token expires, requests to the API return a 401 Unauthorized response.
 * https://msdn.microsoft.com/en-us/office/office365/howto/onenote-auth#code-flow
 *
 * @returns {Promise} Ensures the caller acts after response is received
 */
function refreshOneNoteToken () {
  return new Promise((resolve, reject) => {
    if (isTokenExpired() === true) {
      const {refresh_token} = storage.getItem('onenote')
      requestOneNoteToken({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        ...ONENOTE
      })
      .then(() => {
        resolve()
      })
      .catch(() => {
        reject()
      })
    } else {
      resolve()
    }
  })
}

/**
 * - Delete any cached access tokens or refresh tokens you've received or stored.
 * - Perform any sign out actions in your application
 * (for example, cleaning up local state, removing any cached items, etc.).
 * - Make a call to the authorization service
 *
 * https://msdn.microsoft.com/en-us/office/office365/howto/onenote-auth#code-flow
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
      } else {
        console.log(response)
      }
    })
    .catch(function (err) {
      console.log(err)
    })
}

/**
 * Primarily used by refreshOneNoteToken() to determine if a token is required
 * @returns {Boolean}
 */
function isTokenExpired () {
  if (storage.getItem('onenote') === null) {
    return true
  } else {
    const {datestamp, expires_in} = storage.getItem('onenote')
    if (Date.now() - parseInt(datestamp) > expires_in) {
      return true
    }
  }
  return false
}

/**
 * The app initiates the sign-in process by contacting the authorization service.
 * If authentication and authorization are successful,
 * you'll receive an access token that you include in your requests to the OneNote API.
 * Therefore the presence of a token generally indicates login state
 * https://msdn.microsoft.com/en-us/office/office365/howto/onenote-auth#code-flow
 *
 * @returns {boolean}
 */
function hasAccessToken () {
  if (storage.getItem('onenote') === null) {
    return false
  } else {
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
