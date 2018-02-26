import constants from '../../../shared/constants';
import taistApiSingleton from '../../taistApiSingleton';
import appServerApi from './appServerApi'

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

  async checkLogin () {
    return this._authorize({ useExistingLogin: true })
  },

  async login () {
    return this._authorize({ useExistingLogin: false })
  },

  async _authorize ({ useExistingLogin }) {
    const userLoginResult = await this._loginAsUser(useExistingLogin)

    const result = {
      status: userLoginResult.status,
      accessToken: null,
      pageId: null
    }

    if (userLoginResult.status === constants.facebookLoginStatuses.SUCCESS) {
      // TODO: store token as a service state for future use
      const shortTermAccessToken = userLoginResult.authResponse.accessToken;
      const longTermTokenResponse = await this._getLongTermAccessToken(shortTermAccessToken)

      // TODO: return json from server
      const longTermTokenResult = JSON.parse(longTermTokenResponse.body)
      const longTermAcessToken = longTermTokenResult.access_token;
      window.LTR = longTermTokenResult

      result.accessToken = longTermAcessToken
    }

    return result
  },

  _loginAsUser (useExistingLogin) {
    const authMethodName = useExistingLogin
      ? 'getLoginStatus'
      : 'login'

    return new Promise(function (resolve) {
      FB[authMethodName](function (status) {
        resolve(status)
      }, LOGIN_OPTIONS)
    })
  },

  _getLongTermAccessToken (shortTermAccessToken) {
    // TODO: split retrieval of auth token and pageId
    return appServerApi.get(`${constants.longTermAccessTokenEndpoint}/${shortTermAccessToken}`)
  },
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
