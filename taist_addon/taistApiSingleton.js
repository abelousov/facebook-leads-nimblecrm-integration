export default {
  get () {
    return this._taistApi
  },

  init (taistApi) {
    window.TaistApi = taistApi
    this._taistApi = taistApi
  }
}
