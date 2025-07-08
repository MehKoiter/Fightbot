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
}