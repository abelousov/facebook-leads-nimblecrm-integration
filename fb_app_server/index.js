require('dotenv').config()

var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var xhub = require('express-x-hub');
var path = require('path')
var request = require('request')

var constants = require('../shared/constants')

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));

let appSecret = process.env.FACEBOOK_APP_SECRET;

app.use(xhub({ algorithm: 'sha1', secret: appSecret }));
app.use(bodyParser.json());

var token = process.env.FACEBOOK_WEBHOOK_VERIFICATION_TOKEN || 'token';
var received_updates = [];

app.get('/debug', function(req, res) {
  console.log(req);
  res.send('<pre>' + JSON.stringify(received_updates, null, 2) + '</pre>');
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
  received_updates.unshift(req.body);
  res.sendStatus(200);
});

app.get(loginCallbackPath, function(req, res) {
  console.log('>>>> index.js#login callback()\t - : ', req);

  res.sendStatus(200)
})

app.get(`${constants.longTermAccessTokenEndpoint}/:shortTermToken`, function (req, res) {
  const shortTermToken = req.param('shortTermToken')

  let url = `https://graph.facebook.com/v2.11/oauth/access_token?fb_exchange_token=${shortTermToken}&client_secret=${appSecret}&client_id=${constants.facebookAppId}&redirect_uri=${fullRedirectUri}&grant_type=fb_exchange_token`;
  request(url, function (error, response, body) {
    if (error) {
      // TODO: process error appropriately
      res.send(error, 500)
    }

    else {
      console.log('>>>> index.js#retrieved token()\t - : ', body);
      res.send(body)
    }
  })
})

app.use('/', express.static(path.join(__dirname, 'public')))

app.listen();
