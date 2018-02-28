import remoteRequest from './remoteRequest'
import constants from '../../../shared/constants';

export default {
  get (path) {
    return _sendRequest({path, method: 'GET'})
  }
}
async function _sendRequest ({path, method}) {
  return remoteRequest({
    root: constants.appServerRootUrl,
    path,
    method
  })
}
