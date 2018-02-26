import React from 'react';
import constants from '../constants';
import facebookSdk from "../services/facebookSdk";

import taistApiSingleton from '../../taistApiSingleton';

// TODO: move all logic out to services
export default class IntegrationSettings extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      settingsData: null,
      fetchingSettings: false,
      facebookLoginStatuses: null,
    };
  }

  async componentDidMount () {
    this._fetchInitialData();
  }

  render () {
    if (this._isStateStable()) {
      if (this._integrationIsSet() || this._isFacebookLoggedIn()) {
        //console.log('>>>> IntegrationSettings.js#render()\t - rendering ui: ', this.state, this._isFacebookLoggedIn());
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
    return !this.state.fetchingSettings && this._isFacebookLoginChecked()
  }

  async _fetchInitialData () {
    await this._fetchIntegrationSettings();

    //console.log('>>>> IntegrationSettings.js#_fetchInitialData()\t - fetched settings: ', this._integrationIsSet());
    if (!this._integrationIsSet()) {
      if (!this._isFacebookLoginChecked()) {
        await this._checkFacebookLogin();
      }
    }
  }

  _renderSettingsUI () {
    return <h1>Settings be here!</h1>;
  }

  _renderFacebookLogin () {
    return <h2
      onClick={() => this._loginToFacebook()}
    >
      Login to facebook to set up the integration
    </h2>
  }

  async _loginToFacebook () {
    const loginResult = await facebookSdk.login()
    this._onLoginAttemptFinish(loginResult)
  }

  _onLoginAttemptFinish(loginResult) {
    const loginStatus = loginResult.status;

    this.setState({
      facebookLoginStatuses: loginStatus,
    });

    if (loginStatus === constants.facebookLoginStatuses.SUCCESS) {
      const updatedIntegrationSettings = Object.assign({}, this.state.settingsData, {
        [constants.facebookPageIdKeyInSettings]: loginResult.pageId,
        [constants.facebookAccessTokenKeyInSettings]: loginResult.accessToken
      });

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
      const loginResult = await facebookSdk.checkLogin();
      this._onLoginAttemptFinish(loginResult)
  }

  _integrationIsSet () {
    return this.state.settingsData && this.state.settingsData[constants.facebookPageIdKeyInSettings];
  }

  _isFacebookLoginChecked () {
    return !!this.state.facebookLoginStatuses;
  }

  _isFacebookLoggedIn () {
    return this.state.facebookLoginStatuses === constants.facebookLoginStatuses.SUCCESS;
  }
}
