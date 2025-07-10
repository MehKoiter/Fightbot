/**
 * UFC Stats Fighter Service - Real-time Fighter Data Integration
 * Scrapes UFC.com for accurate fighter information and stats
 * Provides dynamic fighter lookup without maintaining static databases
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export default class UFCStatsFighterService {
    constructor() {
        this.baseUrl = 'https://www.ufc.com';
        this.cache = new Map();
        this.cacheTimeout = 1800000; // 30 minutes
    }

    /**
     * Search for fighters on UFC.com
     * @param {string} fighterName - The fighter's name to search for
     * @returns {Array} Array of fighter search results
     */
    async searchFighter(fighterName) {
        try {
            console.log(`🔍 UFC Stats: Searching for fighter: ${fighterName}`);
            
            const cacheKey = `ufc_search_${fighterName.toLowerCase()}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`📋 Using cached search results for: ${fighterName}`);
                    return cached.data;
                }
            }

            // Search UFC.com for the fighter
            const searchUrl = `${this.baseUrl}/athletes/all?filters%5B0%5D=status%3A23&search=${encodeURIComponent(fighterName)}`;
            
            const response = await axios.get(searchUrl, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });

            if (response.status !== 200) {
                console.log(`❌ UFC search request failed with status: ${response.status}`);
                return [];
            }

            const $ = cheerio.load(response.data);
            const fighters = [];

            // Parse fighter results from UFC.com
            $('.c-listing-athlete-flipcard__inner').each((index, element) => {
                try {
                    const $fighter = $(element);
                    let name = $fighter.find('.c-listing-athlete__name').text().trim();
                    let nickname = $fighter.find('.c-listing-athlete__nickname').text().trim();
                    const record = $fighter.find('.c-listing-athlete__record').text().trim();
                    const profileLink = $fighter.find('a').attr('href');
                    
                    // Clean up duplicate names (UFC.com sometimes duplicates content)
                    if (name) {
                        const nameParts = name.split('\n').map(part => part.trim()).filter(part => part);
                        name = nameParts[0] || name; // Take the first non-empty part
                    }
                    
                    // Clean up nickname
                    if (nickname) {
                        const nicknameParts = nickname.split('\n').map(part => part.trim()).filter(part => part);
                        nickname = nicknameParts[0] || nickname; // Take the first non-empty part
                        nickname = nickname.replace(/"/g, '').trim(); // Remove quotes
                    }
                    
                    if (name && profileLink) {
                        fighters.push({
                            name,
                            nickname: nickname || '',
                            record: record || 'N/A',
                            profileUrl: profileLink.startsWith('http') ? profileLink : `${this.baseUrl}${profileLink}`,
                            id: this.extractFighterIdFromUrl(profileLink)
                        });
                    }
                } catch (parseError) {
                    console.error('❌ Error parsing fighter element:', parseError.message);
                }
            });

            console.log(`✅ Found ${fighters.length} fighter(s) from UFC.com for "${fighterName}"`);

            // Filter for exact matches only (full name or nickname)
            const exactMatches = this.filterExactMatches(fighters, fighterName);

            // If no exact matches found, allow partial matches for autocomplete purposes
            let finalResults = exactMatches;
            if (exactMatches.length === 0 && fighterName.length >= 4) {
                console.log(`🔍 No exact matches found for "${fighterName}", checking for partial matches...`);
                const partialMatches = fighters.filter(fighter => {
                    const name = fighter.name.toLowerCase();
                    const nickname = fighter.nickname.toLowerCase();
                    const query = fighterName.toLowerCase();
                    
                    // Allow partial matches if query is contained in name or name words start with query
                    return name.includes(query) || 
                           nickname.includes(query) ||
                           name.split(' ').some(word => word.startsWith(query));
                });
                
                // Sort partial matches to prioritize last name matches
                partialMatches.sort((a, b) => {
                    const aName = a.name.toLowerCase();
                    const bName = b.name.toLowerCase();
                    const query = fighterName.toLowerCase();
                    
                    const aLastName = aName.split(' ').pop();
                    const bLastName = bName.split(' ').pop();
                    
                    // Prioritize matches where query is at the start of last name
                    const aLastNameMatch = aLastName.startsWith(query);
                    const bLastNameMatch = bLastName.startsWith(query);
                    
                    if (aLastNameMatch && !bLastNameMatch) return -1;
                    if (!aLastNameMatch && bLastNameMatch) return 1;
                    
                    // Then prioritize matches where query is contained in last name
                    const aLastNameContains = aLastName.includes(query);
                    const bLastNameContains = bLastName.includes(query);
                    
                    if (aLastNameContains && !bLastNameContains) return -1;
                    if (!aLastNameContains && bLastNameContains) return 1;
                    
                    // Default to alphabetical order
                    return aName.localeCompare(bName);
                });
                
                finalResults = partialMatches.slice(0, 5); // Limit partial matches
            }

            // Cache the results
            this.cache.set(cacheKey, {
                data: finalResults,
                timestamp: Date.now()
            });

            if (exactMatches.length > 0) {
                console.log(`✅ Found ${exactMatches.length} exact match(es) for "${fighterName}"`);
            } else if (finalResults.length > 0) {
                console.log(`✅ Found ${finalResults.length} partial match(es) for "${fighterName}"`);
            } else {
                console.log(`❌ No matches found for "${fighterName}"`);
            }
            
            // If we found fighters, get the detailed profile for the first match
            if (finalResults.length > 0) {
                const matchType = exactMatches.length > 0 ? 'Exact match' : 'Partial match';
                console.log(`🎯 ${matchType}: ${finalResults[0].name}`);
                const detailedProfile = await this.getFighterProfile(finalResults[0].profileUrl);
                if (detailedProfile) {
                    return [detailedProfile];
                }
            }

            return finalResults;

        } catch (error) {
            console.error('❌ UFC Fighter search error:', error.message);
            return [];
        }
    }

    /**
     * Get detailed fighter profile from UFC.com
     * @param {string} fighterUrl - The UFC profile URL or fighter ID
     * @returns {Object|null} Detailed fighter profile
     */
    async getFighterProfile(fighterUrl) {
        try {
            const cacheKey = `ufc_profile_${fighterUrl}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`📋 Using cached profile data for: ${fighterUrl}`);
                    return cached.data;
                }
            }

            const profileUrl = fighterUrl.startsWith('http') ? fighterUrl : `${this.baseUrl}/athlete/${fighterUrl}`;
            console.log(`🔍 Fetching UFC fighter profile: ${profileUrl}`);

            const response = await axios.get(profileUrl, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });

            if (response.status !== 200) {
                console.log(`❌ UFC profile request failed with status: ${response.status}`);
                return null;
            }

            const $ = cheerio.load(response.data);
            
            // Parse fighter profile data
            const profile = this.parseFighterProfile($, profileUrl);
            
            if (profile) {
                // Cache the profile
                this.cache.set(cacheKey, {
                    data: profile,
                    timestamp: Date.now()
                });

                console.log(`✅ Successfully scraped profile for: ${profile.name}`);
                return profile;
            }

            return null;

        } catch (error) {
            console.error('❌ Error fetching UFC fighter profile:', error.message);
            return null;
        }
    }

    /**
     * Parse fighter profile from UFC.com HTML
     * @param {Object} $ - Cheerio instance
     * @param {string} profileUrl - The fighter's profile URL
     * @returns {Object|null} Parsed fighter profile
     */
    parseFighterProfile($, profileUrl) {
        try {
            const name = $('.hero-profile__name').text().trim() || 
                         $('.c-hero__headline-suffix').text().trim() ||
                         $('h1').first().text().trim();
            
            const nickname = $('.hero-profile__nickname').text().trim() ||
                           $('.c-hero__headline-prefix').text().trim().replace(/"/g, '');

            const record = $('.hero-profile__division-body').text().trim() ||
                          $('.c-hero__headline-suffix').next().text().trim() ||
                          $('.hero-profile__division').text().trim();

            // Parse stats
            const stats = {};
            $('.c-stat-compare__group').each((index, element) => {
                const $stat = $(element);
                const label = $stat.find('.c-stat-compare__label').text().trim().toLowerCase();
                const value = $stat.find('.c-stat-compare__number').text().trim();
                
                if (label && value) {
                    stats[label.replace(/\s+/g, '_')] = value;
                }
            });

            // Parse bio information
            const bioStats = {};
            $('.c-bio__row').each((index, element) => {
                const $row = $(element);
                const label = $row.find('.c-bio__label').text().trim().toLowerCase();
                const text = $row.find('.c-bio__text').text().trim();
                
                if (label && text) {
                    bioStats[label.replace(/\s+/g, '_')] = text;
                }
            });

            // Parse recent fights
            const recentFights = [];
            $('.c-card-event--athlete-results .c-card-event').slice(0, 3).each((index, element) => {
                const $fight = $(element);
                const opponent = $fight.find('.c-card-event__opponent-name').text().trim();
                const result = $fight.find('.c-card-event__result').text().trim();
                const method = $fight.find('.c-card-event__method').text().trim();
                const event = $fight.find('.c-card-event__title').text().trim();
                const date = $fight.find('.c-card-event__date').text().trim();

                if (opponent) {
                    recentFights.push({
                        opponent,
                        result: result || 'N/A',
                        method: method || 'N/A',
                        event: event || 'N/A',
                        date: date || 'N/A'
                    });
                }
            });

            if (!name) {
                console.log('❌ Could not extract fighter name from UFC profile');
                return null;
            }

            const profile = {
                name,
                nickname: nickname || '',
                record: record || 'N/A',
                height: bioStats.height || stats.height || 'N/A',
                weight: bioStats.weight || stats.weight || 'N/A',
                reach: bioStats.reach || stats.reach || 'N/A',
                stance: bioStats.stance || 'N/A',
                birthdate: bioStats.date_of_birth || bioStats.born || 'N/A',
                birthplace: bioStats.place_of_birth || bioStats.birthplace || 'N/A',
                team: bioStats.fighting_out_of || bioStats.team || 'N/A',
                weightClass: bioStats.weight_class || bioStats.division || 'N/A',
                recentFights,
                profileUrl,
                source: 'UFC.com',
                scrapedAt: new Date().toISOString()
            };

            return profile;

        } catch (error) {
            console.error('❌ Error parsing UFC fighter profile:', error.message);
            return null;
        }
    }

    /**
     * Compare two fighters
     * @param {string} fighter1Name - First fighter's name
     * @param {string} fighter2Name - Second fighter's name
     * @returns {Object|null} Comparison data
     */
    async compareFighters(fighter1Name, fighter2Name) {
        try {
            console.log(`🥊 UFC Stats: Comparing ${fighter1Name} vs ${fighter2Name}`);

            const [fighter1Results, fighter2Results] = await Promise.all([
                this.searchFighter(fighter1Name),
                this.searchFighter(fighter2Name)
            ]);

            const fighter1 = fighter1Results[0];
            const fighter2 = fighter2Results[0];

            if (!fighter1 || !fighter2) {
                console.log('❌ Could not find one or both fighters for comparison');
                return null;
            }

            const comparison = {
                fighter1,
                fighter2,
                edges: this.calculateEdges(fighter1, fighter2),
                comparedAt: new Date().toISOString()
            };

            return comparison;

        } catch (error) {
            console.error('❌ Error comparing fighters:', error.message);
            return null;
        }
    }

    /**
     * Calculate fighting edges between two fighters
     * @param {Object} fighter1 - First fighter data
     * @param {Object} fighter2 - Second fighter data
     * @returns {Object} Calculated edges
     */
    calculateEdges(fighter1, fighter2) {
        const edges = {};

        // Height comparison
        const height1 = this.parseHeight(fighter1.height);
        const height2 = this.parseHeight(fighter2.height);
        if (height1 && height2) {
            edges.height = height1 > height2 ? fighter1.name : fighter2.name;
        }

        // Reach comparison
        const reach1 = this.parseReach(fighter1.reach);
        const reach2 = this.parseReach(fighter2.reach);
        if (reach1 && reach2) {
            edges.reach = reach1 > reach2 ? fighter1.name : fighter2.name;
        }

        // Experience comparison (based on total fights from record)
        const record1 = this.parseRecord(fighter1.record);
        const record2 = this.parseRecord(fighter2.record);
        if (record1 && record2) {
            const totalFights1 = record1.wins + record1.losses + record1.draws;
            const totalFights2 = record2.wins + record2.losses + record2.draws;
            edges.experience = totalFights1 > totalFights2 ? fighter1.name : fighter2.name;
            
            // Win percentage
            const winRate1 = totalFights1 > 0 ? record1.wins / totalFights1 : 0;
            const winRate2 = totalFights2 > 0 ? record2.wins / totalFights2 : 0;
            edges.record = winRate1 > winRate2 ? fighter1.name : fighter2.name;
        }

        return edges;
    }

    /**
     * Extract fighter ID from UFC profile URL
     * @param {string} url - UFC profile URL
     * @returns {string} Fighter ID
     */
    extractFighterIdFromUrl(url) {
        const match = url.match(/\/athlete\/([^\/]+)/);
        return match ? match[1] : null;
    }

    /**
     * Parse height string to inches for comparison
     * @param {string} heightStr - Height string (e.g., "6'4\"", "193 cm")
     * @returns {number|null} Height in inches
     */
    parseHeight(heightStr) {
        if (!heightStr || heightStr === 'N/A') return null;
        
        const feetInches = heightStr.match(/(\d+)'(\d+)"/);
        if (feetInches) {
            return parseInt(feetInches[1]) * 12 + parseInt(feetInches[2]);
        }
        
        const cm = heightStr.match(/(\d+)\s*cm/);
        if (cm) {
            return Math.round(parseInt(cm[1]) / 2.54);
        }
        
        return null;
    }

    /**
     * Parse reach string to inches for comparison
     * @param {string} reachStr - Reach string (e.g., "84.5\"", "215 cm")
     * @returns {number|null} Reach in inches
     */
    parseReach(reachStr) {
        if (!reachStr || reachStr === 'N/A') return null;
        
        const inches = reachStr.match(/(\d+(?:\.\d+)?)\s*"/);
        if (inches) {
            return parseFloat(inches[1]);
        }
        
        const cm = reachStr.match(/(\d+(?:\.\d+)?)\s*cm/);
        if (cm) {
            return Math.round(parseFloat(cm[1]) / 2.54);
        }
        
        return null;
    }

    /**
     * Parse fight record string
     * @param {string} recordStr - Record string (e.g., "28-1-0", "24-4")
     * @returns {Object|null} Parsed record
     */
    parseRecord(recordStr) {
        if (!recordStr || recordStr === 'N/A') return null;
        
        const match = recordStr.match(/(\d+)-(\d+)(?:-(\d+))?/);
        if (match) {
            return {
                wins: parseInt(match[1]),
                losses: parseInt(match[2]),
                draws: parseInt(match[3] || 0)
            };
        }
        
        return null;
    }

    /**
     * Get autocomplete suggestions for fighter names
     * @param {string} query - Search query
     * @returns {Array} Array of fighter name suggestions
     */
    async getAutocompleteSuggestions(query) {
        try {
            if (!query || query.length < 2) {
                return [];
            }

            const searchResults = await this.searchFighter(query);
            return searchResults.map(fighter => ({
                name: fighter.name,
                value: fighter.name
            })).slice(0, 25); // Discord limit

        } catch (error) {
            console.error('❌ Error getting autocomplete suggestions:', error.message);
            return [];
        }
    }

    /**
     * Calculate search score for ranking fighter matches
     * @param {string} fighterName - Fighter's actual name
     * @param {string} fighterNickname - Fighter's nickname
     * @param {string} searchQuery - The search query
     * @returns {number} Search score (higher is better)
     */
    /**
     * Filter fighters for exact matches only (full name or nickname)
     * @param {Array} fighters - Array of fighter objects
     * @param {string} searchQuery - The search query
     * @returns {Array} Filtered array of exact matches
     */
    filterExactMatches(fighters, searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        
        return fighters.filter(fighter => {
            const name = fighter.name.toLowerCase().trim();
            const nickname = fighter.nickname.toLowerCase().trim();
            
            // Check for exact full name match
            if (name === query) {
                return true;
            }
            
            // Check for exact nickname match
            if (nickname && nickname === query) {
                return true;
            }
            
            // Check if search query matches the fighter's stage name (without quotes)
            const cleanNickname = nickname.replace(/"/g, '').trim();
            if (cleanNickname && cleanNickname === query) {
                return true;
            }
            
            // Check for exact first name + last name match (handles name order variations)
            const nameParts = name.split(' ');
            const queryParts = query.split(' ');
            
            if (nameParts.length === queryParts.length) {
                // Check if all parts match (order independent for 2-part names)
                if (queryParts.length === 2) {
                    const [queryFirst, queryLast] = queryParts;
                    const [nameFirst, nameLast] = nameParts;
                    
                    if ((queryFirst === nameFirst && queryLast === nameLast) ||
                        (queryFirst === nameLast && queryLast === nameFirst)) {
                        return true;
                    }
                }
                
                // For names with more parts, require exact order match
                if (queryParts.every((part, index) => part === nameParts[index])) {
                    return true;
                }
            }
            
            return false;
        });
    }
}
