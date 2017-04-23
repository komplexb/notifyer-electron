<template lang="html">
  <div id="note" class="ui card">
    <div v-bind:style='{ backgroundImage: `url(${imgUrl})`}' class="medium ui image">
    </div>
    <div class="content">
      <div class="title-area">
        <div @click='openOneNoteClient' :title='title' class="ui blue large header">
          {{title}}
        </div>
        <div class="ui toggle checkbox">
          <input v-model="sticky" type="checkbox" name="sticky" :title="stickyTooltip" @change='handleSticky'>
          <label></label>
        </div>
      </div>
      <div class="description">
        <template v-if='loading'>
          <div class="ui active inverted dimmer">
            <div class="ui large text loader">
            </div>
          </div>
        </template>
        <template v-else>
          <em>{{body}}</em>
        </template>
      </div>
    </div>
    <div class="ui three bottom attached buttons">
      <button @click='showAbout' data-tooltip='About Notifyer' title='About Notifyer' class="ui button">
        <svg class="svgicon icon-blackinfo"><use xlink:href="#icon-blackinfo"></use></svg>
      </button>
      <button @click='showSettings' data-tooltip='View & Change Settings' title='View & Change Settings' class="ui button">
        <svg class="svgicon icon-blackcogs"><use xlink:href="#icon-blackcogs"></use></svg>
      </button>
      <button ref='btnRandomNote' @click='handleRandomNote' data-tooltip='Get a Random Note' title='Get a Random Note' class="ui purple button">
        <svg class="svgicon icon-blackshuffle"><use xlink:href="#icon-blackshuffle"></use></svg>
          Note
      </button>
    </div>
  </div>
</template>

<script>
  /* global Notification */
  import $ from 'jquery'
  const { ipcRenderer: ipc, shell } = require('electron')
  const path = require('path')
  const storage = require('../main/store')
  const { getRandomNote } = require('../main/onenote')
  const { URLS } = require('../../app.config')
  const {app} = require('electron').remote
  const storeSettings = require('node-persist')
  storeSettings.initSync({dir: path.join(app.getPath('userData'), URLS.SETTINGS)})

  let Note = {
    template: '#note',
    data: function () {
      return {
        title: '',
        body: '',
        imgUrl: '',
        noteLinks: {},
        loading: false,
        sticky: false,
        stickyTooltip: 'Make this quote sticky.'
      }
    },

    mounted () {
      this.handleRandomNote(false)
    },

    methods: {
      handleSticky () {
        this.stickyTooltip = this.sticky ? "This quote won't change until you restart the app or uncheck this toggle." : 'Make this quote sticky.'
      },
      showSettings: function () {
        $('#settings').modal('show')
      },
      showAbout: function () {
        $('#about').modal('show')
      },
      // get a random note update the UI, conditionally push a notification
      handleRandomNote: function (withNotification = true) {
        this.loading = true // show loading overlay

        // if sticky use the last set note
        if (this.sticky === true) {
          const currentNote = storage.getItem('current_note')
          this.setNote(currentNote)
          if (withNotification) {
            this.renderNotification(currentNote)
          }
        } else {
          getRandomNote()
          .then((note) => {
            storage.setItem('current_note', note)
            this.setNote(note)
            if (withNotification) {
              this.renderNotification(note)
            }
          })
          .catch((err) => {
            this.title = 'Ooops!'
            this.body = `Can't seem to find any notes here. Please check if you created a section called '${storeSettings.getItemSync('sectionName')}', add some notes, or try re-signing into the app (sign-out + sign-in).`
            this.imgUrl = URLS.ERROR
            this.loading = false
            console.log(err)
          })
        }
      },
      renderNotification: function (note) {
        const { title, preview: {previewText, links} } = note
        let myNotification = new Notification(title, {
          body: previewText,
          icon: (links.previewImageUrl.href !== null) ? links.previewImageUrl.href : ''
        })

        myNotification.addEventListener('click', () => {
          ipc.send('show-app-window') // clicking the notification shows the app window
        })
      },
      // clicking the note title in the app window opens the note in the client
      // defined in settings
      openOneNoteClient: function () {
        const { oneNoteClientUrl, oneNoteWebUrl } = this.noteLinks
        shell.openExternal((storeSettings.getItemSync('openWith') === 'OneNote') ? oneNoteClientUrl.href : oneNoteWebUrl.href)
      },
      setNote (note) {
        const { title, noteLinks, preview: {previewText, links} } = note
        this.title = title
        this.body = previewText
        this.imgUrl = (links.previewImageUrl.href === null) ? URLS.THUMBNAIL : links.previewImageUrl.href
        this.noteLinks = noteLinks
        this.loading = false // hide loading overlay
      }
    }
  }

  export default Note

</script>

<style lang="css">
  #note > .image {
    width: 100%;
    height: 200px;
    background-size: cover;
    background-position: center;
    cursor: move;
    -webkit-app-region: drag;
  }

  #note .header {
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  #note .ui.card > .content {
    flex-grow: 0 !important;
  }

  #note {
    width: 318px;
  }

  #note.ui.card {
    height: inherit;
  }

  #note .description {
    font-size: 1.28571429em;
    margin-top: -.21425em;
    line-height: 1.2857em;
    height: 200px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    /*justify-content: center;*/
  }

  .title-area {
    display: flex;
  }

  .title-area .checkbox {
    align-content: flex-end;
    padding-top: 3px;
  }

  .title-area .ui.toggle.checkbox label {
    padding-left: 3.5rem;
  }
</style>
