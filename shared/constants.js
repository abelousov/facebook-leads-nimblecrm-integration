module.exports = {
  integrationSettingsKey: 'facebookIntegrationSettings',
  facebookPageIdKeyInSettings: 'facebookPageId',
  facebookAccessTokenKeyInSettings: 'accessToken',
  facebookAppId: '353235065155542',
  facebookLoginStatuses: {
    SUCCESS: 'connected'
  },

  // TODO: use environment variables here:
  // environments should not depend on webpack build targets (dev/production),
  // so that a development version could be build that uses production config

  //appServerRootUrl: 'https://facebook-leads-nimblecrm.herokuapp.com',
  appServerRootUrl: 'localhost:5000',

  longTermAccessTokenEndpoint: '/requestLongTermAccessToken',

  stubFacebookPageId: '302533069820881',
}
