const request = require('request-promise-native');

const constants = require('../shared/constants');
const taistAddonAccessToken = process.env.TAIST_ADDON_ACCESS_TOKEN;
const appSecret = process.env.FACEBOOK_APP_SECRET;

// TODO: remove hard-coded constant
const facebookApiRoot = 'https://graph.facebook.com/v2.12';

// TODO: extract into Taist server-side SDK
const taistApiRoot = 'https://www.tai.st/api/0.2/addonApi';

// TODO: account for production as well, retrieve dynamically
const appServerApiRootUrl = 'http://localhost:5000';
const fullFacebookLoginRedirectUri = appServerApiRootUrl + constants.facebookLoginCallbackPath;

// TODO: split into separate app-specific services
module.exports = {
  getLongTermFacebookToken (shortTermToken) {
    return _queryFacebookApi('/oauth/access_token', {
      fb_exchange_token: shortTermToken,
      client_secret: appSecret,
      client_id: constants.facebookAppId,
      grant_type: 'fb_exchange_token',
      redirect_uri: fullFacebookLoginRedirectUri,
    });
  },

  getIntegrationSettings (taistCompanyId) {
    return _queryTaistAddonApi('/companyData', {
      companyId: taistCompanyId,
      key: constants.integrationSettingsKey,
    });
  },

  pushLeadToNimble ({ accessToken, lead }) {
    return _queryNimbleApi()
  },

  getFacebookLeadInfo ({ accessToken, leadId }) {
    return _queryFacebookApi()
  },

  getTaistCompanyIdByPageId (pageId) {
    const keyPath = [constants.integrationSettingsKey, constants.facebookPageIdKeyInSettings].join('.');

    return _queryTaistAddonApi('/companyIdByKey', {
      keyPath,
      keyValue: pageId,
    });
  },
};

function _queryTaistAddonApi (path, params) {
  const fullParams = Object.assign({
    accessToken: taistAddonAccessToken,
  }, params);

  return _queryRemoteApi(taistApiRoot, path, fullParams);
}

function _queryFacebookApi (path, params) {
  return _queryRemoteApi(facebookApiRoot, path, params);
}

function _queryRemoteApi (rootUrl, path, params) {
  let paramPairStrings = Object.entries(params).map(keyValuePairArray => keyValuePairArray.join('='));
  const queryString = paramPairStrings.join('&');

  const url = rootUrl + path + '?' + queryString;

  return request({ uri: url, json: true });
}
