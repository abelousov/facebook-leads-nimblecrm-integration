import constants from '../constants'
let FB
export default {
  init () {
    return new Promise(function (resolveInit) {
      const initCallbackName = 'fbAsyncInit'

      window[initCallbackName] = function () {
        delete window[initCallbackName]
        FB = window.FB
        FB.init(SDK_OPTIONS);

        resolveInit()
      }
      _injectSdkScript()
    })
  },

  checkLogin () {
    return new Promise(function (resolve) {
      FB.getLoginStatus(function (status) {
        resolve(status)
      })
    })
  },

  login () {
    return new Promise(function (resolve) {
      FB.login(function (status) {
        resolve(status)
      }, LOGIN_OPTIONS)
    })
  }
}

const SDK_OPTIONS = {
  appId: constants.facebookAppId,
  autoLogAppEvents: true,
  xfbml: true,
  version: 'v2.12'
}

const LOGIN_OPTIONS = {
  scope: 'manage_pages'
}

function _injectSdkScript() {
  const scriptTagName = 'script';
  const scriptId = 'facebook-jssdk';

  if (document.getElementById(scriptId)) {
    return;
  }
  const js = document.createElement(scriptTagName);
  js.id = scriptId;
  js.src = "https://connect.facebook.net/en_US/sdk.js";

  const firstScriptElement = document.getElementsByTagName(scriptTagName)[0];
  firstScriptElement.parentNode.insertBefore(js, firstScriptElement);
}
