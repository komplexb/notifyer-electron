<template lang="html">
<main id='app' :style='styleObject'>
  <template v-if="loggedIn">
    <Note></Note>
    <Settings v-on:toggleLogon='toggleLogon'></Settings>
  </template>
  <template v-else>
    <Login v-on:toggleLogon='toggleLogon'></Login>
  </template>
  <div id="about" class="ui small modal">
    <i class='close'><svg class="svgicon icon-blackcross"><use xlink:href="#icon-blackcross"></use></svg></i>
    <div class="header">
      <h2 class="ui header">
        <svg class="svgicon icon-blackinfo"><use xlink:href="#icon-blackinfo"></use></svg>
        <div class="content">
          About
        </div>
      </h2>
    </div>
    <div class="content">
      <br>
      <div class="ui middle aligned center aligned grid">
        <div class="column">
          <h1 class='ui header purple' title='Notifyer Beta'>Notifyer<sup>β</sup></h1>
          <p>
            <a href="mailto:hello@byronbuckley.com?subject=Re: Notifyer" title='Get in touch'>Byron Buckley</a>
            | <a @click="goToGitHub" target="_blank">GitHub</a>
          </p>
        </div>
      </div>
    </div>
  </div>

  <div id='toggleLogon' v-show='isDev' class="ui middle aligned center aligned grid">
    <button @click='flipLogin' class="ui purple button">
      <svg class="svgicon icon-blackenter"><use xlink:href="#icon-blackenter"></use></svg>
      Sign In/Out
    </button>
  </div>
</main>
</template>

<script>
import Login from './components/Login.vue'
import Note from './components/Note.vue'
import Settings from './components/Settings.vue'
import is from './main/is'
const { shell } = require('electron')

const auth = require('./main/auth')
const {setNoteSection} = require('./main/onenote')
const {app} = require('electron').remote
const path = require('path')
const {URLS, WINDOW} = require('../app.config')
const storeSettings = require('node-persist')
storeSettings.initSync({dir: path.join(app.getPath('userData'), URLS.SETTINGS)})

window.onload = function () {
  console.log('loaded')
}

// export default $rootVm
export default {
  data: function () {
    return {
      loggedIn: auth.hasAccessToken(),
      isDev: is.dev(),
      styleObject: {
        height: `${WINDOW.height}px`
      }
    }
  },

  created () {
    if (auth.hasAccessToken()) {
      setNoteSection(storeSettings.getItemSync('sectionName'))
    }
  },

  methods: {
    toggleLogon: function () {
      console.log('Logged in?', auth.hasAccessToken())
      this.loggedIn = auth.hasAccessToken()
    },
    flipLogin: function () {
      this.loggedIn = !this.loggedIn
    },
    goToGitHub: function () {
      shell.openExternal('http://www.github.com/komplexb')
    }
  },

  watch: {

  },

  components: {
    Login,
    Note,
    Settings
  }
}
</script>

<style lang="css">
  #toggleLogon {
    margin-top: 20px;
  }

  a {
    cursor: pointer;
  }

  .svgicon {
    display: inline-block;
    width: 1em;
    height: 1em;
    stroke-width: 0;
    stroke: currentColor;
    fill: currentColor;
    vertical-align: top;
  }

</style>
