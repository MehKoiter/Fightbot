import axios from 'axios';

export default class UfcService {
  static EVENTS_URL = 'https://www.ufc.com/events';

  /**
   * Fetch upcoming UFC events
   * @returns {Promise<string|undefined>} HTML content or undefined if error
   */
  async fetchEvents() {
    return this.fetchData(UfcService.EVENTS_URL);
  }

  /**
   * Fetch data from the specified URL
   * @param {string} url UFC URL to fetch data from
   * @returns {Promise<string|undefined>} Response data or undefined if error
   */
  async fetchData(url) {
    try {
      const res = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'FightBot/1.0.0'
        }
      });
      return res.data;
    } catch (error) {
      console.error(`❌ Failed to fetch data from ${url}:`, error?.message || error);
      return undefined;
    }
  }
}