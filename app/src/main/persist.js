const storage = require('node-persist')

module.exports = {
  storage: storage,
  get: storage.getItemSync,
  set: storage.setItemSync,
  init: storage.initSync
}
