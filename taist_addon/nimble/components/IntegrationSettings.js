import React from 'react';
import constants from '../../../shared/constants';
import facebookSdk from "../services/facebookSdk";

import taistApiSingleton from '../../taistApiSingleton';

// TODO: move all logic out to services
export default class IntegrationSettings extends React.Component {
  state = {
    loaded: false,
    settingsData: null,
    isLoggedIntoFacebook: false,
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
        <div>
          <form onSubmit={(event) => {
            this._saveUpdatedSettings();
            event.preventDefault();
          }}>
            <label>
              Nimble API access token:
              <input
                type="text"
                value={this._getNimbleAccessToken() || ''}
                onChange={(event) => this._updateSettingsWithoutSave({
                [constants.nimbleAccessTokenKeyInSettings]: event.target.value
              })}
              />
            </label>
            <div>
              <input type="submit" value="Save"/>
            </div>
          </form>
        </div>
      </div>;
    }
    else {
      // TODO: return spinner here
      return null;
    }
  }

  _getNimbleAccessToken () {
    return this.state.settingsData[constants.nimbleAccessTokenKeyInSettings];
  }

  async _load () {
    await this._fetchIntegrationSettings();
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

      this._updateSettingsWithoutSave(settingsUpdate);
      await this._saveUpdatedSettings();
    }
  }

  _updateSettingsWithoutSave (updateHash) {
    console.log('>>>> IntegrationSettings.js#_updateSettingsWithoutSave()\t - updating settings: ', updateHash);
    const updatedSettings = Object.assign({}, this.state.settingsData, updateHash);

    this.setState({settingsData: updatedSettings})
  }

  async _saveUpdatedSettings () {
    await new Promise((resolve) => {
      // TODO: update SDK to enable partial change to avoid possible overwrite of conflicting changes
      taistApiSingleton.get().companyData.set(constants.integrationSettingsKey, this.state.settingsData, (error) => {
        resolve();
      });
    });

    await this._fetchIntegrationSettings();
  }

  async _fetchIntegrationSettings () {
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

  async _checkFacebookLogin () {
    const loginResult = await facebookSdk.checkLogin();
    this._onLoginAttemptFinish(loginResult);
  }
}
