/**
 * ESPN Fighter Service - Real Fighter Data Integration
 * Handles fighter profiles, stats, and data from ESPN MMA API
 * Alternative to UFC.com scraping with more reliable data
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export default class ESPNFighterService {
    constructor() {
        this.baseUrl = 'https://www.espn.com/mma';
        this.cache = new Map();
        this.cacheTimeout = 1800000; // 30 minutes
        
        // Known fighter IDs for popular fighters
        this.knownFighters = {
            'jon jones': '2335639',
            'jones': '2335639',
            'bones': '2335639',
            'israel adesanya': '3045270',
            'adesanya': '3045270',
            'stylebender': '3045270',
            'izzy': '3045270',
            'conor mcgregor': '3022677',
            'mcgregor': '3022677',
            'notorious': '3022677',
            'khabib nurmagomedov': '2529391',
            'khabib': '2529391',
            'eagle': '2529391',
            'daniel cormier': '2335818',
            'cormier': '2335818',
            'dc': '2335818'
        };
    }

    /**
     * Search for a fighter by name
     * @param {string} fighterName - The fighter's name to search for
     * @returns {Array} Array of fighter search results
     */
    async searchFighter(fighterName) {
        try {
            const normalizedName = fighterName.toLowerCase().trim();
            
            // Check if we have a known fighter ID
            if (this.knownFighters[normalizedName]) {
                const fighterId = this.knownFighters[normalizedName];
                const profile = await this.getFighterById(fighterId);
                return profile ? [profile] : [];
            }

            // For now, return fuzzy matches from known fighters
            const matches = [];
            for (const [name, id] of Object.entries(this.knownFighters)) {
                if (name.includes(normalizedName) || normalizedName.includes(name)) {
                    const profile = await this.getFighterById(id);
                    if (profile) {
                        matches.push(profile);
                    }
                }
            }

            return matches;
        } catch (error) {
            console.error('❌ ESPN Fighter search error:', error.message);
            return [];
        }
    }

    /**
     * Get fighter profile by ESPN fighter ID
     * @param {string} fighterId - ESPN fighter ID
     * @returns {Object|null} Fighter profile data
     */
    async getFighterById(fighterId) {
        try {
            const cacheKey = `espn_fighter_${fighterId}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`📋 Using cached data for fighter ID: ${fighterId}`);
                    return cached.data;
                }
            }

            console.log(`🔍 Fetching ESPN fighter data for ID: ${fighterId}`);
            
            const url = `${this.baseUrl}/fighter/_/id/${fighterId}`;
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (response.status !== 200) {
                console.log(`❌ ESPN request failed with status: ${response.status}`);
                return null;
            }

            const profile = await this.parseFighterProfile(response.data, fighterId);
            
            if (profile) {
                // Cache the result
                this.cache.set(cacheKey, {
                    data: profile,
                    timestamp: Date.now()
                });
                console.log(`✅ Successfully cached fighter data for: ${profile.name}`);
            }

            return profile;
        } catch (error) {
            console.error(`❌ Error fetching fighter ${fighterId}:`, error.message);
            return null;
        }
    }

    /**
     * Parse fighter profile from ESPN HTML
     * @param {string} html - The HTML content from ESPN
     * @param {string} fighterId - Fighter ID for reference
     * @returns {Object|null} Parsed fighter profile
     */
    async parseFighterProfile(html, fighterId) {
        try {
            const $ = cheerio.load(html);
            
            // Extract fighter name
            const name = $('h1').first().text().trim() || 'Unknown Fighter';
            
            // Extract basic stats
            const statsSection = $('.player-bio');
            let record = 'N/A';
            let height = 'N/A';
            let weight = 'N/A';
            let reach = 'N/A';
            let stance = 'N/A';
            let birthdate = 'N/A';
            let team = 'N/A';
            let nickname = 'N/A';

            // Extract stats from various selectors
            $('tr').each((i, elem) => {
                const $row = $(elem);
                const cells = $row.find('td');
                if (cells.length >= 2) {
                    const label = $(cells[0]).text().trim().toLowerCase();
                    const value = $(cells[1]).text().trim();
                    
                    if (label.includes('ht/wt')) {
                        const parts = value.split(',');
                        if (parts.length >= 2) {
                            height = parts[0].trim();
                            weight = parts[1].trim();
                        }
                    } else if (label.includes('birthdate')) {
                        birthdate = value;
                    } else if (label.includes('team')) {
                        team = value;
                    } else if (label.includes('nickname')) {
                        nickname = value;
                    } else if (label.includes('stance')) {
                        stance = value;
                    }
                }
            });

            // Extract record from stats section
            const recordElement = $('.fw-heavy').first();
            if (recordElement.length) {
                record = recordElement.text().trim();
            }

            // Extract fight history
            const fights = [];
            $('.Table__TR').each((i, elem) => {
                const $row = $(elem);
                const cells = $row.find('td');
                
                if (cells.length >= 6) {
                    const date = $(cells[0]).text().trim();
                    const opponent = $(cells[1]).text().trim();
                    const result = $(cells[2]).text().trim();
                    const method = $(cells[3]).text().trim();
                    const round = $(cells[4]).text().trim();
                    const time = $(cells[5]).text().trim();
                    const event = $(cells[6]).text().trim();

                    if (date && opponent && result) {
                        fights.push({
                            date,
                            opponent,
                            result,
                            method,
                            round,
                            time,
                            event
                        });
                    }
                }
            });

            const profile = {
                id: fighterId,
                name: name,
                nickname: nickname !== 'N/A' ? nickname : null,
                record: record,
                height: height,
                weight: weight,
                reach: reach,
                stance: stance,
                birthdate: birthdate,
                team: team,
                fights: fights.slice(0, 10), // Last 10 fights
                espnUrl: `https://www.espn.com/mma/fighter/_/id/${fighterId}`,
                source: 'ESPN',
                lastUpdated: new Date().toISOString()
            };

            console.log(`✅ Parsed ESPN profile for: ${profile.name} (${profile.record})`);
            return profile;

        } catch (error) {
            console.error('❌ Error parsing ESPN fighter profile:', error.message);
            return null;
        }
    }

    /**
     * Get detailed fighter profile by name (main entry point)
     * @param {string} fighterName - The fighter's name to search for
     * @returns {Object|null} Fighter profile data or null if not found
     */
    async getFighterProfile(fighterName) {
        try {
            console.log(`🔍 ESPN: Searching for fighter: ${fighterName}`);
            
            const searchResults = await this.searchFighter(fighterName);
            if (!searchResults || searchResults.length === 0) {
                console.log(`❌ No results found for: ${fighterName}`);
                return null;
            }

            const fighter = searchResults[0];
            console.log(`✅ Found fighter: ${fighter.name}`);
            return fighter;

        } catch (error) {
            console.error(`❌ Error getting fighter profile for ${fighterName}:`, error.message);
            return null;
        }
    }

    /**
     * Compare two fighters
     * @param {string} fighter1Name - First fighter name
     * @param {string} fighter2Name - Second fighter name
     * @returns {Object|null} Comparison data
     */
    async compareFighters(fighter1Name, fighter2Name) {
        try {
            console.log(`🥊 ESPN: Comparing ${fighter1Name} vs ${fighter2Name}`);
            
            const [fighter1, fighter2] = await Promise.all([
                this.getFighterProfile(fighter1Name),
                this.getFighterProfile(fighter2Name)
            ]);

            if (!fighter1 || !fighter2) {
                return null;
            }

            return {
                fighter1,
                fighter2,
                comparison: {
                    experienceEdge: fighter1.fights.length > fighter2.fights.length ? fighter1.name : fighter2.name,
                    heightEdge: this.parseHeight(fighter1.height) > this.parseHeight(fighter2.height) ? fighter1.name : fighter2.name,
                    weightEdge: this.parseWeight(fighter1.weight) > this.parseWeight(fighter2.weight) ? fighter1.name : fighter2.name
                }
            };
        } catch (error) {
            console.error('❌ Error comparing fighters:', error.message);
            return null;
        }
    }

    /**
     * Helper function to parse height string to inches
     */
    parseHeight(heightStr) {
        if (!heightStr || heightStr === 'N/A') return 0;
        const match = heightStr.match(/(\d+)'\s*(\d+)"/);
        if (match) {
            return parseInt(match[1]) * 12 + parseInt(match[2]);
        }
        return 0;
    }

    /**
     * Helper function to parse weight string to pounds
     */
    parseWeight(weightStr) {
        if (!weightStr || weightStr === 'N/A') return 0;
        const match = weightStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Get autocomplete suggestions for fighter names
     * @param {string} query - Partial fighter name
     * @returns {Array} Array of fighter name suggestions
     */
    getAutocompleteSuggestions(query) {
        if (!query || query.length < 2) {
            return [];
        }

        const normalizedQuery = query.toLowerCase();
        const suggestions = [];

        // Search through known fighters
        for (const fighterName of Object.keys(this.knownFighters)) {
            if (fighterName.includes(normalizedQuery) || normalizedQuery.includes(fighterName)) {
                // Convert back to proper case
                const properName = fighterName.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                
                if (!suggestions.includes(properName)) {
                    suggestions.push(properName);
                }
            }
        }

        return suggestions.slice(0, 10); // Limit to 10 suggestions
    }
}
