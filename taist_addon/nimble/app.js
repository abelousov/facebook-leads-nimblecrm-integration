import UInjector from './services/uiInjector'
import facebookSdk from './services/facebookSdk'

export default {
  async start (taistApi, dataApi) {
    this._uiInjector = new UInjector(taistApi, dataApi)

    await facebookSdk.init()
    this._setRoutes(taistApi)
  },

  _setRoutes (taistApi, dataApi) {
    let routeProcessorsByUrlHashes = this._getRouteProcessorsByUrlHashes();

    for (let hashRegexp in routeProcessorsByUrlHashes) {
      const routeProcessor = routeProcessorsByUrlHashes[hashRegexp];
      taistApi.hash.when(hashRegexp, routeProcessor);
    }
  },

  _getRouteProcessorsByUrlHashes () {
    return {
      '^app/settings/integrations': (path) => {
        this._uiInjector.renderSettings()
      }
    }
  }
}

//proxy = require('../helpers/xmlHttpProxy');

//function extractNimbleAuthTokenFromRequest () {
//  return proxy.onRequestFinish(function (request) {
//    var tokenMatches, url;
//    url = request.responseURL;
//    tokenMatches = url.match(/\/api\/sessions\/([0-9abcdef-]{36})\?/);
//    if (tokenMatches != null) {
//      return app.options.nimbleToken = tokenMatches[1];
//    }
//  });
//};
