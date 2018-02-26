import jquery from 'jquery'
import ReactDOM from 'react-dom';
import IntegrationSettings from './components/IntegrationSettings'
export default class UiInjector {
  constructor (taistApi) {
    this._taistApi = taistApi
  }

  renderSettings () {
    this._taistApi.wait.elementRender('.applicationsContainer', (parent) => {
      const container = this._getInjectedUiContainer({
        parent,
        tagName: 'div',
        shouldAppendToParent: true,
      })

      ReactDOM.render(<IntergrationSettings
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
