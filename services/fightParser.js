import * as Cheerio from 'cheerio';

const baseUrl = 'https://www.ufc.com';
const titleClass = '.c-hero__headline-prefix';
const subtitleClass = '.c-hero__headline.is-large-text';
const dateClass = '.c-hero__headline-suffix';
const locationClass = '.c-hero__venue';
const timeClass = '.c-hero__time';
const weightClass = 'div.c-listing-fight__details > div.c-listing-fight__class';
const fighterClass = '.c-listing-fight__corner-name';
const rankClass = '.c-listing-fight__corner-rank';
const imgClass = '.c-hero__image';

export class FightCorner {
  constructor(name = '', rank = '') {
    this.name = name;
    this.rank = rank;
  }
}

export class Fight {
  constructor(redCorner = new FightCorner(), blueCorner = new FightCorner(), weightClass = '') {
    this.redCorner = redCorner;
    this.blueCorner = blueCorner;
    this.weightClass = weightClass;
  }
}

export class Event {
  constructor(title = '', subtitle = '', date = '', imgUrl = '', fights = [], location = '', time = '') {
    this.title = title;
    this.subtitle = subtitle;
    this.date = date;
    this.imgUrl = imgUrl;
    this.fights = fights;
    this.location = location;
    this.time = time;
  }
}

export class FightParser {
    /**
     * Parse upcoming events from UFC events page
     * @param {string} html HTML content from UFC events page
     * @returns {string[]} Array of event links
     */
    parseEvents(html) {
        const parsedHTML = Cheerio.load(html);
        const links = [];

        // Look for upcoming events
        parsedHTML('.c-card-event--result__headline a, .c-card-event__headline a').each((_, element) => {
            const href = parsedHTML(element).attr('href');
            if (href) {
                const link = href.startsWith('http') ? href : `${baseUrl}${href}`;
                links.push(link);
            }
        });

        return links;
    }

    /**
     * Parse event image from the event page
     * @param {Cheerio.CheerioAPI} cheerioApi Cheerio API instance
     * @returns {string} Image URL
     */
    parseImage(cheerioApi) {
        // Try multiple selectors for event posters
        const selectors = [
            '.c-hero__image img',           // Main hero image
            '.c-card-event__image img',     // Card event image
            '.c-event-poster img',          // Event poster
            '.hero-image img',              // Hero image variant
            'img[alt*="poster"]',           // Image with poster in alt text
            'img[src*="poster"]',           // Image with poster in src
            '.event-image img'              // Generic event image
        ];
        
        let imgSrc = '';
        
        for (const selector of selectors) {
            const img = cheerioApi(selector).first();
            imgSrc = img.attr('src') || img.attr('data-src') || '';
            
            if (imgSrc) {
                console.log(`🖼️ Found image with selector: ${selector}`);
                break;
            }
        }
        
        // Handle relative URLs
        if (imgSrc && !imgSrc.startsWith('http')) {
            imgSrc = imgSrc.startsWith('//') ? `https:${imgSrc}` : `${baseUrl}${imgSrc}`;
        }
        
        console.log('🖼️ Final image URL:', imgSrc || 'Not found');
        return imgSrc;
    }

    /**
     * Try multiple selectors to find fighter data
     * @param {Cheerio.CheerioAPI} cheerioApi Cheerio API instance
     * @returns {string[]} Array of fighter names
     */
    tryFighterSelectors(cheerioApi) {
        const fighterSelectors = [
            '.c-listing-fight__corner-name',      // Primary selector
            '.c-card-event__athlete-name',        // Card event page
            '.fighter-name',                      // Generic fighter name
            '[data-testid="fighter-name"]',       // React testid
            '.athlete-name',                      // Alternative athlete name
            '.c-listing-fight__corner .c-listing-fight__corner-name', // Nested selector
            '.bout__fighter-name',                // Bout specific
            '.fight-card__fighter-name'           // Fight card specific
        ];
        
        for (const selector of fighterSelectors) {
            const fighters = cheerioApi(selector).map((_, el) => 
                cheerioApi(el).text().trim().replace(/\n/g, '').replace(/\s+/g, ' ')
            ).get().filter(name => name && name.length > 0);
            
            if (fighters.length > 0) {
                console.log(`✅ Found ${fighters.length} fighters with selector: ${selector}`);
                return fighters;
            }
        }
        
        console.log('❌ No fighters found with any selector');
        return [];
    }

    /**
     * Try multiple selectors to find weight class data
     * @param {Cheerio.CheerioAPI} cheerioApi Cheerio API instance
     * @returns {string[]} Array of weight classes
     */
    tryWeightClassSelectors(cheerioApi) {
        const weightSelectors = [
            'div.c-listing-fight__details > div.c-listing-fight__class', // Primary selector
            '.c-listing-fight__class',            // Simplified primary
            '.weight-class',                      // Generic weight class
            '.bout-class',                        // Bout class
            '[data-testid="weight-class"]',       // React testid
            '.c-listing-fight__class-text',       // Class text variant
            '.fight-weight-class',                // Fight specific
            '.bout__weight-class'                 // Bout specific
        ];
        
        for (const selector of weightSelectors) {
            const weights = cheerioApi(selector).map((_, el) => 
                cheerioApi(el).text().trim().replace(/\n/g, '').replace(/\s+/g, ' ')
            ).get().filter(weight => weight && weight.length > 0);
            
            if (weights.length > 0) {
                console.log(`✅ Found ${weights.length} weight classes with selector: ${selector}`);
                return weights;
            }
        }
        
        console.log('❌ No weight classes found with any selector');
        return [];
    }

    /**
     * Try multiple selectors to find rank data
     * @param {Cheerio.CheerioAPI} cheerioApi Cheerio API instance
     * @returns {string[]} Array of fighter ranks
     */
    tryRankSelectors(cheerioApi) {
        const rankSelectors = [
            '.c-listing-fight__corner-rank',      // Primary selector
            '.fighter-rank',                      // Generic rank
            '.c-listing-fight__rank',             // Alternative rank
            '[data-testid="fighter-rank"]',       // React testid
            '.bout__fighter-rank',                // Bout specific
            '.ranking'                            // Simple ranking
        ];
        
        for (const selector of rankSelectors) {
            const ranks = cheerioApi(selector).map((_, el) => 
                cheerioApi(el).text().trim().replace(/\n/g, '')
            ).get();
            
            if (ranks.length > 0) {
                console.log(`✅ Found ${ranks.length} ranks with selector: ${selector}`);
                return ranks;
            }
        }
        
        console.log('ℹ️ No ranks found with any selector (this is normal for some events)');
        return [];
    }
    /**
     * Parse a single event page for detailed fight information
     * @param {string} html HTML content from event page
     * @returns {Event} Parsed event with fights
     */
    parseEvent(html) {
        const parsedHTML = Cheerio.load(html);
        
        console.log('🔍 Parsing event page...');

        // Use robust selector methods for better parsing
        const fighters = this.tryFighterSelectors(parsedHTML);
        const ranks = this.tryRankSelectors(parsedHTML);
        const weightClasses = this.tryWeightClassSelectors(parsedHTML);
        
        // If we found no fighters or weight classes, this indicates parsing failure
        if (fighters.length === 0 && weightClasses.length === 0) {
            console.log('❌ No fighters or weight classes found - parsing failed completely');
            return null; // Return null to indicate parsing failure
        }
        
        const fights = [];
        
        // Create fight objects with better data validation
        for (let i = 0; i < weightClasses.length && i * 2 + 1 < fighters.length; i++) {
            const redFighter = fighters[i * 2] || '';
            const blueFighter = fighters[i * 2 + 1] || '';
            const weight = weightClasses[i] || '';
            
            // Only create fight if we have valid fighter names
            if (redFighter && blueFighter && 
                redFighter !== 'TBA' && blueFighter !== 'TBA' &&
                redFighter !== 'TBD' && blueFighter !== 'TBD') {
                
                const fight = new Fight(
                    new FightCorner(redFighter, ranks[i * 2] || ''),
                    new FightCorner(blueFighter, ranks[i * 2 + 1] || ''),
                    weight
                );
                fights.push(fight);
            }
        }
        
        console.log(`✅ Created ${fights.length} valid fight objects`);

        // Get title data from the parsedHTML
        const title = parsedHTML(titleClass).text().trim().replace(/\n/g, '');

        // Get subtitle data from the parsedHTML
        const subtitle = parsedHTML(subtitleClass).text().trim().replace(/\n/g, '').replace(/ +/g, ' ');

        // Get date data from the parsedHTML
        const date = parsedHTML(dateClass).text().trim();
        console.log('📅 Raw date text:', date);

        // Try to extract time and location from the date field if separate fields don't exist
        let extractedTime = '';
        let extractedLocation = '';
        
        if (date) {
            // Look for time patterns like "9:00 PM EDT", "10:00 PM ET", etc.
            const timeMatch = date.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*(?:EDT|EST|ET|PDT|PST|PT|GMT|UTC)?)/i);
            if (timeMatch) {
                extractedTime = timeMatch[1].trim();
                console.log('🕐 Extracted time from date:', extractedTime);
            }
            
            // Look for location patterns (city, state/country)
            const locationPatterns = [
                /,\s*([^,]+,\s*[^,]+)$/,  // "Something, City, State"
                /\|\s*([^|]+)$/,          // "Something | Location"
                /at\s+([^,]+(?:,\s*[^,]+)?)/i  // "at Location"
            ];
            
            for (const pattern of locationPatterns) {
                const locationMatch = date.match(pattern);
                if (locationMatch) {
                    extractedLocation = locationMatch[1].trim();
                    console.log('📍 Extracted location from date:', extractedLocation);
                    break;
                }
            }
        }

        // Get location data with enhanced selector fallbacks
        let location = this.tryLocationSelectors(parsedHTML);
        console.log('📍 Final location:', location || 'Not found');

        // Get time data with enhanced selector fallbacks
        let time = this.tryTimeSelectors(parsedHTML);
        console.log('🕐 Final time:', time || 'Not found');
        
        // Use extracted values as fallback
        if (!location && extractedLocation) {
            location = extractedLocation;
            console.log('📍 Using extracted location:', location);
        }
        
        if (!time && extractedTime) {
            time = extractedTime;
            console.log('🕐 Using extracted time:', time);
        }

        // Get imgUrl data from the parsedHTML
        const imgUrl = this.parseImage(parsedHTML);

        return new Event(title, subtitle, date, imgUrl, fights, location, time);
    }

    /**
     * Try multiple selectors to find location data
     * @param {Cheerio.CheerioAPI} cheerioApi Cheerio API instance
     * @returns {string} Location string or empty string
     */
    tryLocationSelectors(cheerioApi) {
        const locationSelectors = [
            '.c-hero__venue',                     // Primary selector
            '.c-hero__venue-name',
            '.c-hero__venue-city',
            '.c-hero__venue-location',
            '.c-hero__location',
            '.event-venue',
            '.venue-name',
            '.location',
            '[data-venue]',
            '.c-event-details__venue',
            '.c-hero__meta .location',
            '.c-hero__subtitle',
            '.c-hero__sub-headline'
        ];
        
        for (const selector of locationSelectors) {
            const rawLocation = cheerioApi(selector).text().trim();
            
            // Don't use location if it contains date/time patterns
            if (rawLocation && 
                !rawLocation.match(/\d{1,2}:\d{2}/) && // No time
                !rawLocation.match(/(mon|tue|wed|thu|fri|sat|sun)/i) && // No day names
                !rawLocation.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i) && // No month names
                !rawLocation.match(/\d{1,2}\/\d{1,2}/) && // No date format
                rawLocation.length < 100 // Reasonable location length
            ) {
                console.log(`📍 Found location with selector ${selector}:`, rawLocation);
                return rawLocation;
            }
        }
        
        return '';
    }

    /**
     * Try multiple selectors to find time data
     * @param {Cheerio.CheerioAPI} cheerioApi Cheerio API instance
     * @returns {string} Time string or empty string
     */
    tryTimeSelectors(cheerioApi) {
        const timeSelectors = [
            '.c-hero__time',                      // Primary selector
            '.c-hero__time-text',
            '.c-hero__time-start',
            '.c-hero__start-time', 
            '.event-time',
            '.start-time',
            '.time',
            '[data-time]',
            '.c-event-details__time',
            '.c-hero__headline-suffix .time',
            '.c-hero__meta .time',
            '.c-hero__meta-item'
        ];
        
        for (const selector of timeSelectors) {
            const time = cheerioApi(selector).text().trim();
            if (time && time.match(/\d{1,2}:\d{2}/)) { // Basic time pattern validation
                console.log(`� Found time with selector ${selector}:`, time);
                return time;
            }
        }
        
        return '';
    }

    /**
     * Get the next upcoming event link
     * @param {string[]} eventLinks Array of event links
     * @returns {string|null} Next upcoming event link or null
     */
    getNextUpcomingEvent(eventLinks) {
        // For now, return the first link as it should be the most recent/upcoming
        return eventLinks.length > 0 ? eventLinks[0] : null;
    }
}