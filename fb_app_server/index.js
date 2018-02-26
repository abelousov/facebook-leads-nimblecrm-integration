var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var xhub = require('express-x-hub');
var path = require('path')

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));

app.use(xhub({ algorithm: 'sha1', secret: process.env.FACEBOOK_APP_SECRET }));
app.use(bodyParser.json());

var token = process.env.FACEBOOK_WEBHOOK_VERIFICATION_TOKEN || 'token';
var received_updates = [];

app.get('/debug', function(req, res) {
  console.log(req);
  res.send('<pre>' + JSON.stringify(received_updates, null, 2) + '</pre>');
});

const facebookWebhookEndpointPath = '/facebook'

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

app.use('/', express.static(path.join(__dirname, 'public')))

app.listen();
