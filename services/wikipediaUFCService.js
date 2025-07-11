/**
 * Wikipedia UFC Events Service
 * Fetches comprehensive UFC event data from Wikipedia API
 * 
 * Features:
 * - Complete historical UFC event data
 * - Detailed fight cards and results
 * - Event information (date, location, venue)
 * - Fighter records and statistics
 * - No API key required - uses free Wikipedia API
 * 
 * Wikipedia API Documentation: https://www.mediawiki.org/wiki/API:Main_page
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export default class WikipediaUFCService {
    constructor() {
        this.baseUrl = 'https://en.wikipedia.org/api/rest_v1';
        this.apiUrl = 'https://en.wikipedia.org/w/api.php';
        this.cache = new Map();
        this.cacheTimeout = 3600000; // 1 hour cache for Wikipedia data
    }

    /**
     * Search for UFC event by number
     * @param {string|number} eventNumber - UFC event number (e.g., 199, 309)
     * @returns {Object|null} UFC event data from Wikipedia
     */
    async getUFCEventByNumber(eventNumber) {
        try {
            const cacheKey = `wiki_ufc_${eventNumber}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`📋 Using cached Wikipedia data for UFC ${eventNumber}`);
                    return cached.data;
                }
            }

            console.log(`🔍 Wikipedia: Searching for UFC ${eventNumber}`);
            
            // Try different Wikipedia page title formats
            const possibleTitles = [
                `UFC ${eventNumber}`,
                `UFC_${eventNumber}`,
                `Ultimate Fighting Championship ${eventNumber}`
            ];

            for (const title of possibleTitles) {
                const eventData = await this.fetchUFCEventFromWikipedia(title, eventNumber);
                if (eventData) {
                    // Cache the successful result
                    this.cache.set(cacheKey, {
                        data: eventData,
                        timestamp: Date.now()
                    });
                    
                    console.log(`✅ Found UFC ${eventNumber} on Wikipedia: ${eventData.title}`);
                    return eventData;
                }
            }

            console.log(`❌ UFC ${eventNumber} not found on Wikipedia`);
            return null;

        } catch (error) {
            console.error(`❌ Error searching Wikipedia for UFC ${eventNumber}:`, error.message);
            return null;
        }
    }

    /**
     * Fetch UFC event data from Wikipedia page
     * @param {string} pageTitle - Wikipedia page title
     * @param {string} eventNumber - Original event number for fallback
     * @returns {Object|null} Parsed event data
     */
    async fetchUFCEventFromWikipedia(pageTitle, eventNumber) {
        try {
            // First, check if the page exists
            const searchResponse = await axios.get(this.apiUrl, {
                params: {
                    action: 'query',
                    format: 'json',
                    titles: pageTitle,
                    prop: 'info'
                },
                timeout: 10000
            });

            const pages = searchResponse.data.query.pages;
            const page = Object.values(pages)[0];
            
            if (page.missing) {
                return null; // Page doesn't exist
            }

            // Get the page content
            const contentResponse = await axios.get(this.apiUrl, {
                params: {
                    action: 'parse',
                    format: 'json',
                    page: pageTitle,
                    prop: 'text|displaytitle',
                    section: 0 // Get the introduction section
                },
                timeout: 15000
            });

            if (!contentResponse.data.parse) {
                return null;
            }

            const html = contentResponse.data.parse.text['*'];
            const displayTitle = contentResponse.data.parse.displaytitle;
            
            // Parse the HTML content
            const eventData = this.parseUFCEventHTML(html, displayTitle, eventNumber);
            
            if (eventData) {
                // Get additional sections (fight card, results)
                const fightCard = await this.getFightCardFromWikipedia(pageTitle);
                if (fightCard) {
                    eventData.fights = fightCard;
                }
            }

            return eventData;

        } catch (error) {
            console.error(`❌ Error fetching Wikipedia page ${pageTitle}:`, error.message);
            return null;
        }
    }

    /**
     * Parse UFC event information from Wikipedia HTML
     * @param {string} html - Wikipedia page HTML
     * @param {string} title - Page display title
     * @param {string} eventNumber - Event number
     * @returns {Object|null} Parsed event data
     */
    parseUFCEventHTML(html, title, eventNumber) {
        try {
            const $ = cheerio.load(html);
            
            // Clean HTML tags from title
            const cleanTitle = title ? title.replace(/<[^>]*>/g, '').trim() : `UFC ${eventNumber}`;
            
            const eventData = {
                title: cleanTitle,
                eventNumber: eventNumber,
                source: 'Wikipedia'
            };

            // Look for infobox data
            const infobox = $('.infobox');
            if (infobox.length > 0) {
                // Extract date
                const dateRow = infobox.find('tr').filter((i, el) => {
                    const text = $(el).text().toLowerCase();
                    return text.includes('date') || text.includes('when');
                });

                if (dateRow.length > 0) {
                    const dateText = dateRow.find('td').text().trim();
                    eventData.date = dateText;
                    
                    // Try to parse the date
                    const parsedDate = this.parseWikipediaDate(dateText);
                    if (parsedDate) {
                        eventData.dateTime = parsedDate.toISOString();
                    }
                }

                // Extract venue/location
                const venueRow = infobox.find('tr').filter((i, el) => {
                    const text = $(el).text().toLowerCase();
                    return text.includes('venue') || text.includes('location');
                });

                if (venueRow.length > 0) {
                    const venueText = venueRow.find('td').text().trim();
                    eventData.venue = venueText;
                }

                // Extract city/location
                const locationRow = infobox.find('tr').filter((i, el) => {
                    const text = $(el).text().toLowerCase();
                    return text.includes('city') || text.includes('location');
                });

                if (locationRow.length > 0) {
                    const locationText = locationRow.find('td').text().trim();
                    eventData.location = locationText;
                }
            }

            // Extract event description from the first paragraph
            const firstParagraph = $('p').first().text().trim();
            if (firstParagraph) {
                eventData.description = firstParagraph.substring(0, 500) + (firstParagraph.length > 500 ? '...' : '');
            }

            return eventData;

        } catch (error) {
            console.error('❌ Error parsing Wikipedia HTML:', error.message);
            return null;
        }
    }

    /**
     * Get fight card information from Wikipedia
     * @param {string} pageTitle - Wikipedia page title
     * @returns {Array|null} Fight card data
     */
    async getFightCardFromWikipedia(pageTitle) {
        try {
            // Get sections that might contain fight card
            const sectionsResponse = await axios.get(this.apiUrl, {
                params: {
                    action: 'parse',
                    format: 'json',
                    page: pageTitle,
                    prop: 'sections'
                },
                timeout: 10000
            });

            if (!sectionsResponse.data.parse || !sectionsResponse.data.parse.sections) {
                return null;
            }

            const sections = sectionsResponse.data.parse.sections;
            
            // Look for sections that might contain fight card info
            const fightCardSections = sections.filter(section => {
                const title = section.line.toLowerCase();
                return title.includes('fight') || title.includes('card') || title.includes('results') || title.includes('bout');
            });

            if (fightCardSections.length === 0) {
                return null;
            }

            // Get the content of the first relevant section
            const section = fightCardSections[0];
            const sectionResponse = await axios.get(this.apiUrl, {
                params: {
                    action: 'parse',
                    format: 'json',
                    page: pageTitle,
                    prop: 'text',
                    section: section.index
                },
                timeout: 10000
            });

            if (!sectionResponse.data.parse) {
                return null;
            }

            const html = sectionResponse.data.parse.text['*'];
            return this.parseFightCardHTML(html);

        } catch (error) {
            console.error('❌ Error fetching fight card from Wikipedia:', error.message);
            return null;
        }
    }

    /**
     * Parse fight card from Wikipedia HTML
     * @param {string} html - Section HTML containing fight card
     * @returns {Array} Array of fight objects
     */
    parseFightCardHTML(html) {
        try {
            const $ = cheerio.load(html);
            const fights = [];

            // Look for tables that might contain fight data
            $('table').each((i, table) => {
                const $table = $(table);
                
                // Check if this looks like a fight card table
                const tableText = $table.text().toLowerCase();
                if (tableText.includes('fight') || tableText.includes('vs') || tableText.includes('def.') || tableText.includes('defeated')) {
                    
                    $table.find('tr').each((rowIndex, row) => {
                        const $row = $(row);
                        const rowText = $row.text().trim();
                        
                        // Skip header rows
                        if (rowText.toLowerCase().includes('weight') && rowText.toLowerCase().includes('method')) {
                            return;
                        }
                        
                        // Look for fight patterns
                        if (rowText.includes(' vs ') || rowText.includes(' def. ') || rowText.includes(' defeated ')) {
                            const cells = $row.find('td, th').map((i, cell) => $(cell).text().trim()).get();
                            
                            if (cells.length >= 2) {
                                const fightData = this.extractFightFromCells(cells);
                                if (fightData && fightData.fighters.length >= 2) {
                                    fights.push({
                                        ...fightData,
                                        order: fights.length + 1
                                    });
                                }
                            }
                        }
                    });
                }
            });

            // If we didn't find fights in tables, look for list items
            if (fights.length === 0) {
                $('ul li, ol li').each((i, li) => {
                    const text = $(li).text().trim();
                    if ((text.includes(' vs ') || text.includes(' def. ') || text.includes(' defeated ')) && 
                        text.length < 300 && text.length > 10) {
                        
                        const fightData = this.extractFightFromText(text);
                        if (fightData && fightData.fighters.length >= 2) {
                            fights.push({
                                ...fightData,
                                order: fights.length + 1
                            });
                        }
                    }
                });
            }

            // Also look for bold text patterns that might indicate main fights
            if (fights.length < 5) {
                $('p').each((i, p) => {
                    const $p = $(p);
                    const boldTexts = $p.find('b, strong').map((i, el) => $(el).text().trim()).get();
                    
                    boldTexts.forEach(text => {
                        if ((text.includes(' vs ') || text.includes(' def. ')) && text.length < 200) {
                            const fightData = this.extractFightFromText(text);
                            if (fightData && fightData.fighters.length >= 2) {
                                // Check if we already have this fight
                                const isDuplicate = fights.some(existingFight => 
                                    existingFight.fighters.some(f1 => 
                                        fightData.fighters.some(f2 => 
                                            f1.name.toLowerCase() === f2.name.toLowerCase()
                                        )
                                    )
                                );
                                
                                if (!isDuplicate) {
                                    fights.push({
                                        ...fightData,
                                        order: fights.length + 1
                                    });
                                }
                            }
                        }
                    });
                });
            }

            return fights.slice(0, 15); // Limit to 15 fights

        } catch (error) {
            console.error('❌ Error parsing fight card HTML:', error.message);
            return [];
        }
    }

    /**
     * Extract fight information from table cells
     * @param {Array} cells - Array of cell text content
     * @returns {Object|null} Fight data object
     */
    extractFightFromCells(cells) {
        try {
            // Common table formats:
            // [Weight Class, Fighter 1 vs Fighter 2, Method, Round, Time]
            // [Fighter 1, vs, Fighter 2, Result, Method]
            // [Fighter 1 def. Fighter 2, Method, Round]
            
            for (const cell of cells) {
                if (cell.includes(' vs ') || cell.includes(' def. ') || cell.includes(' defeated ')) {
                    return this.extractFightFromText(cell);
                }
            }
            
            // Try combining cells to find fight info
            const combinedText = cells.join(' ');
            if (combinedText.includes(' vs ') || combinedText.includes(' def. ')) {
                return this.extractFightFromText(combinedText);
            }
            
            return null;
            
        } catch (error) {
            return null;
        }
    }

    /**
     * Extract fight information from text
     * @param {string} text - Text containing fight information
     * @returns {Object|null} Fight data object
     */
    extractFightFromText(text) {
        try {
            const fightData = {
                fighters: [],
                rawText: text,
                weightClass: null,
                method: null,
                winner: null,
                result: null
            };

            // Extract weight class if present
            const weightClassMatch = text.match(/(Heavyweight|Light Heavyweight|Middleweight|Welterweight|Lightweight|Featherweight|Bantamweight|Flyweight|Women's)/i);
            if (weightClassMatch) {
                fightData.weightClass = weightClassMatch[1];
            }

            // Extract method if present
            const methodMatch = text.match(/(KO|TKO|Submission|Decision|Unanimous Decision|Majority Decision|Split Decision|DQ|NC|Technical Decision)/i);
            if (methodMatch) {
                fightData.method = methodMatch[1];
            }

            // Extract round and time info
            const roundTimeMatch = text.match(/R(\d+)\s+(\d+:\d+)/);
            if (roundTimeMatch) {
                fightData.round = roundTimeMatch[1];
                fightData.time = roundTimeMatch[2];
            }

            // Extract fighter names and determine winner
            if (text.includes(' def. ')) {
                const parts = text.split(' def. ');
                if (parts.length >= 2) {
                    const winnerName = this.cleanFighterName(parts[0]);
                    const loserName = this.cleanFighterName(parts[1]);
                    fightData.fighters.push({ name: winnerName });
                    fightData.fighters.push({ name: loserName });
                    fightData.winner = winnerName;
                    fightData.result = 'win';
                }
            } else if (text.includes(' defeated ')) {
                const parts = text.split(' defeated ');
                if (parts.length >= 2) {
                    const winnerName = this.cleanFighterName(parts[0]);
                    const loserName = this.cleanFighterName(parts[1]);
                    fightData.fighters.push({ name: winnerName });
                    fightData.fighters.push({ name: loserName });
                    fightData.winner = winnerName;
                    fightData.result = 'win';
                }
            } else if (text.includes(' beat ')) {
                const parts = text.split(' beat ');
                if (parts.length >= 2) {
                    const winnerName = this.cleanFighterName(parts[0]);
                    const loserName = this.cleanFighterName(parts[1]);
                    fightData.fighters.push({ name: winnerName });
                    fightData.fighters.push({ name: loserName });
                    fightData.winner = winnerName;
                    fightData.result = 'win';
                }
            } else if (text.includes(' vs ')) {
                const parts = text.split(' vs ');
                if (parts.length >= 2) {
                    fightData.fighters.push({ name: this.cleanFighterName(parts[0]) });
                    fightData.fighters.push({ name: this.cleanFighterName(parts[1]) });
                    // Check if there's result info after the vs
                    if (text.toLowerCase().includes('draw')) {
                        fightData.result = 'draw';
                    }
                }
            }

            // Validate we have at least 2 fighters
            if (fightData.fighters.length < 2) {
                return null;
            }

            // Filter out empty names
            fightData.fighters = fightData.fighters.filter(fighter => 
                fighter.name && fighter.name.length > 2 && fighter.name.length < 50
            );

            return fightData.fighters.length >= 2 ? fightData : null;

        } catch (error) {
            return null;
        }
    }

    /**
     * Extract fighter names from text
     * @param {string} text - Text containing fighter information
     * @returns {Array} Array of fighter objects
     */
    extractFighterNames(text) {
        try {
            const fighters = [];
            
            // Common patterns for fight descriptions
            if (text.includes(' vs ')) {
                const parts = text.split(' vs ');
                if (parts.length >= 2) {
                    fighters.push({ name: this.cleanFighterName(parts[0]) });
                    fighters.push({ name: this.cleanFighterName(parts[1]) });
                }
            } else if (text.includes(' defeated ')) {
                const parts = text.split(' defeated ');
                if (parts.length >= 2) {
                    fighters.push({ name: this.cleanFighterName(parts[0]) });
                    fighters.push({ name: this.cleanFighterName(parts[1]) });
                }
            }

            return fighters;

        } catch (error) {
            return [];
        }
    }

    /**
     * Clean and normalize fighter names
     * @param {string} name - Raw fighter name
     * @returns {string} Cleaned fighter name
     */
    cleanFighterName(name) {
        return name
            .replace(/\([^)]*\)/g, '') // Remove parentheses content
            .replace(/\[[^\]]*\]/g, '') // Remove brackets content
            .replace(/\d+/g, '') // Remove numbers
            .replace(/vs\.?|def\.?|defeated|by|via/gi, '') // Remove fight-related words
            .replace(/KO|TKO|Submission|Decision|DQ|NC/gi, '') // Remove method words
            .replace(/Round \d+/gi, '') // Remove round info
            .replace(/Heavyweight|Light Heavyweight|Middleweight|Welterweight|Lightweight|Featherweight|Bantamweight|Flyweight|Women's/gi, '') // Remove weight classes
            .replace(/[^\w\s'-]/g, ' ') // Replace special chars with spaces (keep apostrophes and hyphens)
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Parse date from Wikipedia format
     * @param {string} dateText - Date text from Wikipedia
     * @returns {Date|null} Parsed date object
     */
    parseWikipediaDate(dateText) {
        try {
            // Common Wikipedia date formats
            const datePatterns = [
                /(\w+ \d{1,2}, \d{4})/,
                /(\d{1,2} \w+ \d{4})/,
                /(\d{4}-\d{2}-\d{2})/
            ];

            for (const pattern of datePatterns) {
                const match = dateText.match(pattern);
                if (match) {
                    const date = new Date(match[1]);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                }
            }

            return null;

        } catch (error) {
            return null;
        }
    }

    /**
     * Test Wikipedia API connection
     * @returns {boolean} True if API is accessible
     */
    async testConnection() {
        try {
            console.log('🔗 Testing Wikipedia API connection...');
            
            const response = await axios.get(this.apiUrl, {
                params: {
                    action: 'query',
                    format: 'json',
                    meta: 'siteinfo',
                    siprop: 'general'
                },
                timeout: 5000
            });

            if (response.status === 200 && response.data.query) {
                console.log('✅ Wikipedia API connection successful');
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ Wikipedia API connection failed:', error.message);
            return false;
        }
    }
}
