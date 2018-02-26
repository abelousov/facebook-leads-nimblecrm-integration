import nimbleApp from './nimble/app'

export default {
  start: function (taistApi) {
    if (window.location.host.match(/nimble\.com/i)) {
      nimbleApp.start(taistApi)
    }
  }
}
