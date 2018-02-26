import jquery from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import IntegrationSettings from '../components/IntegrationSettings'

export default class UiInjector {
  constructor (taistApi, dataApi) {
    this._taistApi = taistApi
    this._dataApi = dataApi
  }

  renderSettings () {
    this._taistApi.wait.elementRender('.applicationsContainer', (parent) => {
      const container = this._getInjectedUiContainer({
        parent,
        tagName: 'div',
        shouldAppendToParent: true,
      })

      ReactDOM.render(<IntegrationSettings
        dataApi={this._dataApi}
      />, container)
    })
  }

  _getInjectedUiContainer ({parent, tagName}) {
    let container = jquery('.taistContainer', parent);
    if (!container.length) {
      container = jquery("<" + tagName + " class=\"taistContainer\">");
      container.appendTo(parent);
    }
    return container[0];
  }
}
