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
     * Parse a single event page for detailed fight information
     * @param {string} html HTML content from event page
     * @returns {Event} Parsed event with fights
     */
    parseEvent(html) {
        const parsedHTML = Cheerio.load(html);
        
        console.log('🔍 Parsing event page...');

        // Get fighter data from the parsedHTML
        console.log('🥊 Looking for fighters with selector:', fighterClass);
        const fighters = parsedHTML(fighterClass).map((_, el) => 
            parsedHTML(el).text().trim().replace(/\n/g, '')
        ).get();
        console.log('🥊 Found fighters:', fighters.length, fighters);

        // Get rank data from the parsedHTML
        console.log('🏆 Looking for ranks with selector:', rankClass);
        const ranks = parsedHTML(rankClass).map((_, el) => 
            parsedHTML(el).text().trim().replace(/\n/g, '')
        ).get();
        console.log('🏆 Found ranks:', ranks.length, ranks);

        // Get weightClasses data from the parsedHTML
        console.log('⚖️ Looking for weight classes with selector:', weightClass);
        const weightClasses = parsedHTML(weightClass).map((_, el) => 
            parsedHTML(el).text().trim().replace(/\n/g, '').replace(/ +/g, ' ')
        ).get();
        console.log('⚖️ Found weight classes:', weightClasses.length, weightClasses);
        
        // If we found no fighters or weight classes, this indicates parsing failure
        if (fighters.length === 0 && weightClasses.length === 0) {
            console.log('❌ No fighters or weight classes found - parsing failed');
            
            // Try alternative selectors
            console.log('🔍 Trying alternative selectors...');
            const altFighterSelectors = [
                '.c-listing-fight__corner-name',
                '.c-card-event__athlete-name',
                '.fighter-name', 
                '[data-testid="fighter-name"]',
                '.athlete-name'
            ];
            
            const altWeightSelectors = [
                '.c-listing-fight__class',
                '.weight-class',
                '.bout-class',
                '[data-testid="weight-class"]'
            ];
            
            for (const selector of altFighterSelectors) {
                const altFighters = parsedHTML(selector).map((_, el) => 
                    parsedHTML(el).text().trim()
                ).get();
                if (altFighters.length > 0) {
                    console.log(`✅ Found fighters with alternative selector ${selector}:`, altFighters);
                    break;
                }
            }
            
            for (const selector of altWeightSelectors) {
                const altWeights = parsedHTML(selector).map((_, el) => 
                    parsedHTML(el).text().trim()
                ).get();
                if (altWeights.length > 0) {
                    console.log(`✅ Found weight classes with alternative selector ${selector}:`, altWeights);
                    break;
                }
            }
            
            return null; // Return null to indicate parsing failure
        }
        
        const fights = [];
        
        // Create fight objects
        for (let i = 0; i < weightClasses.length && i * 2 + 1 < fighters.length; i++) {
            const fight = new Fight(
                new FightCorner(fighters[i * 2] || '', ranks[i * 2] || ''),
                new FightCorner(fighters[i * 2 + 1] || '', ranks[i * 2 + 1] || ''),
                weightClasses[i] || ''
            );
            fights.push(fight);
        }
        
        console.log(`✅ Created ${fights.length} fight objects`);

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

        // Get location data from the parsedHTML
        console.log('📍 Looking for location with selector:', locationClass);
        let location = parsedHTML(locationClass).text().trim();
        
        // Try alternative location selectors if primary fails
        if (!location) {
            const altLocationSelectors = [
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
                '.c-hero__subtitle', // Sometimes location is in subtitle
                '.c-hero__sub-headline' // Alternative subtitle selector
            ];
            
            for (const selector of altLocationSelectors) {
                const rawLocation = parsedHTML(selector).text().trim();
                // Don't use location if it contains date/time patterns
                if (rawLocation && 
                    !rawLocation.match(/\d{1,2}:\d{2}/) && // No time
                    !rawLocation.match(/(mon|tue|wed|thu|fri|sat|sun)/i) && // No day names
                    !rawLocation.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i) && // No month names
                    !rawLocation.match(/\d{1,2}\/\d{1,2}/) && // No date format
                    rawLocation.length < 50 // Reasonable location length
                ) {
                    location = rawLocation;
                    console.log(`📍 Found location with alternative selector ${selector}:`, location);
                    break;
                }
            }
        }
        console.log('📍 Final location:', location || 'Not found');

        // Get time data from the parsedHTML
        console.log('🕐 Looking for time with selector:', timeClass);
        let time = parsedHTML(timeClass).text().trim();
        
        // Try alternative time selectors if primary fails
        if (!time) {
            const altTimeSelectors = [
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
            
            for (const selector of altTimeSelectors) {
                time = parsedHTML(selector).text().trim();
                if (time) {
                    console.log(`🕐 Found time with alternative selector ${selector}:`, time);
                    break;
                }
            }
        }
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
     * Get the next upcoming event link
     * @param {string[]} eventLinks Array of event links
     * @returns {string|null} Next upcoming event link or null
     */
    getNextUpcomingEvent(eventLinks) {
        // For now, return the first link as it should be the most recent/upcoming
        return eventLinks.length > 0 ? eventLinks[0] : null;
    }
}