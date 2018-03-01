const request = require('request-promise-native');
const lodash = require('lodash');

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

    const longLiveUserToken = longLiveUserTokenResponse.access_token;

    console.log('>>>> externalApis.js#getFacebookPageCredentials()\t - retrieved long live user token: ', longLiveUserToken);

    const pagesData = await _queryFacebookApi('/me/accounts', {
      access_token: longLiveUserToken,
    });

    console.log('>>>> externalApis.js#getFacebookPageCredentials()\t - retrieved pages data: ', pagesData);

    // TODO: let user choose what pages to subscribe to
    const firstPage = pagesData.data[0];

    const accessToken = firstPage.access_token;
    const pageId = firstPage.id;

    //subscribe to the page
    // TODO: don't subscribe multiple times
    await _queryFacebookApi(`/${pageId}/subscribed_apps`, { access_token: accessToken }, 'POST');

    console.log('>>>> externalApis.js#getFacebookPageCredentials()\t - subscribed to the page: ', pageId);
    return { accessToken, pageId };
  },

  getIntegrationSettings (taistCompanyId) {
    return _queryTaistAddonApi('/companyData', {
      companyId: taistCompanyId,
      key: constants.integrationSettingsKey,
    });
  },

  getFacebookLead ({ accessToken, leadId }) {
    return _queryFacebookApi(`/${leadId}`, { access_token: accessToken });
  },

  getTaistCompanyIdByPageId (pageId) {
    const keyPath = [constants.integrationSettingsKey, constants.facebookPageIdKeyInSettings].join('.');

    return _queryTaistAddonApi('/companyIdByKey', {
      keyPath,
      keyValue: pageId,
    });
  },

  async createNimbleContactFromFacebookLead ({ integrationSettings, facebookLead, leadGenInfo, progressTracker }) {

    console.log('>>>> externalApis.js#createNimbleContactFromFacebookLead()\t - check facebookLead: ', typeof facebookLead, Object.keys(facebookLead));
    const leadOwnFeilds = facebookLead.field_data.map(fieldData => ({
      name: fieldData.name,
      // TODO: check real cases of multiple values
      value: fieldData.values.join(''),
    }));

    const usableLeadGenFields = ['page_id', 'form_id', 'leadgen_id'];
    const leadGenFields = usableLeadGenFields.map(fieldName => ({
      name: 'lead_gen.' + fieldName,
      value: leadGenInfo[fieldName],
    }));

    const allLeadFields = leadOwnFeilds.concat(leadGenFields);

    progressTracker.allLeadFields = allLeadFields;

    // TODO: enable user to set it
    const contactFieldMapping = {
      email: { path: "email", modifier: "personal" },
      first_name: { path: "first name", modifier: '' },
      last_name: { path: "last name", modifier: '' },
      // TODO: add support of modifiers
      phone_number: { path: "phone", modifier: "main" },
      'lead_gen.form_id': null,
      'lead_gen.page_id': null,
    };

    const nimbleContactFields = {};
    allLeadFields.forEach((leadField) => {
      const nimbleFieldDescription = contactFieldMapping[leadField.name];

      if (nimbleFieldDescription) {
        lodash.set(nimbleContactFields, nimbleFieldDescription.path, [{
          value: leadField.value,
          modifier: nimbleFieldDescription.modifier,
        }]);
      }
    });

    progressTracker.nimbleContactFields = nimbleContactFields;

    const contact = await _queryNimbleApi('/contact', {
      record_type: 'person',
      fields: nimbleContactFields,
    }, 'POST', integrationSettings[constants.nimbleAccessTokenKeyInSettings]);

    return contact;
  },

  createNimbleDealWithContact ({ integrationSettings, nimbleContact, nimblePipeline}) {
    function _getContactField(fieldName) {
      return nimbleContact.fields[fieldName].value
    }

    const startStage = nimblePipeline.stages[0]
    return _queryNimbleApi('/deals', {
       subject: `Facebook lead - ${_getContactField('first name')} ${_getContactField('last name')}`,
        "privacy": "private",
        "owner": { "id": "5a93fd6b2aada656dddca161", "first_name": "", "last_name": "" },
        "primary_contact": nimbleContact.id,
        "owner_id": integrationSettings[constants.nimbleResponsibleIdKeyInSettings],
        "stage_id": startStage.id
      },
      'POST', integrationSettings[constants.nimbleAccessTokenKeyInSettings]);
  },

  async getNimblePipeline ({ integrationSettings, id}) {
    let allPipelines = await _queryNimbleApi(`/deals/pipelines/${id}`,
      'GET', integrationSettings[constants.nimbleAccessTokenKeyInSettings]);
    return allPipelines.find(pipeline => pipeline.pipeline_id === id)
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
// TODO: instantiate services and provide auth tokens to them to not pass them from client code
function _queryNimbleApi (path, params, method, accessToken) {
  return _queryRemoteApi(constants.nimbleApiRoot, path, params, method, {
    "Authorization": "Bearer " + accessToken,
  });
}

async function _queryRemoteApi (rootUrl, path, params, method = 'GET', headers) {
  let url = rootUrl + path;

  const shouldPassParamsInUrl = method === 'GET';

  const paramsOptionKey = shouldPassParamsInUrl ? 'qs' : 'body';

  const requestOptions = {
    method,
    uri: url,
    [paramsOptionKey]: params,
    headers,
    json: true,
  };

  console.log('>>>> externalApis.js#_queryRemoteApi()\t - sending request: ', requestOptions);

  try {
    return await request(requestOptions);
  }
  catch (error) {
    console.log('>>>> externalApis.js#_queryRemoteApi()\t - error in request: ', requestOptions.uri, error.message);

    //shorten further error output
    throw new Error(error.message);
  }
}
