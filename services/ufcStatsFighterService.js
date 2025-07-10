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
        
        // Fallback list of popular fighters for quick autocomplete
        this.popularFighters = [
            'Alexander Volkanovski', 'Islam Makhachev', 'Jon Jones', 'Max Holloway',
            'Israel Adesanya', 'Conor McGregor', 'Khabib Nurmagomedov', 'Amanda Nunes',
            'Valentina Shevchenko', 'Francis Ngannou', 'Kamaru Usman', 'Rose Namajunas',
            'Jorge Masvidal', 'Dustin Poirier', 'Tony Ferguson', 'Daniel Cormier',
            'Stipe Miocic', 'Joanna Jedrzejczyk', 'Holly Holm', 'Ronda Rousey',
            'Anderson Silva', 'Georges St-Pierre', 'Chuck Liddell', 'Tito Ortiz',
            'Sean O\'Malley', 'Paddy Pimblett', 'Colby Covington', 'Leon Edwards'
        ];
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

            // Validate that we got a real name, not page artifacts
            if (!name || name === 'Search results' || name.length < 2 || name.toLowerCase().includes('search')) {
                console.log('❌ Invalid fighter name extracted or landed on search page, skipping profile');
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
            console.log(`🥊 Comparing fighters: ${fighter1Name} vs ${fighter2Name}`);

            // Get both fighter profiles
            const [fighter1Results, fighter2Results] = await Promise.all([
                this.searchFighter(fighter1Name),
                this.searchFighter(fighter2Name)
            ]);

            const fighter1 = fighter1Results.length > 0 ? fighter1Results[0] : null;
            const fighter2 = fighter2Results.length > 0 ? fighter2Results[0] : null;

            if (!fighter1 || !fighter2) {
                const missing = [];
                if (!fighter1) missing.push(fighter1Name);
                if (!fighter2) missing.push(fighter2Name);
                console.log(`❌ Could not find fighter(s): ${missing.join(', ')}`);
                return null;
            }

            console.log(`✅ Comparing: ${fighter1.name} vs ${fighter2.name}`);

            return {
                fighter1,
                fighter2,
                comparison: {
                    recordAdvantage: this.calculateRecordAdvantage(fighter1, fighter2),
                    physicalAdvantage: this.calculatePhysicalAdvantage(fighter1, fighter2),
                    experienceAdvantage: this.calculateExperienceAdvantage(fighter1, fighter2)
                }
            };

        } catch (error) {
            console.error('❌ Error comparing fighters:', error.message);
            return null;
        }
    }

    /**
     * Calculate record advantage between two fighters
     * @param {Object} fighter1 - First fighter
     * @param {Object} fighter2 - Second fighter
     * @returns {Object} Record advantage analysis
     */
    calculateRecordAdvantage(fighter1, fighter2) {
        const parseRecord = (record) => {
            if (!record) return { wins: 0, losses: 0, draws: 0 };
            const parts = record.split('-');
            return {
                wins: parseInt(parts[0]) || 0,
                losses: parseInt(parts[1]) || 0,
                draws: parseInt(parts[2]) || 0
            };
        };

        const f1Record = parseRecord(fighter1.record);
        const f2Record = parseRecord(fighter2.record);

        const f1WinRate = f1Record.wins / (f1Record.wins + f1Record.losses) || 0;
        const f2WinRate = f2Record.wins / (f2Record.wins + f2Record.losses) || 0;

        return {
            fighter1: { ...f1Record, winRate: f1WinRate },
            fighter2: { ...f2Record, winRate: f2WinRate },
            advantage: f1WinRate > f2WinRate ? 'fighter1' : f2WinRate > f1WinRate ? 'fighter2' : 'equal'
        };
    }

    /**
     * Calculate physical advantage between two fighters
     * @param {Object} fighter1 - First fighter
     * @param {Object} fighter2 - Second fighter
     * @returns {Object} Physical advantage analysis
     */
    calculatePhysicalAdvantage(fighter1, fighter2) {
        const parseHeight = (height) => {
            if (!height) return 0;
            const match = height.match(/(\d+)'(\d+)"/);
            if (match) {
                return parseInt(match[1]) * 12 + parseInt(match[2]);
            }
            return 0;
        };

        const parseReach = (reach) => {
            if (!reach) return 0;
            return parseFloat(reach.replace('"', '')) || 0;
        };

        const f1Height = parseHeight(fighter1.height);
        const f2Height = parseHeight(fighter2.height);
        const f1Reach = parseReach(fighter1.reach);
        const f2Reach = parseReach(fighter2.reach);

        return {
            height: {
                fighter1: f1Height,
                fighter2: f2Height,
                advantage: f1Height > f2Height ? 'fighter1' : f2Height > f1Height ? 'fighter2' : 'equal'
            },
            reach: {
                fighter1: f1Reach,
                fighter2: f2Reach,
                advantage: f1Reach > f2Reach ? 'fighter1' : f2Reach > f1Reach ? 'fighter2' : 'equal'
            }
        };
    }

    /**
     * Calculate experience advantage between two fighters
     * @param {Object} fighter1 - First fighter
     * @param {Object} fighter2 - Second fighter
     * @returns {Object} Experience advantage analysis
     */
    calculateExperienceAdvantage(fighter1, fighter2) {
        const getTotalFights = (record) => {
            if (!record) return 0;
            const parts = record.split('-');
            return (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) + (parseInt(parts[2]) || 0);
        };

        const f1Total = getTotalFights(fighter1.record);
        const f2Total = getTotalFights(fighter2.record);

        return {
            fighter1: f1Total,
            fighter2: f2Total,
            advantage: f1Total > f2Total ? 'fighter1' : f2Total > f1Total ? 'fighter2' : 'equal'
        };
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        console.log('🧹 Clearing UFC fighter service cache');
        this.cache.clear();
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

            // Use lightweight search for autocomplete (no detailed profile fetching)
            const searchPromise = this.lightweightSearchFighter(query);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Search timeout')), 1000) // Reduced to 1 second
            );

            try {
                const searchResults = await Promise.race([searchPromise, timeoutPromise]);
                if (searchResults && searchResults.length > 0) {
                    return searchResults.map(fighter => ({
                        name: fighter.name,
                        value: fighter.name
                    })).slice(0, 25); // Discord limit
                }
            } catch (timeoutError) {
                console.log('⚠️ UFC.com search timed out, using fallback suggestions');
            }

            // Fallback to popular fighters list if search fails or times out
            const queryLower = query.toLowerCase();
            const fallbackSuggestions = this.popularFighters
                .filter(fighter => fighter.toLowerCase().includes(queryLower))
                .map(fighter => ({
                    name: fighter,
                    value: fighter
                }))
                .slice(0, 10); // Limit fallback suggestions

            if (fallbackSuggestions.length > 0) {
                console.log(`📋 Using ${fallbackSuggestions.length} fallback suggestions for: ${query}`);
                return fallbackSuggestions;
            }

            return [];

        } catch (error) {
            console.error('❌ Error getting autocomplete suggestions:', error.message);
            return [];
        }
    }

    /**
     * Lightweight fighter search for autocomplete (no detailed profile fetching)
     * @param {string} fighterName - The fighter's name to search for
     * @returns {Array} Array of basic fighter information
     */
    async lightweightSearchFighter(fighterName) {
        try {
            console.log(`🔍 UFC Stats: Lightweight search for: ${fighterName}`);
            
            const cacheKey = `ufc_lightweight_${fighterName.toLowerCase()}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`📋 Using cached lightweight search for: ${fighterName}`);
                    return cached.data;
                }
            }

            // Search UFC.com for the fighter
            const searchUrl = `${this.baseUrl}/athletes/all?filters%5B0%5D=status%3A23&search=${encodeURIComponent(fighterName)}`;
            
            const response = await axios.get(searchUrl, {
                timeout: 8000, // Reduced timeout for autocomplete
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

            // Parse search results - basic info only for autocomplete
            $('.c-listing-athlete-flipcard__inner').each((index, element) => {
                try {
                    const $fighter = $(element);
                    
                    const name = $fighter.find('.c-listing-athlete__name').text().trim();
                    
                    const nickname = $fighter.find('.c-listing-athlete__nickname').text().trim();
                    
                    const profileUrl = $fighter.find('a').attr('href');

                    if (name && profileUrl) {
                        fighters.push({
                            name,
                            nickname: nickname.replace(/"/g, ''),
                            profileUrl: profileUrl.startsWith('http') ? profileUrl : `${this.baseUrl}${profileUrl}`
                        });
                    }
                } catch (parseError) {
                    console.error('❌ Error parsing fighter element:', parseError.message);
                }
            });

            console.log(`✅ Found ${fighters.length} fighter(s) from UFC.com for "${fighterName}"`);

            // Cache the results
            this.cache.set(cacheKey, {
                data: fighters,
                timestamp: Date.now()
            });

            return fighters;

        } catch (error) {
            console.error('❌ UFC lightweight search error:', error.message);
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
