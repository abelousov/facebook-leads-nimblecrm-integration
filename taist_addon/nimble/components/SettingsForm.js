import constants from '../../../shared/constants';
import React from 'react';

export default class SettingsForm extends React.Component {
  state = {
    settingsUpdate: {},
  };
  render () {
    return <div>
      <form onSubmit={(event) => {
        this.props.onChange(this._getCurrentSettings());
        event.preventDefault();
      }}>
        {this._renderTextInput('Nimble API access token:', constants.nimbleAccessTokenKeyInSettings)}

        {!!this.props.nimbleListData
          ? <div>
            {this._renderSelectInput('Pipeline:', constants.nimblePipelineIdKeyInSettings, this._getPipelineOptions())}

            {/*TODO: fix nimbleAPi.getUsers to use this*/}
            {/*{this._renderSelectInput('Responsible:', constants.nimbleResponsibleIdKeyInSettings, this._getResponsibleOptions())}*/}

            {this._renderJsonInput('Field mapping: ', constants.fieldMappingKeyInSettings, DEFAULT_FIELD_MAPPING)}
          </div>
          : null
        }

        <div>
          <input type="submit" value="Save"/>
        </div>
      </form>
    </div>;
  }

  _getPipelineOptions () {
    return this.props.nimbleListData.pipelines.map((pipeline) => ({
      value: pipeline.pipeline_id,
      caption: pipeline.name
    }))
  }

  _getResponsibleOptions () {
    this.props.nimbleListData.users.map((user) => ({
      value: user.id,
      caption: user.first_name + ' ' + user.last_name
    }))
  }

  _renderTextInput (caption, settingKey) {
    return this._renderSettingInput({
      caption,
      type: 'text',
      settingKey,
      children: null,
      defaultValue: ''
    });
  }

  _renderJsonInput (caption, settingKey, defaultValue) {
    //TODO: valudate json in place
    return this._renderSettingInput({
      caption,
      type: 'textarea',
      settingKey,
      children: null,
      defaultValue
    });
  }

  _renderSelectInput (caption, settingKey, options) {
    const NOT_SET_VALUE = ''
    let notSetOption = {
      value: NOT_SET_VALUE,
      caption: 'Not set'
    };

    const allOptions = [notSetOption].concat(options)

    const renderedOptions = allOptions.map(optionData => <option
      key={optionData.value}
      value={optionData.value}>
      {optionData.caption}
    </option>);

    return this._renderSettingInput({
      caption,
      type: 'select',
      settingKey,
      children: renderedOptions,
      defaultValue: NOT_SET_VALUE
    });
  }

  _renderSettingInput ({ caption, type, settingKey, children, defaultValue}) {
    const value = this._getSettingValue(settingKey) || defaultValue;

    const props = {
      value,
      onChange: (event) => this._updateSetting(settingKey, event.target.value),
    };

    let tagName;

    switch (type) {
      case 'select':
        tagName = 'select';
        break;
      case 'textarea':
        tagName = 'textarea';
        break;
      default:
        tagName = 'input';
        props.type = type;
    }

    return <div>
      <label>
        {caption}
        {React.createElement(tagName, props, children)}
      </label>
    </div>;
  }

  _getCurrentSettings () {
    return Object.assign({}, this.props.value, this.state.settingsUpdate);
  }

  _updateSetting (key, value) {
    const newSettingsUpdate = Object.assign({}, this.state.settingsUpdate, { [key]: value });

    this.setState({ settingsUpdate: newSettingsUpdate });
  }

  _getSettingValue (settingKey) {
    return this._getCurrentSettings()[settingKey];
  }
}

const DEFAULT_FIELD_MAPPING = {
  email: "email",
  first_name: "first name",
  last_name: "last name",
  phone_number: "phone",
  'lead_gen.form_id': null,
  'lead_gen.page_id': null,
}
