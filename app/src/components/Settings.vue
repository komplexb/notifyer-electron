<template lang="html">

  <div id="settings" class="ui small modal">
    <!-- <i class='close icon'></i> -->
    <i class='close'><svg class="svgicon icon-blackcross"><use xlink:href="#icon-blackcross"></use></svg></i>
    <div class="header">
      <h2 class="ui header">
        <svg class="svgicon icon-blackcogs">
          <use xlink:href="#icon-blackcogs"></use></svg>
        <div class="content">
          Settings
        </div>
      </h2>
    </div>
    <div class="content">

      <form class="ui form">
        <div class="field">
          <label for='sectionName'>
            Send notifications from?
          </label>
          <input
          id="sectionName"
          v-model='settings.sectionName'
          disabled
          type="text"
          data-tooltip='Get quotes from this section.'
          aria-label='Get quotes from this section.'
          />
          <!-- <br>
          <select v-model='settings.sections' id='setSection' class="ui simple dropdown"
          @change='logChangedSettings'
          >
            <option v-for="{id, name} in sections"
              :value='id'>
              {{name}}
            </option>
          </select> -->
        </div>

        <div class="field">
          <label for='setSchedule'>
            Every?
          </label>
          <select v-model='settings.schedule' id='setSchedule' class="ui simple dropdown"
          @change='logChangedSettings'
          >
            <option v-for="{time, label} in schedules"
              :value='time'>
              {{label}}
            </option>
          </select>
        </div>
        <div class="field">
          <label for='toggleOpeningMethod'>Open with?</label>
          <select @change='logChangedSettings' v-model='settings.openWith' id='toggleOpeningMethod' class="ui simple dropdown">
            <option value="Browser">Browser</option>
            <option value="OneNote" >OneNote</option>
          </select>
        </div>
        <div id='setShortCut' class="field">
          <label for='setShortCut'>
            Shortcut Key ({{settings.shortcutKey.join('+') | toggleCmdOrCtrl | formatShortcut}})
            <!-- CmdOrCtrl+Alt+O -->
          </label>
          <div>
            <div class="ui toggle checkbox">
              <input id="global-shortcut-ctrl" v-model='settings.shortcutKey' value="CmdOrCtrl" type="checkbox">
              <label>{{'CmdOrCtrl' | toggleCmdOrCtrl}}</label>
            </div>
            <div class="ui toggle checkbox">
              <input id="global-shortcut-shift" v-model='settings.shortcutKey' value="Shift" type="checkbox">
              <label>Shift</label>
            </div>
            <div class="ui toggle checkbox">
              <input id="global-shortcut-alt" v-model='settings.shortcutKey' value="Alt" type="checkbox">
              <label>Alt</label>
            </div>
          </div>
        </div>
      </form>

    </div>
    <div class="actions">
      <div class="ui buttons">
        <button @click='handleLogout' class="ui button">Sign Out</button>
        <button @click='handleSave' class="ui primary button">Save</button>
      </div>
    </div>
  </div>

</template>

<script>
  import $ from 'jquery'
  import is from '../main/is'
  const { ipcRenderer: ipc } = require('electron')

  const {URLS, SHORTCUTS} = require('../../app.config')
  const auth = require('../main/auth')
  const {app} = require('electron').remote
  const path = require('path')
  const storeSettings = require('node-persist')
  storeSettings.initSync({dir: path.join(app.getPath('userData'), URLS.SETTINGS)})

  let Settings = {
    template: '#settings',
    data: function () {
      return {
        schedules: [
          {time: '*/5 * * * *', label: '5 Minutes'},
          {time: 6, label: 'Early Morning (6AM)'},
          {time: 9, label: 'Morning (9AM)'},
          {time: 13, label: 'Afternoon (1PM)'},
          {time: 16, label: 'Mid-Afternoon (4PM)'},
          {time: 18, label: 'Evening (6PM)'},
          {time: 20, label: 'Night (8PM)'},
          {time: 22, label: 'Late Night (10PM)'}
        ],
        sections: [{
          id: storeSettings.getItemSync('section').id,
          name: storeSettings.getItemSync('section').name
        }],
        settings: {
          sectionName: storeSettings.getItemSync('sectionName'),
          schedule: storeSettings.getItemSync('schedule'),
          openWith: storeSettings.getItemSync('openWith'),
          shortcutKey: storeSettings.getItemSync('shortcutKey').split('+')
        }
      }
    },

    methods: {
      handleLogout () {
        $('#settings').modal('hide')
        auth.logout()
        this.$emit('toggleLogon')
      },
      // persist settings, send related events to main process
      handleSave () {
        this.logChangedSettings()
        storeSettings.setItemSync('schedule', this.settings.schedule)
        storeSettings.setItemSync('openWith', this.settings.openWith)
        storeSettings.setItemSync('shortcutKey', this.settings.shortcutKey.join('+'))
        ipc.send('set-global-shortcuts', this.settings.shortcutKey.join('+'))
        ipc.send('reschedule-notes', this.settings.schedule)
        $('#settings').modal('hide')
      },
      logChangedSettings () {
        console.log(this.settings.sectionName)
        console.log(this.settings.schedule)
        console.log(this.settings.openWith)
        console.log(this.settings.shortcutKey)
        // console.log(storeSettings.getItemSync('shortcutKey'))
      }
    },
    filters: {
      toggleCmdOrCtrl (value) {
        return value.replace('CmdOrCtrl', (is.osx() ? 'Cmd' : 'Ctrl'))
      },
      formatShortcut (value) {
        let s = []
        value.split('+').forEach((val) => {
          let i = SHORTCUTS.indexOf(val)
          if (i >= 0) {
            s[i] = val
          }
        })
        console.log(s)
        return s.join(' ')
      }
    }
  }

  export default Settings

</script>

<style lang="css">
  #setShortCut .ui.toggle.checkbox label {
    padding-left: 3.8rem;
    padding-right: .8rem;
  }

  #setShortCut > div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .ui.modal>.close .svgicon {
    font-size: .8em;
  }
</style>
