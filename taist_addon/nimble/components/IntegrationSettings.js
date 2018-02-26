import React from 'react';
import constants from '../constants';
import facebookSdk from "../services/facebookSdk";

import taistApiSingleton from '../../taistApiSingleton';

// TODO: move all logic out to services
export default class IntegrationSettings extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      settingsFetched: false,
      facebookConnected: false,
    };
  }

  async componentDidMount () {
    this._fetchInitialData();
  }

  render () {
    console.log('>>>>>>>>>>> IntegrationSettings.js#render()\t - state: ', this.state);

    if (this._isStateStable()) {
      if (this._integrationIsSet() || this._facebookLoggedIn()) {
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
    return this.state.settingsFetched && this._facebookLoginChecked()
  }

  async _fetchInitialData () {
    //async componentDidUpdate() {
    console.log('>>>> IntegrationSettings.js#componentDidMount()\t - did mount: ',);
    await this._fetchIntegrationSettings();

    console.log('>>>> IntegrationSettings.js#_fetchInitialData()\t - fetched settings: ', this._integrationIsSet());
    if (!this._integrationIsSet()) {
      if (!this._facebookLoginChecked()) {
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
    console.log('>>>> IntegrationSettings.js#_checkFacebookLogin()\t - fb login status: ', loginResult);
    this.setState({
      facebookLoginStatus: loginResult.status,
    });
  }

  async _fetchIntegrationSettings () {
    this.setState({ settingsFetched: false });

    console.log('>>>> IntegrationSettings.js#_fetchIntegrationS   ettings()\t - fetching data: ', constants, this.props.dataApi);

    // TODO: update SDK to promise-based version
    // or convert to promises locally
    return new Promise((resolve) => {
      taistApiSingleton.get().companyData.get(constants.integrationSettingsKey, (error, settingsData) => {
        console.log('>>>> IntegrationSettings.js#received settings data()\t - : ', { settingsData, error });
        this.setState({ settingsFetched: true, settingsData });
      });

      resolve();
    });
  }

  async _checkFacebookLogin () {
    console.log('>>>> IntegrationSettings.js#_fetchInitialData()\t - checking FB login');

    try {
      const loginResult = await facebookSdk.checkLogin();
      this._onLoginAttemptFinish(loginResult)
    }

    catch (error) {
      console.log('>>>> IntegrationSettings.js#_checkFacebookLogin()\t - ERROR while checking login: ', error);
    }
  }

  _integrationIsSet () {
    return this.state.settingsData && this.state.settingsData[constants.facebookPageIdKeyInSettings];
  }

  _facebookLoginChecked () {
    return !!this.state.facebookLoginStatus;
  }

  _facebookLoggedIn () {
    return this.state.facebookLoginStatus === 'connected';
  }
}
