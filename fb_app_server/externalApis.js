const request = require('request-promise-native');
const lodash = require('lodash')

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

  getFacebookLead ({ accessToken, leadId }) {
    return _queryFacebookApi(`/${leadId}`, {access_token: accessToken})
  },

  getTaistCompanyIdByPageId (pageId) {
    const keyPath = [constants.integrationSettingsKey, constants.facebookPageIdKeyInSettings].join('.');

    return _queryTaistAddonApi('/companyIdByKey', {
      keyPath,
      keyValue: pageId,
    });
  },

  async createNimbleContactFromFacebookLead ({ integrationSettings, facebookLead, leadGenInfo, progressTracker}) {

    //const fieldMapping = integrationSettings.fieldMapping

    console.log('>>>> externalApis.js#createNimbleContactFromFacebookLead()\t - check facebookLead: ', typeof facebookLead, Object.keys(facebookLead));
    const leadOwnFeilds = facebookLead.field_data.map(fieldData => ({
      name: fieldData.name,
      // TODO: check real cases of multiple values
      value: fieldData.values.join('')
    }));

    const usableLeadGenFields = ['page_id', 'form_id', 'leadgen_id']
    const leadGenFields = usableLeadGenFields.map(fieldName => ({
      name: 'lead_gen.' + fieldName,
      value: leadGenInfo[fieldName]
    }))

    const allLeadFields = leadOwnFeilds.concat(leadGenFields)

    progressTracker.allLeadFields = allLeadFields

    const fieldMapping = {
      email: "email",
      first_name: "first name",
      last_name: "last name",
      phone_number: "phone",
      'lead_gen.form_id': null,
      'lead_gen.page_id': null,
    }

    const nimbleContactFields = {}
    allLeadFields.forEach((leadField) => {
      const nimbleFieldPath = fieldMapping[leadField.name]

      if (nimbleFieldPath) {
        lodash.set(nimbleContactFields, nimbleFieldPath, [{
          value: leadField.value,
          modifier: ''
        }])
      }
    })

    progressTracker.nimbleContactFields = nimbleContactFields

    const contact = await _queryNimbleApi('/contact', {
      record_type: 'person',
      fields: nimbleContactFields
    }, 'POST', integrationSettings.accessToken)

    return contact
  },

  createNimbleDealWithContact ({ integrationSettings, nimbleContact }) {
    return null
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

// TODO: deduplicate with client-side nimble api wrapper
function _queryNimbleApi (path, params, method, accessToken) {
  return _queryRemoteApi(constants.nimbleApiRoot, path, params, method, {
    "Authorization": "Bearer " + accessToken,
  });
}

async function _queryRemoteApi (rootUrl, path, params, method = 'GET', headers) {
  let url = rootUrl + path;

  const shouldPassParamsInUrl = method === 'GET'

  const paramsOptionKey = shouldPassParamsInUrl ? 'qs' : 'body'

  const requestOptions = {
    method,
    uri: url,
    [paramsOptionKey]: params,
    headers,
    json: true
  };

  console.log('>>>> externalApis.js#_queryRemoteApi()\t - sending request: ', requestOptions);

  try {
    return await request(requestOptions);
  }
  catch (error) {
    console.log('>>>> externalApis.js#_queryRemoteApi()\t - error in request: ', error, requestOptions.uri);

    throw error
  }
}
