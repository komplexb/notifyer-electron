const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
     .then(createWindowsInstaller)
     .catch((error) => {
       console.error(error.message || error)
       process.exit(1)
     })

function getInstallerConfig () {
  console.log('creating windows installer')
  const rootPath = path.join('./')
  const outPath = path.join(rootPath, 'builds')

  return Promise.resolve({
    appDirectory: path.join(outPath, 'Notifyer-win32-x64/'),
    authors: 'Byron Buckley',
    noMsi: true,
    outputDirectory: path.join(outPath, 'windows-installer'),
    setupExe: 'NotifyerWindowsInstaller.exe',
    setupIcon: path.join(rootPath, 'app', 'icons', 'icon.ico')
  })
}
