import remoteRequest from './remoteRequest';
import constants from '../../../shared/constants';
import xmlHttpProxy from "./xmlHttpProxy";

export default {
  _oldShortTermAccessToken: null,

  init () {
    // we need user's access token for some api calls that are not implemented in the modern api yet
    this._watchForOldAccessTokenInRequests();
  },
  // TODO: incapsulate access token inside this api
  useAccessToken (accessToken) {
    this._accessToken = accessToken;
  },

  isAvailable () {
    return !!this._accessToken && !!this._oldShortTermAccessToken;
  },

  async getPipelines () {
    const pipelinesResponse = await this._requestModernApi({
      path: '/deals/pipelines',
      method: 'GET',
    });

    return pipelinesResponse.pipelines;
  },

  async getUsers () {
    const usersResponse = await this._requestOldApi({
      path: '/users?page=1&per_page=1000&verbosity=list',
      method: 'GET',
    });

    return usersResponse.resources;
  },

  _watchForOldAccessTokenInRequests () {
    xmlHttpProxy.onRequestFinish((request) => {
      const url = request.responseURL;
      const tokenMatches = url.match(/\/api\/sessions\/([0-9abcdef-]{36})\?/);
      if (tokenMatches != null) {
        this._oldShortTermAccessToken = tokenMatches[1];
      }
    });
  },

  async _requestModernApi ({ path, method }) {
    return await remoteRequest({
      root: constants.nimbleApiRoot,
      path,
      method,
      headers: {
        "Authorization": "Bearer " + this._accessToken,
      },
    });
  },

  async _requestOldApi ({ path, method }) {
    return await remoteRequest({
      root: constants.nimbleOldApiRoot,
      path,
      method,
      headers: {
        "Authorization": `Nimble token="${this._oldShortTermAccessToken}"`,
      },
    });
  },
};
