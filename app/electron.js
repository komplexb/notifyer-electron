'use strict'

const electron = require('electron')
const {app, BrowserWindow, globalShortcut, Menu, ipcMain: ipc} = electron
const path = require('path')
const schedule = require('node-schedule')
const is = require('electron-is')
const log = require('electron-log')
const moment = require('moment')
const momentFormat = 'LLLL'

let scheduledFor
const {URLS, WINDOW, DEFAULT_SETTINGS} = require('./app.config')

// handle setupevents as quickly as possible
const setupEvents = require('./installers/setupEvents')
if (setupEvents.handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  // return;
}

const storeSettings = require('node-persist')
storeSettings.initSync({
  dir: path.join(app.getPath('userData'), URLS.SETTINGS)
})
// console.log('path', app.getPath('userData'))

log.transports.file.level = 'info'
log.transports.file.format = '{y}-{m}-{d} | {h}:{i}:{s}:{ms} {text}'
log.transports.file.maxSize = 5 * 1024 * 1024
log.transports.file.file = path.join(app.getPath('userData'), 'notifyer-log.txt')

let mainWindow
let config = {}
let scheduleInstance

if (is.dev()) {
  config = require('../config')
  config.url = `http://localhost:${config.port}`
} else {
  config.devtron = false
  config.url = `file://${__dirname}/dist/index.html`
}

function createWindow () {
  // window config for pre build demos

  const windowSize = {
    height: is.windows() ? (WINDOW.height + WINDOW.windowsOffset.height) : WINDOW.height,
    width: is.windows() ? (WINDOW.width + WINDOW.windowsOffset.width) : WINDOW.width
  }

  // for testing stuff during dev
  const demoWindow = {
    height: windowSize.height,
    width: windowSize.width,
    resizable: true,
    frame: true,
    titleBarStyle: (!is.dev()) ? 'default' : 'hidden',
    movable: true,
    acceptFirstMouse: true,
    vibrancy: 'dark',
    fullscreenable: false,
    maximizable: false
  }

  // default window config
  const defaultWindow = {
    height: windowSize.height,
    width: windowSize.width,
    resizable: false,
    frame: true,
    titleBarStyle: (is.dev()) ? 'default' : 'hidden',
    movable: true,
    acceptFirstMouse: true,
    vibrancy: 'dark',
    fullscreenable: false,
    maximizable: false
  }

  mainWindow = new BrowserWindow(defaultWindow) // put demoWindow here
  mainWindow.loadURL(config.url)

  if (is.windows()) {
    mainWindow.setMenu(null)
  }

  if (is.dev()) {
    mainWindow.setSize(1200, 600)
    mainWindow.setResizable(true)
    mainWindow.setMovable(true)
    BrowserWindow.addDevToolsExtension(path.join(__dirname, '../node_modules/devtron'))

    let installExtension = require('electron-devtools-installer')

    installExtension.default(installExtension.VUEJS_DEVTOOLS)
      .then((name) => mainWindow.webContents.openDevTools())
      .catch((err) => console.log('An error occurred: ', err))
  }

  if (is.osx() && is.production()) {
    // allow dev tools in prod
    mainWindow.webContents.on('devtools-opened', (event, deviceList, callback) => {
      mainWindow.setSize(1200, 600)
      mainWindow.setResizable(true)
    })

    mainWindow.webContents.on('devtools-closed', (event, deviceList, callback) => {
      mainWindow.setSize(WINDOW.width, WINDOW.height)
      // mainWindow.setResizable(false)
    })

    initMenu()
    // allow dev tools
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  console.log('mainWindow opened')
}

app.on('ready', () => {
  loadSettings()
  createWindow()
  scheduleInstance = scheduleRandomNote()
  scheduledFor = storeSettings.getItemSync('schedule')
  // rescheduleRandomNote(scheduledFor)
  setGlobalShortcuts()

  electron.powerMonitor.on('resume', () => {
    // user should get notification if he wakes computer after schedule has passed
    let nextRuntime = storeSettings.getItemSync('scheduledRuntime')
    if (moment().isSameOrAfter(nextRuntime, 'hour')) {
      // schedule missed run now
      log.info(`missed schedule: ${nextRuntime}`)
      log.info(`run now: ${moment()}`)
      mainWindow.webContents.send('trigger-random-note')
    }

    // always refresh schedule
    log.info(`computer awake: refresh schedule for ${scheduledFor}`)
    rescheduleRandomNote(scheduledFor)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipc.on('show-app-window', () => {
  mainWindow.show()
})

ipc.on('set-global-shortcuts', (event, arg) => {
  setGlobalShortcuts(arg)
})

function setGlobalShortcuts (shortcutKey = storeSettings.getItemSync('shortcutKey')) {
  globalShortcut.unregisterAll()

  globalShortcut.register(shortcutKey, () => {
    mainWindow.webContents.send('trigger-random-note')
  })
}

function initMenu () {
  var template = [{
    label: 'Edit',
    submenu: [
      {
        label: 'Copy',
        accelerator: 'Command+C',
        selector: 'copy:'
      },
      {
        label: 'Paste',
        accelerator: 'Command+V',
        selector: 'paste:'
      },
      {
        label: 'Select All',
        accelerator: 'Command+A',
        selector: 'selectAll:'
      }
    ]
  },
    {
      label: 'Developer',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: function (item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.webContents.toggleDevTools()
            };
          }
        }
      ]
    }]

  var menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * loadSettings - persist default settings
 * TODO: return a promise, I shouldn't assume
 * compulsory settings are available
 */
function loadSettings () {
  for (const [key, value] of DEFAULT_SETTINGS) {
    if (storeSettings.getItemSync(key) === undefined || null || '') {
      storeSettings.setItemSync(key, value)
    }
  }
}

/**
 * defineSchedule - manually derive schedule info since node-schedule
 * doesn't give us that with the scheduleJob method
 *
 * @param {int} scheduleVal hour
 *
 * @returns {type} date value
 */
function defineSchedule (scheduleVal) {
  const scheduledHourToday = moment().hours(scheduleVal).minutes(0).seconds(0)
  console.log(`scheduledHourToday: ${scheduledHourToday}`)

  const scheduledHourTomorrow = scheduledHourToday.clone().add(1, 'days')
  console.log(`scheduledHourTomorrow: ${scheduledHourTomorrow}`)

  // console.log(moment(), scheduledHourToday, moment().isSameOrAfter(scheduledHourToday, 'hour'))

  // is the current time after todays scheduled hour?
  // then next run time should be logged as tomorrow at this hour
  // otherwise it should be logged as possible to be logged today
  if (moment().isSameOrAfter(scheduledHourToday, 'hour')) {
    return scheduledHourTomorrow
  }
  return scheduledHourToday
}

/**
 * If we did not explicitly set minute to 0,
 * the message would have instead been logged at 5:00pm, 5:01pm, ..., 5:59pm.
 */
function scheduleRandomNote (scheduleVal = storeSettings.getItemSync('schedule')) {
  let rule

  if (scheduleVal === '*/5 * * * *') {
    rule = '*/5 * * * *' // every 5 minutes
  } else {
    rule = new schedule.RecurrenceRule()
    rule.dayOfWeek = [0, new schedule.Range(0, 7)]
    rule.hour = scheduleVal
    rule.minute = 0

    // it's impt to understand we're only logging time, not actually setting it
    // since the event doesn't do this for us the first time
    // we need an accurate value to determine missed schedules
    let thisScheduledVal = defineSchedule(scheduleVal)
    storeSettings.setItemSync('scheduledRuntime', thisScheduledVal)
    storeSettings.setItemSync('scheduledRuntimeLocal', thisScheduledVal.format(momentFormat))
    log.info(`scheduled: ${thisScheduledVal}`)
    log.info(`scheduled-settings-value: ${scheduleVal}`)
  }

  let j = schedule.scheduleJob(rule, () => {
    mainWindow.webContents.send('trigger-random-note')
  })

  j.on('scheduled', (event) => {
    storeSettings.setItemSync('scheduledRuntime', event)
    log.info(`scheduled: ${event}`)
    log.info(`scheduled-settings-value: ${scheduleVal}`)
  })

  j.on('run', (event) => {
    log.info(`run: ${event}`)
    log.info(`run-settings-value: ${scheduleVal}`)
  })

  j.on('canceled', (event) => {
    log.info(`canceled: ${event}`)
    log.info(`canceled-settings-value: ${scheduleVal}`)
  })

  // return job instance so we can cancel it when schedule is updated
  // via settings
  return j
}

function rescheduleRandomNote (scheduleVal) {
  scheduleInstance.cancel()
  log.info(`reschedule-notes-to: ${scheduleVal}`)
  scheduleInstance = scheduleRandomNote(scheduleVal)
}

ipc.on('reschedule-notes', (event, arg) => {
  scheduledFor = arg
  rescheduleRandomNote(arg)
})
