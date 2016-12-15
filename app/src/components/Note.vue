<template lang="html">
  <div id="note" class="ui card">
    <div v-bind:style='{ backgroundImage: `url(${imgUrl})`}' class="medium ui image">
    </div>
    <div class="content">
      <div @click='openOneNoteClient' :title='title' class="ui blue large header">
        {{title}}
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
    </div
  </div>
</template>

<script>
  import $ from 'jquery'
  const { ipcRenderer: ipc, shell } = require('electron')
  const { getRandomNote } = require('../main/onenote')
  const { refreshOneNoteToken } = require('../main/auth')
  const { URLS, WINDOW } = require('../../app.config')
  const {app} = require('electron').remote
  const path = require('path')
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
        loading: false
      }
    },

    mounted () {
      this.handleRandomNote(false)
    },

    methods: {
      showSettings: function () {
        $('#settings').modal('show')
      },
      showAbout: function () {
        $('#about').modal('show')
      },
      handleRandomNote: function (withNotification = true) {
        this.loading = true
        getRandomNote()
        .then((note) => {
          const { title, noteLinks, preview: {previewText, links} } = note
    			this.title = title
    			this.body = previewText
    			this.imgUrl = (links.previewImageUrl.href === null) ? URLS.THUMBNAIL : links.previewImageUrl.href
          this.noteLinks = noteLinks

          this.loading = false

          if(withNotification)
            this.renderNotification(note)
    		})
    		.catch((err) => {
          this.loading = false
    			console.log(err)
    		})
      },
      renderNotification: function (note) {
        const vm = this
      	const { title, noteLinks, preview: {previewText, links} } = note
      	let myNotification = new Notification(title, {
      		body: previewText,
      		icon: (links.previewImageUrl.href !== null) ? links.previewImageUrl.href : ''
      	})

      	myNotification.addEventListener('click', () => {
      		const { oneNoteClientUrl, oneNoteWebUrl } = noteLinks
          ipc.send('show-app-window')
      	})
      },
      openOneNoteClient: function () {
        const { oneNoteClientUrl, oneNoteWebUrl } = this.noteLinks
        shell.openExternal((storeSettings.getItemSync('openWith') === 'OneNote') ? oneNoteClientUrl.href : oneNoteWebUrl.href)
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
  }

  #note .ui.card>.content {
    flex-grow: 0;
  }

  #note {
    width: 318px;
  }

  #note.ui.card {
    height: inherit;;
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
</style>
