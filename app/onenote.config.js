const ONENOTE = {
  client_id: '', // https://msdn.microsoft.com/en-us/office/office365/howto/onenote-auth#register-msa
  client_secret: '', // https://msdn.microsoft.com/en-us/office/office365/howto/onenote-auth#register-msa
  scopes: ['wl.signin', 'wl.basic', 'wl.offline_access', 'office.onenote'],
  redirect_uri: '' // https://msdn.microsoft.com/en-us/office/office365/howto/onenote-auth#register-msa
}

module.exports = {
  ONENOTE: ONENOTE
}
