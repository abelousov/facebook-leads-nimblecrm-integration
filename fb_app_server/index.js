require('dotenv').config()

var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var xhub = require('express-x-hub');
var path = require('path')
var request = require('request-promise-native')

var constants = require('../shared/constants')

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));

let appSecret = process.env.FACEBOOK_APP_SECRET;

app.use(xhub({ algorithm: 'sha1', secret: appSecret }));
app.use(bodyParser.json());

var token = process.env.FACEBOOK_WEBHOOK_VERIFICATION_TOKEN || 'token';
var receivedUpdates = [];

app.get('/debug', function(req, res) {
  console.log(req);
  res.send('<pre>' + JSON.stringify(receivedUpdates, null, 2) + '</pre>');
});

// TODO: fix path name (will require re-verification)

const facebookWebhookEndpointPath = '/facebook'
const loginCallbackPath = '/loginCallback'

// TODO: account for production as well, retrieve dynamically
const rootUrl = 'http://localhost:5000'
const fullRedirectUri = rootUrl + loginCallbackPath

app.get(facebookWebhookEndpointPath, function(req, res) {
  if (
    req.param('hub.mode') == 'subscribe' &&
    req.param('hub.verify_token') == token
  ) {
    res.send(req.param('hub.challenge'));
  } else {
    res.sendStatus(400);
  }
});

app.post(facebookWebhookEndpointPath, function(req, res) {
  console.log('Facebook request body:', req.body);

  if (!req.isXHubValid()) {
    console.log('Warning - request header X-Hub-Signature not present or invalid');
    res.sendStatus(401);
    return;
  }

  console.log('request header X-Hub-Signature validated');
  // Process the Facebook updates here

  const result = JSON.parse(req.body)
  receivedUpdates.unshift(result);

  result.entry.forEach((leadEntry) => {
    const firstChange = leadEntry.changes[0]
    _pushLead({
      id: leadEntry.id,
      formId: firstChange.value.form_id,
      pageId: firstChange.value.page_id
    })
  })
  res.sendStatus(200);
});

async function _pushLead ({id, formId, pageId}) {
  const taistCompanyId = await _getTaistCompanyIdByPageId(pageId)
  const integrationSettings = await _getIntegrationSettings(taistCompanyId)

  const lead = await _getFacebookLeadInfo({
    accessToken: integrationSettings[constants.facebookAccessTokenKeyInSettings],
    leadId: id
  })

  //TODO: associate forms with campaigns or some custom field
  await _pushLeadToNimble({
    accessToken: integrationSettings[constants.nimbleAccessTokenKeyInSettings],
    lead
  })
}

function _getTaistCompanyIdByPageId (pageId) {

}

function _getIntegrationSettings (taistCompanyId) {

}

function _getFacebookLeadInfo ({accessToken, leadId}) {

}

function _pushLeadToNimble({accessToken, lead}) {

}

app.get(loginCallbackPath, function(req, res) {
  console.log('>>>> index.js#login callback()\t - : ', req);

  res.sendStatus(200)
})

app.get(`${constants.longTermAccessTokenEndpoint}/:shortTermToken`, async function (req, res) {
  const shortTermToken = req.param('shortTermToken')

  let url = `https://graph.facebook.com/v2.11/oauth/access_token?fb_exchange_token=${shortTermToken}&client_secret=${appSecret}&client_id=${constants.facebookAppId}&redirect_uri=${fullRedirectUri}&grant_type=fb_exchange_token`;

  try {
    const body = await request({
      uri: url,
      json: true
    })

    console.log('>>>> index.js#retrieved token()\t - : ', body);
    res.send(body)
  }
  catch (error) {
    // TODO: process error appropriately
    res.send(error, 500)
  }
})

app.use('/', express.static(path.join(__dirname, 'public')))

app.listen();
