import * as Cheerio from 'cheerio';

const baseUrl = 'https://www.ufc.com';
const titleClass = '.c-hero__headline-prefix';
const subtitleClass = '.c-hero__headline.is-large-text';
const dateClass = '.c-hero__headline-suffix';
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
  constructor(title = '', subtitle = '', date = '', imgUrl = '', fights = []) {
    this.title = title;
    this.subtitle = subtitle;
    this.date = date;
    this.imgUrl = imgUrl;
    this.fights = fights;
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
        const imgHero = cheerioApi(imgClass);
        const img = imgHero.find('img');
        let imgSrc = img?.attr('src') || '';
        
        // Handle relative URLs
        if (imgSrc && !imgSrc.startsWith('http')) {
            imgSrc = imgSrc.startsWith('//') ? `https:${imgSrc}` : `${baseUrl}${imgSrc}`;
        }
        
        return imgSrc;
    }

    /**
     * Parse a single event page for detailed fight information
     * @param {string} html HTML content from event page
     * @returns {Event} Parsed event with fights
     */
    parseEvent(html) {
        const parsedHTML = Cheerio.load(html);

        // Get fighter data from the parsedHTML
        const fighters = parsedHTML(fighterClass).map((_, el) => 
            parsedHTML(el).text().trim().replace(/\n/g, '')
        ).get();

        // Get rank data from the parsedHTML
        const ranks = parsedHTML(rankClass).map((_, el) => 
            parsedHTML(el).text().trim().replace(/\n/g, '')
        ).get();

        // Get weightClasses data from the parsedHTML
        const weightClasses = parsedHTML(weightClass).map((_, el) => 
            parsedHTML(el).text().trim().replace(/\n/g, '').replace(/ +/g, ' ')
        ).get();
        
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

        // Get title data from the parsedHTML
        const title = parsedHTML(titleClass).text().trim().replace(/\n/g, '');

        // Get subtitle data from the parsedHTML
        const subtitle = parsedHTML(subtitleClass).text().trim().replace(/\n/g, '').replace(/ +/g, ' ');

        // Get date data from the parsedHTML
        const date = parsedHTML(dateClass).text().trim();

        // Get imgUrl data from the parsedHTML
        const imgUrl = this.parseImage(parsedHTML);

        return new Event(title, subtitle, date, imgUrl, fights);
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

    /**
     * Parse fighter stats from ESPN fighter page
     * @param {string} html HTML content from ESPN fighter page
     * @returns {Object|null} Fighter stats object or null if parsing failed
     */
    parseFighterStats(html) {
        try {
            const parsedHTML = Cheerio.load(html);
            
            // Initialize fighter stats object
            const stats = {
                name: '',
                nickname: '',
                record: '',
                height: '',
                weight: '',
                reach: '',
                stance: '',
                dateOfBirth: '',
                significant_strikes_per_min: '',
                significant_strike_accuracy: '',
                significant_strikes_absorbed_per_min: '',
                significant_strike_defense: '',
                average_takedowns_per_15_min: '',
                takedown_accuracy: '',
                takedown_defense: '',
                average_submissions_per_15_min: ''
            };
            
            // Try multiple methods to get fighter name
            
            // Method 1: Get from title
            let name = parsedHTML('title').text().split(' Stats')[0].trim();
            
            // Method 2: Try to get from header
            if (!name) {
                const header = parsedHTML('h1').first().text().trim();
                if (header && !header.includes('ESPN') && !header.includes('404')) {
                    name = header;
                }
            }
            
            // Method 3: Try to get from PlayerHeader
            if (!name) {
                const playerHeader = parsedHTML('.PlayerHeader__Name').text().trim();
                if (playerHeader) {
                    name = playerHeader;
                }
            }
            
            // Verify we found a name
            if (!name) {
                console.log('❌ Could not find fighter name in page');
                return null;
            }
            
            stats.name = name;
            
            // Try multiple methods to get fighter info
            
            // Method 1: PlayerHeader__Bio for modern ESPN pages
            const bioSection = parsedHTML('.PlayerHeader__Bio');
            if (bioSection.length) {
                const bioText = bioSection.text();
                
                // Try to extract nickname
                const nicknameMatch = bioText.match(/"([^"]+)"/);
                if (nicknameMatch && nicknameMatch[1]) {
                    stats.nickname = nicknameMatch[1];
                }
                
                // Try to extract record
                const recordMatch = bioText.match(/(\d+-\d+-\d+)/);
                if (recordMatch && recordMatch[1]) {
                    stats.record = recordMatch[1];
                }
            }
            
            // Method 2: Look for record in various places if not found
            if (!stats.record) {
                // Try general regex search for record pattern
                const fullText = parsedHTML('body').text();
                const recordMatches = fullText.match(/(\d+)-(\d+)-(\d+)/g);
                if (recordMatches && recordMatches[0]) {
                    stats.record = recordMatches[0];
                }
                
                // Try looking in specific elements
                parsedHTML('.record, .fighter-record, .bio-record').each((_, el) => {
                    if (!stats.record) {
                        const text = parsedHTML(el).text().trim();
                        const match = text.match(/(\d+-\d+-\d+)/);
                        if (match && match[1]) {
                            stats.record = match[1];
                        }
                    }
                });
            }
            
            // Get fighter physical attributes - try multiple selectors
            const statSelectors = [
                // Modern ESPN
                {
                    container: '.StatBlockInner',
                    label: '.StatBlockInner__Label',
                    value: '.StatBlockInner__Value'
                },
                // Alternative format
                {
                    container: '.bio-item, .stat-item',
                    label: '.label, .stat-label',
                    value: '.value, .stat-value'
                },
                // Table format
                {
                    container: 'tr',
                    label: 'th',
                    value: 'td'
                }
            ];
            
            // Try each selector pattern
            statSelectors.forEach(selector => {
                parsedHTML(selector.container).each((_, element) => {
                    const label = parsedHTML(element).find(selector.label).text().trim().toLowerCase();
                    const value = parsedHTML(element).find(selector.value).text().trim();
                    
                    if (!label || !value) return;
                    
                    // Physical stats
                    if (label.includes('height')) {
                        stats.height = value;
                    }
                    else if (label.includes('weight')) {
                        stats.weight = value;
                    }
                    else if (label.includes('reach')) {
                        stats.reach = value;
                    }
                    else if (label.includes('stance')) {
                        stats.stance = value;
                    }
                    else if (label.includes('birth') || label.includes('born') || label.includes('age')) {
                        stats.dateOfBirth = value;
                    }
                    // Performance stats
                    else if (label.includes('strikes landed') || label.includes('sig. strikes/min')) {
                        stats.significant_strikes_per_min = value;
                    }
                    else if (label.includes('striking accuracy')) {
                        stats.significant_strike_accuracy = value;
                    }
                    else if (label.includes('strikes absorbed')) {
                        stats.significant_strikes_absorbed_per_min = value;
                    }
                    else if (label.includes('strike defense')) {
                        stats.significant_strike_defense = value;
                    }
                    else if (label.includes('takedowns per') || label.includes('takedowns/15')) {
                        stats.average_takedowns_per_15_min = value;
                    }
                    else if (label.includes('takedown accuracy')) {
                        stats.takedown_accuracy = value;
                    }
                    else if (label.includes('takedown defense')) {
                        stats.takedown_defense = value;
                    }
                    else if (label.includes('submissions')) {
                        stats.average_submissions_per_15_min = value;
                    }
                });
            });
            
            console.log(`✅ Parsed stats for fighter: ${stats.name}`);
            return stats;
        } catch (error) {
            console.error('Error parsing fighter stats:', error.message);
            return null;
        }
    }
    
    /**
     * Parse fighter data from UFC search results
     * @param {string} html HTML content from UFC search page
     * @param {string} fighterName Name of fighter to search for
     * @returns {Object|null} Fighter data or null if not found
     */
    parseUFCFighterSearch(html, fighterName) {
        try {
            const parsedHTML = Cheerio.load(html);
            const searchName = fighterName.toLowerCase();
            let fighterUrl = null;
            
            // Look for athlete links in search results
            parsedHTML('a').each((_, element) => {
                const href = parsedHTML(element).attr('href');
                const text = parsedHTML(element).text().trim().toLowerCase();
                
                if (href && href.includes('/athlete/') && text.includes(searchName)) {
                    fighterUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
                    return false; // Stop iteration once found
                }
            });
            
            if (!fighterUrl) {
                console.log(`❌ No fighter URL found for ${fighterName}`);
                return null;
            }
            
            // Return basic fighter info with UFC URL
            return {
                name: fighterName,
                record: '',
                url: fighterUrl
            };
        } catch (error) {
            console.error('Error parsing UFC fighter search:', error.message);
            return null;
        }
    }
}
