# Integration of Facebook Lead Ads and NimbleCRM

## How it works
* A [Facebook app](https://developers.facebook.com/apps/353235065155542) receives new leads from Facebook via webhooks and adds them to NimbleCRM.
  All required integration settings are retrieved from Taist addon data
* A [Taist addon](https://www.tai.st/addons/facebook-nimble-integration) for NimbleCRM is used to:
  * add integration settings UI to NimbleCRM
  * extend NimbleCRM Leads UI to display connections with Facebook leads and campaigns

## How to use
See [Taist addon page](https://www.tai.st/addons/facebook-nimble-integration) for usage instructions

## Repo structure
* `fb_app_server` - facebook app server that processes webhook calls
* `taist_addon` - Taist addon
