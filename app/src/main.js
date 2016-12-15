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

ipc.on('trigger-random-note', function () {
  let cmpNote = vm.$children.filter(child => child.$el.id === 'note')
  cmpNote[0].$refs.btnRandomNote.click()
})
