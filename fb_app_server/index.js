require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const xhub = require('express-x-hub');
const path = require('path');

const constants = require('../shared/constants');
const externalApis = require('./externalApis');

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));

const appSecret = process.env.FACEBOOK_APP_SECRET;

app.use(xhub({ algorithm: 'sha1', secret: appSecret }));
app.use(bodyParser.json());

const verificationToken = process.env.FACEBOOK_WEBHOOK_VERIFICATION_TOKEN;
const receivedUpdates = [];

app.get('/debug', function (req, res) {
  res.send('<pre>' + JSON.stringify(receivedUpdates, null, 2) + '</pre>');
});

// TODO: fix path name (will require re-verification)

const facebookWebhookEndpointPath = '/facebook';

app.get(facebookWebhookEndpointPath, function (req, res) {
  if (
    req.param('hub.mode') === 'subscribe' &&
    req.param('hub.verify_token') === verificationToken
  ) {
    res.send(req.param('hub.challenge'));
  }

  else {
    res.sendStatus(400);
  }
});

app.post(facebookWebhookEndpointPath, function (req, res) {
  if (!req.isXHubValid()) {
    res.sendStatus(401);
    return;
  }

  const result = JSON.parse(req.body);

  console.log('>>>> index.js#processing entry()\t - : ', JSON.stringify(result.entry, null, 2));
  result.entry.forEach((leadEntry) => {
    const firstChange = leadEntry.changes[0];

    pushLead({
      id: leadEntry.id,
      formId: firstChange.value.form_id,
      pageId: firstChange.value.page_id,
    });
  });
  res.sendStatus(200);
});

app.get(constants.facebookLoginCallbackPath, function (req, res) {
  res.sendStatus(200);
});

async function pushLead ({ id, formId, pageId }) {
  const pushProgress = {}
  receivedUpdates.unshift(pushProgress)

  const taistCompanyId = await externalApis.getTaistCompanyIdByPageId(pageId);

  const integrationSettings = await externalApis.getIntegrationSettings(taistCompanyId);

  pushProgress.taistCompanyId = taistCompanyId
  pushProgress.integrationSettings = integrationSettings

  const lead = await externalApis.getFacebookLeadInfo({
    accessToken: integrationSettings[constants.facebookAccessTokenKeyInSettings],
    leadId: id,
  });

  //TODO: associate forms with campaigns or some custom field
  await externalApis.pushLeadToNimble({
    accessToken: integrationSettings[constants.nimbleAccessTokenKeyInSettings],
    lead,
  });
}

app.get(`${constants.longTermAccessTokenEndpoint}/:shortTermToken`, async function (req, res) {
  const shortTermToken = req.param('shortTermToken');

  try {
    const longTermToken = await externalApis.getLongTermFacebookToken(shortTermToken);
    res.send(longTermToken);
  }
  catch (error) {
    // TODO: process error appropriately
    res.send(error, 500);
  }
});

app.use('/', express.static(path.join(__dirname, 'public')));

app.listen();
