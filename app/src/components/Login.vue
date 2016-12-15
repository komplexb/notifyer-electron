<template lang="html">
  <div id="login">
    <br><br><br>
    <div class="ui middle aligned center aligned grid">
      <div class="column">
        <h1 class='ui header purple' title='Notifyer Beta'>Notifyer<sup>β</sup></h1>
        <h2 class="ui image header">
          <!-- <img src="assets/images/logo.png" class="image"> -->
          <div class="content">
            Log-in to your OneNote account
          </div>
        </h2>
        <button @click='handleLogin' class="ui purple button">
          <svg class="svgicon icon-blackenter"><use xlink:href="#icon-blackenter"></use></svg>
          Sign In
        </button>
        <br><br>
        <p>
          <a @click='showAbout'>About</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
  const {app, BrowserWindow, ipcMain, ipcRenderer} = require('electron').remote
  const path = require('path')
  const {URLS} = require('../../app.config')
  const {ONENOTE} = require('../../onenote.config')
  const {requestOneNoteToken, refreshOneNoteToken, hasAccessToken} = require('../main/auth')
  const {setNoteSection, getRandomNote} = require('../main/onenote')
  const storeSettings = require('node-persist')
  storeSettings.initSync({dir: path.join(app.getPath('userData'), URLS.SETTINGS)})

  let Login = {
    template: '#login',
    data: function () {
      return {

      }
    },

    methods: {
      showAbout: function () {
        $('#about').modal('show')
      },

      handleLogin: function () {
        if(hasAccessToken()) {
          this.onAuth()
          this.$emit('toggleLogon')
        }
        else {
          this.authOneNote()
        }
      },

      onAuth: function () {
        setNoteSection(storeSettings.getItemSync('sectionName'))
      },

      authOneNote: function () {
        // Build the OAuth consent page URL
        let authWindow = new BrowserWindow({
          width: 800,
          height: 600,
          show: false,
          'node-integration': false
        })

        let authUrl = `${URLS.OAUTH_AUTHORIZE}?response_type=code&client_id=${ONENOTE.client_id}&redirect_uri=${ONENOTE.redirect_uri}&scope=${ONENOTE.scopes.join(' ')}`
        authWindow.loadURL(authUrl)
        authWindow.once('ready-to-show', () => {
          authWindow.show()
        })

        let handleCallback = (url) => {
          var raw_code = /code=([^&]*)/.exec(url) || null
          var code = (raw_code && raw_code.length > 1) ? raw_code[1] : null
          var error = /\?error=(.+)$/.exec(url)

          if (code || error) {
              // Close the browser if code found or error
            this.$emit('toggleLogon')
            authWindow.destroy()
          }

            // If there is a code, proceed to get token
          if (code) {
            requestOneNoteToken({
              grant_type: 'authorization_code',
              code: code,
              client_id: ONENOTE.client_id,
              client_secret: ONENOTE.client_secret,
              redirect_uri: ONENOTE.redirect_uri
            })
      			.then(() => {
              this.onAuth()
              this.$emit('toggleLogon') // hide login, show main window
            })
            .catch(() => {
              /** TODO: update error state and display on login **/
            })
          }
          else if (error) {
            console.log('authOneNote', decodeURIComponent(error.toString()))
            /** TODO: update error state and display on login **/
      //		('Oops! Something went wrong and we couldn\'t ' +'log you in using OneNote. Please try again.')
          }
        }

      	// If "Done" button is pressed, hide "Loading"
        authWindow.on('close', () => {
          authWindow.destroy()
        })

      	// handle the response from OneNote
        authWindow.webContents.on('will-navigate', (event, url) => {
          handleCallback(url)
        })

        authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
          handleCallback(newUrl)
        })

      	// reset the authWindow on close
        authWindow.on('close', () => {
          authWindow = null
        }, false)
      }
    }
  }

  export default Login

</script>

<style lang="css">
  h1 > sup {
    font-size: 50%;
    top: -1em;
  }

</style>
