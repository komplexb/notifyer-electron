[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

# Notifyer *Beta*
>*Be inspired*

## Why?
I made Notifyer, to help me remember and practice my mantras.
![Notifyer on Lockscreen](http://i.imgur.com/Ekrnpp7.png)

## What does it do?
Using Microsoft’s OneNote as a datastore, Notifyer utilizes OneNote’s API to retrieve a random note from a given section.  
Use case?  
- Get a daily quote from your curated collection.  
- Effortlessly resurface a buried quote and re-apply it to the present.  

![](http://g.recordit.co/B4qxjGiR9I.gif)

## How to use
#### Requirements
- [OneNote Account][] *(app accesses consumer notebooks only)*.  
- MacOS *(Only 64bit binaries are provided for MacOS, and the minimum MacOS version supported is MacOS 10.9)*.
- Windows 10, 7 (without notifications).

#### Get Started
1. Sign-in or create a **free** [OneNote Account][].
2. In your default/primary notebook, create a section with the name **Quotes**.
3. Add a couple notes to the **Quotes** section.
4. [Download Notifyer][]. Run the app and sign in.
5. Just want to demo the app? [Ping me](http://twitter.com/komplexb) and I'll send you credentials.

#### Help
- The app sends a notification every 5 minutes so you can easily see it work. You might want to change that to daily. *(Restart the app if it doesn't stop)*.
- Random (via [Chance][]) means you might see the same note in close succession.
- Cmd+Alt+O triggers a random note even when the app is minimized.
- Clicking the notification opens the app.
- The app displays a preview text snippet (**max 300 characters**) for each note.
- Clicking the **note title** in the app opens the source note in the OneNote client or web app.
- Disabled fields mean you can't change that setting just yet.


## Build Setup*
#### Built with [Electron](http://electron.atom.io/), [VueJS](https://vuejs.org/v2/guide/) and [Semantic UI](http://semantic-ui.com/).

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev

# build electron app for production
npm run build

# lint all JS/Vue component files in `app/src`
npm run lint

# run webpack in production
npm run pack
```
\* Client ID and secret required from [MS Dev Center](https://msdn.microsoft.com/en-us/office/office365/howto/onenote-auth#register-msa) for use in `onenote.config.js`.

---
Notifyer icon/logo via [Thomas Helbig's][] [Notifications Collection][].

This project was generated from [electron-vue](https://github.com/SimulatedGREG/electron-vue) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about this project can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).

[Thomas Helbig's]: https://thenounproject.com/dergraph
[Notifications Collection]: https://thenounproject.com/dergraph/collection/notifications
[OneNote Account]: http://onenote.com
[Download Notifyer]: https://github.com/komplexb/notifyer-electron/releases
[Chance]: http://chancejs.com