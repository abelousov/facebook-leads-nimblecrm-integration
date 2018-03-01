require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const xhub = require('express-x-hub');
const path = require('path');

const constants = require('../shared/constants');
const externalApis = require('./externalApis');

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

  const result = req.body;

  _processLeadsEntry(result.entry);
  res.sendStatus(200);
});

app.get(constants.facebookLoginCallbackPath, function (req, res) {
  res.sendStatus(200);
});

function _processLeadsEntry(entries) {
  console.log('>>>> index.js#processing entries()\t - : ', JSON.stringify(entries, null, 2));
  entries.forEach((pageEntry) => {
    pageEntry.changes.forEach((leadChange) => {
      const leadGenInfo = leadChange.value;
      pushLead(leadGenInfo);
    });
  });
}
async function pushLead (leadGenInfo) {
  const progressTracker = Object.assign({}, leadGenInfo);
  receivedUpdates.unshift(progressTracker);

  try {
    const taistCompanyId = await externalApis.getTaistCompanyIdByPageId(leadGenInfo.page_id);
    progressTracker.taistCompanyId = taistCompanyId;

    const integrationSettings = await externalApis.getIntegrationSettings(taistCompanyId);
    progressTracker.integrationSettings = integrationSettings;

    let facebookPageAccessToken = integrationSettings[constants.facebookAccessTokenKeyInSettings];

    const facebookLead = await externalApis.getFacebookLead({
      accessToken: facebookPageAccessToken,
      leadId: leadGenInfo.leadgen_id,
    });

    progressTracker.facebookLead = facebookLead;

    //TODO: associate forms with campaigns or some custom field
    //TODO: restructure settings to pass just nimble part here
    const nimbleContact = await externalApis.createNimbleContactFromFacebookLead({
      integrationSettings,
      facebookLead,
      leadGenInfo,
      progressTracker,
    });

    progressTracker.nimbleContact = nimbleContact;

    const nimblePipeline = await externalApis.getNimblePipeline({integrationSettings, id: integrationSettings[constants.nimblePipelineIdKeyInSettings]})

    progressTracker.nimblePipeline = nimblePipeline

    const nimbleDeal = await externalApis.createNimbleDealWithContact({ integrationSettings, nimbleContact, nimblePipeline});

    progressTracker.nimbleDeal = nimbleDeal;
  }
  catch (error) {
    progressTracker.error = error.message
  }
  console.log('>>>> index.js#pushLead()\t - all progress: ', progressTracker);

}

app.get(`${constants.pageCredentialsEndpoint}/:shortTermToken`, async function (req, res) {
  const shortTermToken = req.param('shortTermToken');

  try {
    const pageInfo = await externalApis.getFacebookPageCredentials(shortTermToken);
    res.send(pageInfo);
  }
  catch (error) {
    // TODO: process error appropriately
    res.send(error, 500);
  }
});

app.listen(process.env.PORT || 5000);

// local debug:
//_processLeadsEntry([{
//  "changes": [
//    {
//      "field": "leadgen",
//      "value": {
//        "created_time": 1519902625,
//        "form_id": "197099237726197",
//        "page_id": "302533069820881",
//        "leadgen_id": "197158231053631",
//      },
//      "id": "302533069820881",
//      "time": 1519902626,
//    },
//  ],
//}]);
