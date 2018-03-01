import remoteRequest from './remoteRequest';
import constants from '../../../shared/constants';

export default {
  // TODO: incapsulate access token inside this api
  useAccessToken (accessToken) {
    this._accessToken = accessToken;
  },

  isAvailable () {
    return !!this._accessToken;
  },

  async getPipelines () {
    const pipelinesResponse = await this._sendRequest({
      path: '/deals/pipelines',
      method: 'GET'
    })

    return pipelinesResponse.pipelines;
  },

  async getUsers () {
    // TODO: fix this: users are in obsolete api branch that uses different auth scheme without long-living tokens
    throw new Error('Not implemented: requires use of the obsolete api')
    const usersResponse = await this._sendRequest({
      path: '/users?page=1&per_page=1000&verbosity=list',
      method: 'GET'
    })

    return usersResponse.resources;
  },

  async _sendRequest ({ path, method }) {
    return await remoteRequest({
      root: constants.nimbleApiRoot,
      path,
      method,
      headers: {
        "Authorization": "Bearer " + this._accessToken,
      },
    });
  },
};
