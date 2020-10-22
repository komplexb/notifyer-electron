/* global alert */
const { app } = require('electron').remote
const path = require('path')
const apiRequests = require('superagent')
const is = require('electron-is')
const { URLS, TIMEOUTS } = require('../../app.config')
const { refreshOneNoteToken } = require('./auth')
const storage = require('./store')

const storeSettings = require('node-persist')
storeSettings.initSync({
  dir: path.join(app.getPath('userData'), URLS.SETTINGS)
})
const Chance = require('chance')
const chance = new Chance()

/**
 * This is where the magic happens but the magic can't happen without:
 * - a fresh token (conditional HTTP request)
 * - a note section id (conditional HTTP request)
 * - Best case only one HTTP request is required,
 * on avg it will be two, since most schedules are daily
 *
 * Ref Mistake #4: https://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html
 *
 * @returns {Promise}
 */
function getRandomNote () {
  return refreshOneNoteToken()
    .then(hasNoteSection)
    .then(p)
    .catch(err => {
      console.log(err)
    })

  function hasNoteSection () {
    return Promise.resolve().then(() => {
      if (storage.getItem('onenote_section_id') === null) {
        return setNoteSection(storeSettings.getItemSync('sectionName'))
      }
    })
  }

  function p () {
    return new Promise((resolve, reject) => {
      const onenote_section_id = storage.getItem('onenote_section_id')
      const { access_token } = storage.getItem('onenote')
      // instead of showing the first/last 100 records,
      // randomly select a starting point and get the next 100 results
      const skip = chance.natural({ min: 0, max: storage.getItem('onenote_section_count') || 1 })

      // https://docs.microsoft.com/en-us/graph/onenote-get-content#example-get-requests
      apiRequests
        .get(`${URLS.SECTION}${onenote_section_id}/pages`)
        .query({
          select: 'title,links,self', // fields to return
          count: true, // show the amount of pages in section
          top: 100, // maximum pages query can return
          skip // The number of entries to skip in the result set.
        })
        .timeout(TIMEOUTS)
        .set('Authorization', `Bearer ${access_token}`)
        .then(function (response) {
          if (response && response.ok) {
            const notes = response.body.value
            storage.setItem('onenote_section_count', response.body['@odata.count'])
            // TODO
            // if notes is zero REJECT or RETRY
            const noteIndex = chance.natural({ min: 0, max: notes.length - 1 })
            const note = notes[noteIndex]
            resolve(getNotePreview(note))
          } else {
            console.log(response)
            reject(response)
          }
        })
        .catch(function (err) {
          console.log(err)
          reject(err)
        })
    })
  }
}

/**
 * setNoteSection - Description
 *
 * @param {string} [section=Quotes] Description
 * @returns {Promise} Description
 */
function setNoteSection (sectionName) {
  return refreshOneNoteToken()
    .then(p)
    .catch(err => {
      console.log(err)
    })

  function p () {
    return new Promise((resolve, reject) => {
      const { access_token } = storage.getItem('onenote')

      apiRequests
        .get(`${URLS.SECTION}`)
        .query({ filter: `name eq '${sectionName}'` })
        .timeout(TIMEOUTS)
        .set({
          Authorization: `Bearer ${access_token}`,
          FavorDataRecency: is.dev() ? 'false' : 'true'
        })
        .then(function (response) {
          if (response && response.ok) {
            if (response.body.value.length === 0) {
              alert(
                `Please create a section with the name '${sectionName}' and restart the app.`
              )
              reject()
            } else {
              storage.setItem('onenote_section_id', response.body.value[0].id)
              resolve(response.body.value[0].id)
            }
          } else {
            console.log(response)
            reject(response)
          }
        })
        .catch(function (err) {
          console.log(err)
          reject(err)
        })
    })
  }
}

/**
 * getNotePreview - getRandomNote() uses this
 * to provide a note object to the UI
 * What's neat is when I tried this in Rails (2015)
 * There was no page preview endpoint, so I had to strip the HTML from the page.
 * The preview enpoint provides a previewText snippet as plain text
 * and an optional previewImageUrl which I use to embelish the display
 * of notes and notifications.
 * https://dev.onenote.com/docs#/reference/get-pages/v10menotespagesidpreview/get
 *
 * @param {Object} note
 * @returns {Promise} Description
 */
function getNotePreview (note) {
  const { links, self: url, title } = note

  return new Promise((resolve, reject) => {
    const { access_token } = storage.getItem('onenote')

    apiRequests
      .get(`${url}/preview`)
      .timeout(TIMEOUTS)
      .set('Authorization', `Bearer ${access_token}`)
      .then(function (response) {
        if (response && response.ok) {
          resolve({ title, preview: response.body, noteLinks: links, url })
        } else {
          console.log(response)
          reject(response)
        }
      })
      .catch(function (err) {
        console.log(err)
        reject(err)
      })
  })
}

/**
 * https://dev.onenote.com/docs#/reference/get-pages/v10menotespagesidpreview/get
 *
 * @param {Object} note
 * @returns {Promise} Description
 */
function getNoteContents (url) {
  return new Promise((resolve, reject) => {
    const { access_token } = storage.getItem('onenote')

    apiRequests
      .get(`${url}/content`)
      .timeout(TIMEOUTS)
      .set('Authorization', `Bearer ${access_token}`)
      .then(function (response) {
        if (response && response.ok) {
          resolve({ content: response.text })
        } else {
          console.log(response)
          reject(response)
        }
      })
      .catch(function (err) {
        console.log(err)
        reject(err)
      })
  })
}

module.exports = {
  getRandomNote: getRandomNote,
  getNoteContents: getNoteContents,
  setNoteSection: setNoteSection
}
