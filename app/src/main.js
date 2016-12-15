import Vue from 'vue'
import Electron from 'vue-electron'
import Resource from 'vue-resource'
const { ipcRenderer: ipc } = require('electron')

import './static/semantic/semantic.min.js'

Vue.use(Electron)
Vue.use(Resource)
Vue.config.debug = true

import App from './App'

/* eslint-disable no-new */
let vm = new Vue({...App}).$mount('#app')

/**
 * Triggers a random note based on the schedule rule defined in the main process
 * Achieved using a child component ref: https://vuejs.org/v2/guide/components.html#Child-Component-Refs
 * Efforts to do this from within the Note component only triggered the Notification
 * but didn't update the Note component UI
 */
ipc.on('trigger-random-note', function () {
  let cmpNote = vm.$children.filter(child => child.$el.id === 'note')
  cmpNote[0].$refs.btnRandomNote.click()
})
