import taistApiSingleton from '../../taistApiSingleton';

export default async function sendRemoteRequest ({root, path, method, headers}) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers
    }

    // TODO: update obsolete method name in Taist SDK
    taistApiSingleton.get().proxy.jQueryAjax(root, path, options, (error, response) => {
      error
        ? reject(error)
        : resolve(response.result)
    })
  })
}
