import axios from 'axios';
import { FightParser } from './fightParser.js';

export default class UfcService {
  static EVENTS_URL = 'https://www.ufc.com/events';
  
  constructor() {
    this.parser = new FightParser();
  }

  /**
   * Fetch upcoming UFC events
   * @returns {Promise<string|undefined>} HTML content or undefined if error
   */
  async fetchEvents() {
    return this.fetchData(UfcService.EVENTS_URL);
  }

  /**
   * Get the next upcoming UFC event with full details
   * @returns {Promise<Object|null>} Event object with fights and details or null if error
   */
  async getUpcomingEvent() {
    try {
      console.log('🔍 Fetching UFC events...');
      
      // Get the events page
      const eventsHtml = await this.fetchEvents();
      if (!eventsHtml) {
        console.log('❌ Failed to fetch events page');
        return null;
      }

      // Parse event links
      const eventLinks = this.parser.parseEvents(eventsHtml);
      console.log(`📅 Found ${eventLinks.length} event links`);

      if (eventLinks.length === 0) {
        console.log('❌ No upcoming events found');
        return null;
      }

      // Get the next upcoming event
      const upcomingEventLink = this.parser.getNextUpcomingEvent(eventLinks);
      if (!upcomingEventLink) {
        console.log('❌ No upcoming event link found');
        return null;
      }

      console.log(`🎯 Fetching event details from: ${upcomingEventLink}`);

      // Fetch the event details page
      const eventHtml = await this.fetchData(upcomingEventLink);
      if (!eventHtml) {
        console.log('❌ Failed to fetch event details');
        return null;
      }

      // Parse the event details
      const event = this.parser.parseEvent(eventHtml);
      
      if (!event) {
        console.log('❌ Failed to parse event details - no fight data found');
        return null;
      }
      
      console.log(`✅ Successfully parsed event: ${event.title || 'Unknown'}`);

      return {
        ...event,
        url: upcomingEventLink
      };
    } catch (error) {
      console.error('❌ Error getting upcoming event:', error.message);
      return null;
    }
  }

  /**
   * Fetch data from the specified URL
   * @param {string} url UFC URL to fetch data from
   * @returns {Promise<string|undefined>} Response data or undefined if error
   */
  async fetchData(url) {
    try {
      const res = await axios.get(url, {
        timeout: 8000, // Reduced timeout to 8 seconds
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
      });
      return res.data;
    } catch (error) {
      console.error(`❌ Failed to fetch data from ${url}:`, error?.message || error);
      return undefined;
    }
  }
}