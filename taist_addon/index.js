import nimbleApp from './nimble/app';
import Q from 'q'

import taistApiSingleton from './taistApiSingleton'

export default function init () {
  return {
    start (taistApi) {
      taistApiSingleton.init(taistApi)

      const dataApi = _createPatchedApi(taistApi);

      if (window.location.host.match(/nimble\.com/i)) {
        nimbleApp.start(taistApi, dataApi);
      }
    },
  };
}

function _createPatchedApi(api) {
  // convert obsolete callback-based api to promises
  return {
    companyData: {
      get: Q.nbind(api.companyData.get, api.companyData),
      set: Q.nbind(api.companyData.set, api.companyData),
    },

    userData: {
      get: Q.nbind(api.userData.get, api.userData),
      set: Q.nbind(api.userData.set, api.userData),
    },
  }
}
