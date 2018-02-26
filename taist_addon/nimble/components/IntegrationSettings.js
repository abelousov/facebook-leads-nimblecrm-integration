import React from 'react';
import constants from '../../../shared/constants';
import facebookSdk from "../services/facebookSdk";

import taistApiSingleton from '../../taistApiSingleton';

// TODO: move all logic out to services
export default class IntegrationSettings extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      settingsData: null,
      fetchingSettings: false,
      facebookLoginStatus: null,
    };
  }

  async componentDidMount () {
    this._fetchInitialData();
  }

  render () {
    console.log('>>>> IntegrationSettings.js#render()\t - !!!!!!!: ', this.state,
      this._isStateStable(),
      this._isIntegrationSet(),
      this._isFacebookLoggedIn());

    if (this._isStateStable()) {
      if (this._isIntegrationSet() || this._isFacebookLoggedIn()) {
        return this._renderSettingsUI();
      }

      else {
        return this._renderFacebookLogin();
      }
    }

    else {
      // TODO: return spinner here
      return null;
    }
  }

  _isStateStable () {
    return !this.state.fetchingSettings && !this.state.loggingIntoFacebook
  }

  async _fetchInitialData () {
    await this._fetchIntegrationSettings();

    if (!this._isIntegrationSet()) {
      if (!this._isFacebookLoginChecked()) {
        await this._checkFacebookLogin();
      }
    }
  }

  _renderSettingsUI () {
    // TODO: allow user to set an api access token to use
    return <div>
      <h3>Facebook integration settings:</h3>
      <span>Nimble API access token: {this.state.settingsData[constants.nimbleAccessTokenKeyInSettings]}</span>
      <br/>
    </div>;
  }

  _renderFacebookLogin () {
    return <h2
      onClick={() => this._loginToFacebook()}
    >
      Login to facebook to set up the integration
    </h2>
  }

  async _loginToFacebook () {
    this.setState({ loggingIntoFacebook: true})
    const loginResult = await facebookSdk.login()
    this._onLoginAttemptFinish(loginResult)
  }

  _onLoginAttemptFinish(loginResult) {
    const loginStatus = loginResult.status;

    this.setState({
      facebookLoginStatus: loginStatus,
      loggingIntoFacebook: false
    });

    if (loginStatus === constants.facebookLoginStatuses.SUCCESS) {
      // TODO: render UI to choose available page to use
      const pageId = constants.stubFacebookPageId

      // TODO: render UI to set and store nimble api access token
      const updatedIntegrationSettings = Object.assign({}, this.state.settingsData, {
        [constants.facebookPageIdKeyInSettings]: pageId,
        [constants.facebookAccessTokenKeyInSettings]: loginResult.accessToken,
        [constants.nimbleAccessTokenKeyInSettings]: stubNimbleApiAccessToken,
      });

      console.log('>>>> IntegrationSettings.js#_onLoginAttemptFinish()\t - updating integration settings: ', updatedIntegrationSettings);

      return new Promise((resolve) => {
        // TODO: update SDK to enable partial change to avoid possible overwrite of conflicting changes
        taistApiSingleton.get().companyData.set(constants.integrationSettingsKey, updatedIntegrationSettings, (error) => {
          // TODO: consider refetching settings instead of manual update
          this.setState({ settingsData: updatedIntegrationSettings});
          resolve()
        });
      })
    }
  }

  async _fetchIntegrationSettings () {
    this.setState({ fetchingSettings: true });

    // TODO: update SDK to promise-based version
    // or convert to promises locally
    return new Promise((resolve) => {
      taistApiSingleton.get().companyData.get(constants.integrationSettingsKey, (error, settingsData) => {
        console.log('>>>> IntegrationSettings.js#received settings data()\t - : ', { settingsData, error });
        // TODO: improve handling of †he default value
        this.setState({ fetchingSettings: false, settingsData: settingsData || {} });
        resolve()
      });
    });
  }

  async _checkFacebookLogin () {
    this.setState({ loggingIntoFacebook: true })
    const loginResult = await facebookSdk.checkLogin();
      this._onLoginAttemptFinish(loginResult)
  }

  _isIntegrationSet () {
    let settingsData = this.state.settingsData;
    return settingsData && settingsData[constants.facebookPageIdKeyInSettings] && settingsData[constants.facebookAccessTokenKeyInSettings];
  }

  _isFacebookLoginChecked () {
    return !!this.state.facebookLoginStatus;
  }

  _isFacebookLoggedIn () {
    return this.state.facebookLoginStatus === constants.facebookLoginStatuses.SUCCESS;
  }
}

const stubNimbleApiAccessToken = 'm5yWTtuLy1clR9RQVBBbuz0fES2nBD'
