import constants from '../constants';
import taistApiSingleton from '../../taistApiSingleton';

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

  async login () {
    const userLoginResult = await this._loginAsUser()
    const result = {
      status: userLoginResult.status,
      accessToken: null,
      pageId: null
    }

    //
    //if (userLoginResult.status === constants.facebookLoginStatuses.SUCCESS) {
    //  // TODO: store token as a service state for future use
    //  const longTermAccessToken = await this._getLongTermAccessToken(userLoginResult.accessToken)
    //
    //  // TODO: split auth logic and page id retrieval, move them out of the sdk wrapper to higher-level services
    //  const pageId = await this._retrievePageId(longTermAccessToken);
    //
    //  result.accessToken = longTermAccessToken
    //  result.pageId = pageId
    //}

    return result
  },

  _loginAsUser() {
    return new Promise(function (resolve) {
      FB.login(function (status) {
        resolve(status)
      }, LOGIN_OPTIONS)
    })
  },

  _getLongTermAccessToken(shortTermAccessToken) {
    return new Promise((resolve) => {
      taistApiSingleton.get().proxy
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
