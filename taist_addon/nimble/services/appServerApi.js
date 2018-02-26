import backendApiFactory from './backendApiFactory'
import constants from '../../../shared/constants';

export default backendApiFactory({
  host: constants.appServerRootUrl,

  // TODO: gether api routes under some path fragment
  apiRootPath: ''
})
