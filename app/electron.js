'use strict'

// handle setupevents as quickly as possible
const setupEvents = require('./installers/setupEvents')
if (setupEvents.handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  // return;
}

const electron = require('electron')
const {app, BrowserWindow, globalShortcut, Menu, ipcMain: ipc} = electron
const path = require('path')
const schedule = require('node-schedule')
const is = require('electron-is')
const {URLS, WINDOW, DEFAULT_SETTINGS} = require('./app.config')

const storeSettings = require('node-persist')
storeSettings.initSync({
  dir: path.join(app.getPath('userData'), URLS.SETTINGS)
})
// console.log('path', app.getPath('userData'))

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
  setGlobalShortcuts()
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

ipc.on('set-global-shortcuts', () => {
  setGlobalShortcuts()
})

function setGlobalShortcuts () {
  globalShortcut.unregisterAll()

  globalShortcut.register(storeSettings.getItemSync('shortcutKey'), () => {
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
 */
function loadSettings () {
  for (const [key, value] of DEFAULT_SETTINGS) {
    if (storeSettings.getItemSync(key) === undefined || null || '') {
      storeSettings.setItemSync(key, value)
    }
  }
}

/**
 * If we did not explicitly set minute to 0,
 * the message would have instead been logged at 5:00pm, 5:01pm, ..., 5:59pm.
 */
function scheduleRandomNote () {
  let rule

  if (storeSettings.getItemSync('schedule') === '*/5 * * * *') {
    rule = '*/5 * * * *' // every 5 minutes
  } else {
    rule = new schedule.RecurrenceRule()
    rule.dayOfWeek = [0, new schedule.Range(0, 7)]
    rule.hour = storeSettings.getItemSync('schedule')
    rule.minute = 0
  }

  // return job instance so we can cancel it when schedule is updated
  // via settings
  return schedule.scheduleJob(rule, function () {
    mainWindow.webContents.send('trigger-random-note')
  })
}

ipc.on('reset-schedule', () => {
  scheduleInstance.cancel()
  scheduleInstance = scheduleRandomNote()
})
