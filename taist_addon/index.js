import nimbleApp from './nimble/app';
import Q from 'q'

import taistApiSingleton from './taistApiSingleton'

export default function init () {
  return {
    start (taistApi) {
      taistApiSingleton.init(taistApi)

      if (window.location.host.match(/nimble\.com/i)) {
        nimbleApp.start(taistApi);
      }
    },
  };
}
