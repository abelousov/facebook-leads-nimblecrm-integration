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
  async getFacebookPageCredentials (shortTermToken) {
    const longLiveUserTokenResponse = await _queryFacebookApi('/oauth/access_token', {
      fb_exchange_token: shortTermToken,
      client_secret: appSecret,
      client_id: constants.facebookAppId,
      grant_type: 'fb_exchange_token',
      redirect_uri: fullFacebookLoginRedirectUri,
    });

    const longLiveUserToken = longLiveUserTokenResponse.access_token

    console.log('>>>> externalApis.js#getFacebookPageCredentials()\t - retrieved long live user token: ', longLiveUserToken);

    const pagesData = await _queryFacebookApi('/me/accounts', {
      access_token: longLiveUserToken
    })

    console.log('>>>> externalApis.js#getFacebookPageCredentials()\t - retrieved pages data: ', pagesData);

    // TODO: let user choose what pages to subscribe to
    const firstPage = pagesData.data[0]

    const accessToken = firstPage.access_token
    const pageId = firstPage.id

    //subscribe to the page
    // TODO: don't subscribe multiple times
    await _queryFacebookApi(`/${pageId}/subscribed_apps`, {access_token: accessToken}, 'POST')

    console.log('>>>> externalApis.js#getFacebookPageCredentials()\t - subscribed to the page: ', pageId);
    return {accessToken, pageId}
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
    return _queryFacebookApi(`/${leadId}`, {accessToken})
  },

  getTaistCompanyIdByPageId (pageId) {
    const keyPath = [constants.integrationSettingsKey, constants.facebookPageIdKeyInSettings].join('.');

    return _queryTaistAddonApi('/companyIdByKey', {
      keyPath,
      keyValue: pageId,
    });
  },
};

function _queryTaistAddonApi (path, params, method) {
  const fullParams = Object.assign({
    accessToken: taistAddonAccessToken,
  }, params);

  return _queryRemoteApi(taistApiRoot, path, fullParams, method);
}

function _queryFacebookApi (path, params, method) {
  return _queryRemoteApi(facebookApiRoot, path, params, method);
}

async function _queryRemoteApi (rootUrl, path, params, method = 'GET') {
  let url = rootUrl + path;

  const shouldPathParamsInUrl = method === 'GET'

  const paramsOptionKey = shouldPathParamsInUrl ? 'qs' : 'body'

  const requestOptions = {
    method,
    uri: url,
    [paramsOptionKey]: params,
    json: true
  };

  console.log('>>>> externalApis.js#_queryRemoteApi()\t - senging request: ', requestOptions);

  try {
    return await request(requestOptions);
  }
  catch (error) {
    console.log('>>>> externalApis.js#_queryRemoteApi()\t - error in request: ', error, requestOptions.uri);

    throw error
  }
}
