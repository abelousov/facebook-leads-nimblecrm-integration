export default {
  get () {
    return this._taistApi
  },

  init (taistApi) {
    console.log('>>>> taistApiSingleton.js#init()\t - exposing TaistApi');
    window.TaistApi = taistApi
    this._taistApi = taistApi
  }
}
