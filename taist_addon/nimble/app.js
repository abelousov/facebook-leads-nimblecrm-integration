import UInjector from './services/uiInjector'
import facebookSdk from './services/facebookSdk'
import nimbleApi from "./services/nimbleApi";

export default {
  async start (taistApi) {
    this._uiInjector = new UInjector(taistApi)

    nimbleApi.init()
    await facebookSdk.init()
    this._setRoutes(taistApi)
  },

  _setRoutes (taistApi) {
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
