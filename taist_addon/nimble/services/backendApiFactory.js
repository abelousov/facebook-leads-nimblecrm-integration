import taistApiSingleton from '../../taistApiSingleton';

export default function createApiAccessor ({host, apiRootPath}) {
  return {
    async get (path) {
      return await _sendRequest(path, 'GET', {})
    },
  }

  async function _sendRequest(path, method, settings) {
    const fullPath = path + apiRootPath
    return new Promise((resolve, reject) => {
      // TODO: Taist SDK - update obsolete method name
      const fullSettings = Object.assign({ method }, settings);

      console.log('>>>> backendApiFactory.js#()\t - sengind proxy request: ', { host, fullPath, fullSettings})
      ;
      taistApiSingleton.get().proxy.jQueryAjax(host, fullPath, fullSettings, (error, result) => {
        console.log('>>>> backendApiFactory.js#()\t - finished request: ', {host, fullPath, method, error, result});
        error
          ? reject(error)
          : resolve(result)
      })
    })
  }
}
