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
  name; // String
  rank; // String
}

export class Fight {
  redCorner; // FightCorner
  blueCorner; // FightCorner
  weightClass; // String
}

export class Event {
  title; // string;
  subtitle; // string;
  date; // string;
  imgUrl; // string;
  fights; // Fight[];
}

export class fightParser {
    /**
     * 
     * @param {string} html 
     * @returns {String[]} list of links
     */
    parseEvents(html) {
        parsedHTML = Cheerio.load(html);

        // List of String Links
        links = [];

        parsedHTML('.c-card-event--result__headline').map((eventHeadline) => {
            // Cheerio element
            const child = eventHeadline.firstChild;
            const link = `${baseUrl}${child.attribs['href']}`;
            links.push(link);
        });

        return links;
    };

    /**
     * 
     * @param {Cheerio.CheerioAPI} cheerioApi
     * @returns {String}
     */
    parseImage (cheerioApi) {
        imgHero = cheerioApi(imgClass);
        img = imgHero.find('img');
        return img?.attr('src') ?? '';
    };

    /**
     * 
     * @param {String} html 
     * @returns {Event}
     */
    parseEvent (html) {
        parsedHTML = Cheerio.load(html);

        // Get fighter data from the parsedHTML
        fighters = parsedHTML(fighterClass).map((el) => parsedHTML(el).text().trim().replace(/\n/g, '')).get();

        // Get rank data from the parsedHTML
        ranks = parsedHTML(rankClass).map((el) => parsedHTML(el).text().trim().replace(/\n/g, '')).get();

        // Get weightClasses data from the parsedHTML
        weightClasses = parsedHTML(weightClass).map((_, el) => parsedHTML(el).text().trim().replace(/\n/g, '')).get();
        
        i = 0;
        weightClasses.map((weightClass) => {
            fight = {
            weightClass: weightClass.replace(/ +/g, ' ').trim(),
            redCorner: {
                name: fighters[i],
                rank: ranks[i],
            },
            blueCorner: {
                name: fighters[i + 1],
                rank: ranks[i + 1],
            },
            };

            i += 2;

            return fight;
        });

        // Get title data from the parsedHTML
        title = parsedHTML(titleClass).text().trim().replace(/\n/g, '');

        // Get subtitle data from the parsedHTML
        subtitle = parsedHTML(subtitleClass).text().trim().replace(/\n/g, '').replace(/ +/g, ' ');

        // Get date data from the parsedHTML
        date = parsedHTML(dateClass).text().trim();

        // Get imgUrl data from the parsedHTML
        imgUrl = parseImage(parsedHTML);

        return {
            title,
            subtitle,
            date,
            fights,
            imgUrl,
        };
    };
}