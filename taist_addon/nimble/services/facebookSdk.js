import React from 'react';

import FacebookLogin from 'react-facebook-login';

import constants from '../../../shared/constants';
import appServerApi from './appServerApi';

let FB;
export default {
  init () {
    return new Promise(function (resolveInit) {
      // fb uses predefined callback init name
      let fbInitCallbackName = 'fbAsyncInit';
      let shouldGenerateUniqueName = false;

      _createSingleUseGlobalFunction(fbInitCallbackName, shouldGenerateUniqueName, function () {
          FB = window.FB;
          FB.init(SDK_OPTIONS);
          resolveInit();
        },
      );

      _injectSdkScript();
    });
  },

  async checkLogin () {
    return this._authorize({ useExistingLogin: true });
  },

  async login () {
    return this._authorize({ useExistingLogin: false });
  },

  async _authorize ({ useExistingLogin }) {
    const userLoginResult = await this._loginAsUser(useExistingLogin);

    const result = {
      status: userLoginResult.status,
      accessToken: null,
      pageId: null,
    };

    if (userLoginResult.status === constants.facebookLoginStatuses.SUCCESS) {
      // TODO: store token as a service state for future use
      const shortTermAccessToken = userLoginResult.authResponse.accessToken;
      const pageInfo = await this._getPageInfo(shortTermAccessToken);

      result.accessToken = pageInfo.accessToken;
      result.pageId = pageInfo.pageId;
    }

    return result;
  },

  _loginAsUser (useExistingLogin) {
    const authMethodName = useExistingLogin
      ? 'getLoginStatus'
      : 'login';

    return new Promise(function (resolve) {
      FB[authMethodName](function (status) {
        resolve(status);
      }, LOGIN_OPTIONS);
    });
  },

  async _getPageInfo (shortTermAccessToken) {
    const response = await appServerApi.get(`${constants.pageCredentialsEndpoint}/${shortTermAccessToken}`);

    return response.result;
  },

  renderFacebookLoginButton ({ onLogin }) {
    return <FacebookLogin
      appId={constants.facebookAppId}
      fields="name,email,picture"
      callback={onLogin}
    />;
  },
};

const SDK_OPTIONS = {
  appId: constants.facebookAppId,
  autoLogAppEvents: true,
  xfbml: true,
  version: 'v2.12',
};

const LOGIN_OPTIONS = {
  scope: 'manage_pages',
};

function _injectSdkScript () {
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

function _createSingleUseGlobalFunction (functionName, shouldGenerateUniqueName, innerFunction) {
  let finalFunctionName = functionName;

  if (shouldGenerateUniqueName) {
    const integerSuffix = parseInt(Math.random() * 100000);

    finalFunctionName += integerSuffix;
  }

  window[finalFunctionName] = function () {
    delete window[finalFunctionName];
    innerFunction.apply(null, arguments);
  };

  return finalFunctionName;
}
