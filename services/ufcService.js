import axios from 'axios';

export default class ufcService {
  EVENTS_URL = 'https://www.ufc.com/events';

  async fetchEvents() {
    return this.fetchData(EVENTS_URL);
  }

  /**
   * fetch the data from the website.
   * @param {string} url UFC URL
   * @returns {Promise}
   */
  async fetchData(url) {
    try {
      res = await axios.get(url);
      data = res.data;
      return data;
    } catch (error) {
      console.error(error?.message);
      return undefined;
    }
  }
}