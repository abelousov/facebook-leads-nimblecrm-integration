module.exports = {
  integrationSettingsKey: 'integrationSettings',
  facebookPageIdKeyInSettings: 'facebookPageId',
  facebookAccessTokenKeyInSettings: 'facebookAccessToken',
  nimbleAccessTokenKeyInSettings: 'nimbleAccessToken',
  facebookAppId: '353235065155542',
  facebookLoginStatuses: {
    SUCCESS: 'connected'
  },

  facebookLoginCallbackPath: '/loginCallback',

  // TODO: use environment variables here:
  // environments should not depend on webpack build targets (dev/production),
  // so that a development version could be build that uses production config

  //appServerRootUrl: 'https://facebook-leads-nimblecrm.herokuapp.com',
  appServerRootUrl: 'localhost:5000',

  pageCredentialsEndpoint: '/facebookPageCredentials',

  nimblePipelineIdKeyInSettings: 'nimblePipelineId',
  nimbleStageIdKeyInSettings: 'nimbleStageId',
  nimbleResponsibleIdKeyInSettings: 'nimbleResponsibleId',

  nimbleApiRoot: 'https://app.nimble.com/api/v1'
}
