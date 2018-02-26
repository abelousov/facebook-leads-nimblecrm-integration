import nimbleApp from './nimble/app';

export default function init () {
  return {
    start (taistApi) {
      console.log('>>>> index.js#start()\t - starting addon: ', window.location);
      if (window.location.host.match(/nimble\.com/i)) {
        console.log('>>>> index.js#start()\t - starting nimble part: ');
        nimbleApp.start(taistApi);
      }
    },
  };
}
