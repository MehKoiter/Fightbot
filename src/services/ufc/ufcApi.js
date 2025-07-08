/**
 * UFC data fetching complete implementation
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * UFC Service class for fetching and processing UFC data
 */
class UFCApiService {
  constructor() {
    this.baseUrl = 'https://www.ufc.com';
    this.eventsUrl = `${this.baseUrl}/events`;
    this.timeout = 10000;
    this.userAgent = 'FightBot/1.0.0';
    
    // Selectors for parsing
    this.selectors = {
      // Event page selectors
      eventHeadline: '.c-card-event--result__headline',
      titleClass: '.c-hero__headline-prefix',
      subtitleClass: '.c-hero__headline.is-large-text',
      dateClass: '.c-hero__headline-suffix',
      weightClass: 'div.c-listing-fight__details > div.c-listing-fight__class',
      fighterClass: '.c-listing-fight__corner-name',
      rankClass: '.c-listing-fight__corner-rank',
      imgClass: '.c-hero__image',
      
      // Fighter selectors
      searchResults: '.c-listing-athlete__item',
      searchResultLink: '.c-listing-athlete__name a',
      name: '.hero-profile__name',
      nickname: '.hero-profile__nickname',
      record: '.hero-profile__division-body',
      personalInfo: '.hero-profile__bio-row',
      personalLabel: '.hero-profile__bio-label',
      personalValue: '.hero-profile__bio-text',
      lastFight: '.c-card-event--athlete-results__date'
    };
    
    // Cache
    this.cache = {
      events: null,
      eventsExpiry: null,
      upcomingEvent: null,
      upcomingEventExpiry: null,
      fighters: new Map(),
      fightersExpiry: new Map()
    };
    
    // Cache timeout (1 hour)
    this.cacheTimeout = 3600000;
  }
  
  /**
   * Fetch data from a URL
   */
  async fetchData(url) {
    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: { 'User-Agent': this.userAgent }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error.message);
      return null;
    }
  }
  
  /**
   * Get all UFC events
   */
  async getEvents() {
    // Check cache
    const now = Date.now();
    if (this.cache.events && this.cache.eventsExpiry && now < this.cache.eventsExpiry) {
      return this.cache.events;
    }
    
    // Fetch events page
    const html = await this.fetchData(this.eventsUrl);
    if (!html) return [];
    
    // Parse events
    const events = this.parseEvents(html);
    
    // Update cache
    this.cache.events = events;
    this.cache.eventsExpiry = now + this.cacheTimeout;
    
    return events;
  }
  
  /**
   * Parse events from HTML
   */
  parseEvents(html) {
    const $ = cheerio.load(html);
    const events = [];
    
    $(this.selectors.eventHeadline).each((_, element) => {
      const link = $(element).find('a').attr('href');
      const title = $(element).text().trim();
      
      if (link) {
        events.push({
          title,
          url: `${this.baseUrl}${link}`
        });
      }
    });
    
    return events;
  }
  
  /**
   * Get upcoming UFC event
   */
  async getUpcomingEvent() {
    // Check cache
    const now = Date.now();
    if (this.cache.upcomingEvent && this.cache.upcomingEventExpiry && now < this.cache.upcomingEventExpiry) {
      return this.cache.upcomingEvent;
    }
    
    // Get events
    const events = await this.getEvents();
    if (!events.length) {
      return null;
    }
    
    // Get first (most upcoming) event
    const eventUrl = events[0].url;
    const html = await this.fetchData(eventUrl);
    if (!html) return null;
    
    // Parse event details
    const eventDetails = this.parseEventDetails(html);
    
    // Update cache
    this.cache.upcomingEvent = eventDetails;
    this.cache.upcomingEventExpiry = now + this.cacheTimeout;
    
    return eventDetails;
  }
  
  /**
   * Parse event details from HTML
   */
  parseEventDetails(html) {
    const $ = cheerio.load(html);
    
    // Get fighter data
    const fighters = [];
    $(this.selectors.fighterClass).each((_, el) => {
      fighters.push($(el).text().trim().replace(/\n/g, ''));
    });
    
    // Get rank data
    const ranks = [];
    $(this.selectors.rankClass).each((_, el) => {
      ranks.push($(el).text().trim().replace(/\n/g, ''));
    });
    
    // Get weight classes
    const weightClasses = [];
    $(this.selectors.weightClass).each((_, el) => {
      weightClasses.push($(el).text().trim().replace(/\n/g, ''));
    });
    
    // Build fights
    const fights = [];
    let i = 0;
    weightClasses.forEach(weightClass => {
      const fight = {
        weightClass: weightClass.replace(/ +/g, ' ').trim(),
        redCorner: {
          name: fighters[i] || 'TBA',
          rank: ranks[i] || '',
        },
        blueCorner: {
          name: fighters[i + 1] || 'TBA',
          rank: ranks[i + 1] || '',
        },
        isTitle: weightClass.toLowerCase().includes('title') || 
                 weightClass.toLowerCase().includes('championship')
      };
      
      i += 2;
      fights.push(fight);
    });
    
    // Get title, subtitle, date and image
    const title = $(this.selectors.titleClass).text().trim().replace(/\n/g, '') || 'Upcoming Event';
    const subtitle = $(this.selectors.subtitleClass).text().trim().replace(/\n/g, '').replace(/ +/g, ' ') || '';
    const date = $(this.selectors.dateClass).text().trim() || 'TBA';
    
    // Get image URL
    const imgHero = $(this.selectors.imgClass);
    const imgUrl = imgHero.find('img').attr('src') || '';
    
    // Split into main card and prelims (assuming first 5 fights are main card)
    const mainCardCount = Math.min(5, fights.length);
    const mainCard = fights.slice(0, mainCardCount).map(this.transformFight);
    const prelimCard = fights.slice(mainCardCount).map(this.transformFight);
    
    return {
      name: `${title}: ${subtitle}`.trim(),
      date,
      venue: 'Check UFC.com for venue details',
      mainCard,
      prelimCard,
      imageUrl: imgUrl
    };
  }
  
  /**
   * Transform fight data to the format expected by commands
   */
  transformFight(fight) {
    return {
      fighter1: fight.redCorner.name,
      fighter2: fight.blueCorner.name,
      weightClass: fight.weightClass,
      isTitle: fight.isTitle
    };
  }
  
  /**
   * Get fighter information
   */
  async getFighterInfo(name) {
    const normalizedName = name.toLowerCase().trim();
    
    // Check cache
    const now = Date.now();
    if (
      this.cache.fighters.has(normalizedName) && 
      this.cache.fightersExpiry.has(normalizedName) &&
      now < this.cache.fightersExpiry.get(normalizedName)
    ) {
      return this.cache.fighters.get(normalizedName);
    }
    
    try {
      // Search for fighter
      const searchUrl = `${this.baseUrl}/athletes`;
      const searchHtml = await this.fetchData(searchUrl);
      if (!searchHtml) throw new Error('Could not fetch fighter search page');
      
      // Find fighter - try different search strategies
      const $ = cheerio.load(searchHtml);
      let fighterUrl = null;
      
      // Try direct match first
      $(this.selectors.searchResults).each((_, element) => {
        const linkElement = $(element).find(this.selectors.searchResultLink);
        const fighterName = linkElement.text().trim();
        
        // Try exact match first (case-insensitive)
        if (fighterName.toLowerCase() === normalizedName) {
          fighterUrl = `${this.baseUrl}${linkElement.attr('href')}`;
          return false; // Break each loop
        }
      });
      
      // If no direct match, try contains
      if (!fighterUrl) {
        $(this.selectors.searchResults).each((_, element) => {
          const linkElement = $(element).find(this.selectors.searchResultLink);
          const fighterName = linkElement.text().trim();
          
          // Try partial match
          if (fighterName.toLowerCase().includes(normalizedName) || 
              normalizedName.includes(fighterName.toLowerCase())) {
            fighterUrl = `${this.baseUrl}${linkElement.attr('href')}`;
            return false; // Break each loop
          }
        });
      }
      
      // If still no match, try matching individual parts of the name
      if (!fighterUrl) {
        const nameParts = normalizedName.split(' ').filter(part => part.length > 2);
        
        $(this.selectors.searchResults).each((_, element) => {
          const linkElement = $(element).find(this.selectors.searchResultLink);
          const fighterName = linkElement.text().trim().toLowerCase();
          
          // Check if any name part is in the fighter name
          const found = nameParts.some(part => fighterName.includes(part));
          if (found) {
            fighterUrl = `${this.baseUrl}${linkElement.attr('href')}`;
            return false; // Break each loop
          }
        });
      }
      
      if (!fighterUrl) {
        throw new Error(`Fighter not found: ${name}`);
      }
      
      // Get fighter profile
      const profileHtml = await this.fetchData(fighterUrl);
      if (!profileHtml) throw new Error('Could not fetch fighter profile');
      
      // Parse fighter profile
      const fighterData = this.parseFighterProfile(profileHtml);
      
      // Update cache
      this.cache.fighters.set(normalizedName, fighterData);
      this.cache.fightersExpiry.set(normalizedName, now + this.cacheTimeout);
      
      return fighterData;
      
    } catch (error) {
      console.error(`Error getting fighter info for ${name}:`, error.message);
      
      // Return fallback data
      return {
        name: name,
        nickname: '',
        record: 'N/A',
        age: 'N/A',
        height: 'N/A',
        weight: 'N/A',
        reach: 'N/A',
        stance: 'N/A',
        lastFight: 'No data available'
      };
    }
  }
  
  /**
   * Parse fighter profile
   */
  parseFighterProfile(html) {
    const $ = cheerio.load(html);
    
    const name = $(this.selectors.name).text().trim();
    const nickname = $(this.selectors.nickname).text().trim();
    const record = $(this.selectors.record).first().text().trim().split(' ')[0] || 'N/A';
    
    // Default values
    const data = {
      name: name || 'Unknown Fighter',
      nickname,
      record,
      height: 'N/A',
      weight: 'N/A',
      reach: 'N/A',
      stance: 'N/A',
      age: 'N/A',
      lastFight: 'N/A'
    };
    
    // Parse personal info
    $(this.selectors.personalInfo).each((_, element) => {
      const label = $(element).find(this.selectors.personalLabel).text().trim().toLowerCase();
      const value = $(element).find(this.selectors.personalValue).text().trim();
      
      if (label.includes('height')) {
        data.height = value;
      } else if (label.includes('weight')) {
        data.weight = value;
      } else if (label.includes('reach')) {
        data.reach = value;
      } else if (label.includes('stance')) {
        data.stance = value;
      } else if (label.includes('age') || label.includes('dob')) {
        data.age = value;
      }
    });
    
    // Get last fight
    const lastFightDate = $(this.selectors.lastFight).first().text().trim();
    if (lastFightDate) {
      data.lastFight = lastFightDate;
    }
    
    return data;
  }
}

// Create an instance to export
const ufcApi = new UFCApiService();

export default ufcApi;
