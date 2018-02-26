import UInjector from './uiInjector'
export default {
  start (taistApi) {
    this._uiInjector = new UInjector(taistApi)
    this._setRoutes(taistApi)
  },

  _setRoutes (taistApi) {
    for (let hashRegexp of this._getRouteProcessorsByUrlHashes()) {
      const routeProcessor = routeProcessorsByHashes[hashRegexp];
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
