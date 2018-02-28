import React from 'react';
import constants from '../../../shared/constants';
import facebookSdk from "../services/facebookSdk";

import taistApiSingleton from '../../taistApiSingleton';
import SettingsForm from "./SettingsForm";

import nimbleApi from '../services/nimbleApi'

// TODO: move all logic out to services
export default class IntegrationSettings extends React.Component {
  state = {
    loaded: false,
    settingsData: null,
    isLoggedIntoFacebook: false,
    nimbleListData: null,
  };

  componentDidMount () {
    this._load();
  }

  render () {
    if (this.state.loaded) {
      return <div>
        <h3>Facebook integration settings:</h3>
        <br/>
        <div>
          {this.state.isLoggedIntoFacebook ? null : this._renderFacebookLogin()}
        </div>
        <SettingsForm
          value={this.state.settingsData}
          nimbleListData={this.state.nimbleListData}
          onChange={(newSettings => this._saveSettings(newSettings))}
        />
      </div>;
    }
    else {
      // TODO: return spinner here
      return null;
    }
  }

  async _load () {
    await this._reloadIntegrationSettings();
    await this._checkFacebookLogin();

    this.setState({ loaded: true });
  }

  _renderFacebookLogin () {
    return facebookSdk.renderFacebookLoginButton({ onLogin: (loginResult) => this._onLoginAttemptFinish(loginResult) });
  }

  async _onLoginAttemptFinish (loginResult) {
    const loginSucceeded = !!loginResult.accessToken;

    if (loginSucceeded) {
      this.setState({
        isLoggedIntoFacebook: true,
      });

      const settingsUpdate = Object.assign({}, this.state.settingsData, {
        [constants.facebookPageIdKeyInSettings]: loginResult.pageId,
        [constants.facebookAccessTokenKeyInSettings]: loginResult.accessToken,
      });

      await this._updateSettings(settingsUpdate);
    }
  }

  async _updateSettings (updateHash) {
    const updatedSettings = Object.assign({}, this.state.settingsData, updateHash);

    await this._saveSettings(updatedSettings);
  }

  async _saveSettings (newSettings) {
    await new Promise((resolve) => {
      // TODO: update SDK to enable partial change to avoid possible overwrite of conflicting changes
      taistApiSingleton.get().companyData.set(constants.integrationSettingsKey, newSettings, (error) => {
        resolve();
      });
    });

    await this._reloadIntegrationSettings();
  }

  async _reloadIntegrationSettings () {
    await this._loadStoredSettings()
    nimbleApi.useAccessToken(this.state.settingsData[constants.nimbleAccessTokenKeyInSettings])

    await this._reloadNimbleData()
  }

  async _loadStoredSettings () {
    // TODO: update SDK to promise-based version
    // or convert to promises locally
    return new Promise((resolve) => {
      taistApiSingleton.get().companyData.get(constants.integrationSettingsKey, (error, settingsData) => {

        // TODO: improve handling of †he default value
        this.setState({ fetchingSettings: false, settingsData: settingsData || {} });
        resolve();
      });
    });
  }

  async _reloadNimbleData () {
    let nimbleListData = null
    if (nimbleApi.isAvailable()) {
      nimbleListData = {
        pipelines: await nimbleApi.getPipelines(),
        //users: await nimbleApi.getUsers()
      }
    }

    this.setState({nimbleListData})
  }

  async _checkFacebookLogin () {
    const loginResult = await facebookSdk.checkLogin();
    this._onLoginAttemptFinish(loginResult);
  }
}
