/**
 * SportsData.io MMA API Service
 * Professional MMA data integration with reliable fighter profiles, events, and statistics
 * 
 * Features:
 * - Comprehensive fighter profiles with career stats
 * - Live and scheduled UFC events
 * - Detailed fight statistics and round-by-round data
 * - Betting odds and line movement
 * - Historical fight data
 * 
 * API Documentation: https://sportsdata.io/developers/api-documentation/mma
 */

import axios from 'axios';
import { sportsDataApiKey } from '../config.js';

export default class SportsDataMMAService {
    constructor() {
        this.baseUrl = 'https://api.sportsdata.io/v3/mma';
        this.apiKey = sportsDataApiKey;
        this.cache = new Map();
        this.cacheTimeout = 1800000; // 30 minutes

        // Validate API key
        if (!this.apiKey) {
            console.warn('⚠️ SportsData.io API key not configured. Set SPORTSDATA_API_KEY in your .env file');
        }
    }

    /**
     * Get all fighters with basic information
     * @returns {Array} Array of basic fighter data
     */
    async getAllFightersBasic() {
        try {
            if (!this.apiKey) {
                throw new Error('SportsData.io API key not configured');
            }

            const cacheKey = 'fighters_basic_all';
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log('📋 Using cached basic fighters data');
                    return cached.data;
                }
            }

            console.log('🔍 SportsData.io: Fetching all fighters (basic)');
            
            const response = await axios.get(`${this.baseUrl}/scores/json/FightersBasic`, {
                timeout: 15000,
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey
                }
            });

            if (response.status === 200 && response.data) {
                // Cache the results
                this.cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });

                console.log(`✅ Retrieved ${response.data.length} basic fighter profiles`);
                return response.data;
            }

            return [];

        } catch (error) {
            console.error('❌ Error fetching basic fighters:', error.message);
            if (error.response?.status === 403) {
                console.error('❌ Invalid API key or subscription required');
            }
            return [];
        }
    }

    /**
     * Get detailed fighter information by Fighter ID
     * @param {string} fighterId - SportsData.io Fighter ID
     * @returns {Object|null} Detailed fighter profile
     */
    async getFighterProfile(fighterId) {
        try {
            if (!this.apiKey) {
                throw new Error('SportsData.io API key not configured');
            }

            const cacheKey = `fighter_profile_${fighterId}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`📋 Using cached fighter profile for ID: ${fighterId}`);
                    return cached.data;
                }
            }

            console.log(`🔍 SportsData.io: Fetching fighter profile for ID: ${fighterId}`);
            
            const response = await axios.get(`${this.baseUrl}/scores/json/Fighter/${fighterId}`, {
                timeout: 10000,
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey
                }
            });

            if (response.status === 200 && response.data) {
                // Cache the results
                this.cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });

                console.log(`✅ Retrieved detailed profile for: ${response.data.FirstName} ${response.data.LastName}`);
                return response.data;
            }

            return null;

        } catch (error) {
            console.error(`❌ Error fetching fighter profile for ID ${fighterId}:`, error.message);
            return null;
        }
    }

    /**
     * Search for fighters by name
     * @param {string} fighterName - Fighter name to search for
     * @returns {Array} Array of matching fighters
     */
    async searchFighters(fighterName) {
        try {
            console.log(`🔍 SportsData.io: Searching fighters for: ${fighterName}`);
            
            // Get all basic fighters first
            const allFighters = await this.getAllFightersBasic();
            if (!allFighters || allFighters.length === 0) {
                return [];
            }

            // Search through fighters
            const searchTerm = fighterName.toLowerCase();
            const matchingFighters = allFighters.filter(fighter => {
                // Safety checks for null/undefined values
                const firstName = fighter.FirstName || '';
                const lastName = fighter.LastName || '';
                const nickname = fighter.Nickname || '';
                
                const fullName = `${firstName} ${lastName}`.toLowerCase();
                const nicknameStr = nickname.toLowerCase();
                
                return fullName.includes(searchTerm) || 
                       nicknameStr.includes(searchTerm) ||
                       firstName.toLowerCase().includes(searchTerm) ||
                       lastName.toLowerCase().includes(searchTerm);
            });

            // Sort by relevance (exact matches first)
            matchingFighters.sort((a, b) => {
                const aFirstName = a.FirstName || '';
                const aLastName = a.LastName || '';
                const bFirstName = b.FirstName || '';
                const bLastName = b.LastName || '';
                
                const aFullName = `${aFirstName} ${aLastName}`.toLowerCase();
                const bFullName = `${bFirstName} ${bLastName}`.toLowerCase();
                
                const aExact = aFullName === searchTerm;
                const bExact = bFullName === searchTerm;
                
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                return 0;
            });

            console.log(`✅ Found ${matchingFighters.length} matching fighters`);
            return matchingFighters.slice(0, 10); // Return top 10 matches

        } catch (error) {
            console.error('❌ Error searching fighters:', error.message);
            return [];
        }
    }

    /**
     * Get UFC schedule for a specific season
     * @param {string} season - Year (e.g., '2025')
     * @returns {Array} Array of UFC events
     */
    async getUFCSchedule(season = '2025') {
        try {
            if (!this.apiKey) {
                throw new Error('SportsData.io API key not configured');
            }

            const cacheKey = `ufc_schedule_${season}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`📋 Using cached UFC schedule for ${season}`);
                    return cached.data;
                }
            }

            console.log(`🔍 SportsData.io: Fetching UFC schedule for ${season}`);
            
            const response = await axios.get(`${this.baseUrl}/scores/json/Schedule/UFC/${season}`, {
                timeout: 10000,
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey
                }
            });

            if (response.status === 200 && response.data) {
                // Cache the results
                this.cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });

                console.log(`✅ Retrieved ${response.data.length} UFC events for ${season}`);
                return response.data;
            }

            return [];

        } catch (error) {
            console.error(`❌ Error fetching UFC schedule for ${season}:`, error.message);
            return [];
        }
    }

    /**
     * Get event details including fight card
     * @param {string} eventId - Event ID
     * @returns {Object|null} Event details with fights
     */
    async getEventDetails(eventId) {
        try {
            if (!this.apiKey) {
                throw new Error('SportsData.io API key not configured');
            }

            const cacheKey = `event_details_${eventId}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`📋 Using cached event details for ID: ${eventId}`);
                    return cached.data;
                }
            }

            console.log(`🔍 SportsData.io: Fetching event details for ID: ${eventId}`);
            
            const response = await axios.get(`${this.baseUrl}/scores/json/Event/${eventId}`, {
                timeout: 10000,
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey
                }
            });

            if (response.status === 200 && response.data) {
                // Cache the results
                this.cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });

                console.log(`✅ Retrieved event details: ${response.data.Name}`);
                return response.data;
            }

            return null;

        } catch (error) {
            console.error(`❌ Error fetching event details for ID ${eventId}:`, error.message);
            return null;
        }
    }

    /**
     * Get detailed fight statistics
     * @param {string} fightId - Fight ID
     * @returns {Object|null} Detailed fight statistics
     */
    async getFightDetails(fightId) {
        try {
            if (!this.apiKey) {
                throw new Error('SportsData.io API key not configured');
            }

            const cacheKey = `fight_details_${fightId}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`📋 Using cached fight details for ID: ${fightId}`);
                    return cached.data;
                }
            }

            console.log(`🔍 SportsData.io: Fetching fight details for ID: ${fightId}`);
            
            const response = await axios.get(`${this.baseUrl}/stats/json/Fight/${fightId}`, {
                timeout: 10000,
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey
                }
            });

            if (response.status === 200 && response.data) {
                // Cache the results
                this.cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });

                console.log(`✅ Retrieved fight details for Fight ID: ${fightId}`);
                return response.data;
            }

            return null;

        } catch (error) {
            console.error(`❌ Error fetching fight details for ID ${fightId}:`, error.message);
            return null;
        }
    }

    /**
     * Get next upcoming UFC event
     * @returns {Object|null} Next UFC event
     */
    async getNextUFCEvent() {
        try {
            const currentYear = new Date().getFullYear().toString();
            const schedule = await this.getUFCSchedule(currentYear);
            
            if (!schedule || schedule.length === 0) {
                return null;
            }

            // Find next upcoming event
            const now = new Date();
            const upcomingEvents = schedule.filter(event => {
                const eventDate = new Date(event.DateTime);
                return eventDate > now;
            });

            // Sort by date and return the closest one
            upcomingEvents.sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime));
            
            return upcomingEvents.length > 0 ? upcomingEvents[0] : null;

        } catch (error) {
            console.error('❌ Error fetching next UFC event:', error.message);
            return null;
        }
    }

    /**
     * Get autocomplete suggestions for fighter names
     * @param {string} query - Search query
     * @returns {Array} Array of fighter suggestions
     */
    async getAutocompleteSuggestions(query) {
        try {
            if (!query || query.length < 2) {
                return [];
            }

            const fighters = await this.searchFighters(query);
            
            return fighters.slice(0, 10).map(fighter => ({
                name: `${fighter.FirstName} ${fighter.LastName}`,
                nickname: fighter.Nickname || '',
                id: fighter.FighterId,
                value: `${fighter.FirstName} ${fighter.LastName}`
            }));

        } catch (error) {
            console.error('❌ Error getting autocomplete suggestions:', error.message);
            return [];
        }
    }

    /**
     * Compare two fighters
     * @param {string} fighter1Name - First fighter name
     * @param {string} fighter2Name - Second fighter name
     * @returns {Object|null} Fighter comparison data
     */
    async compareFighters(fighter1Name, fighter2Name) {
        try {
            console.log(`🔍 SportsData.io: Comparing ${fighter1Name} vs ${fighter2Name}`);

            // Search for both fighters
            const [fighter1Results, fighter2Results] = await Promise.all([
                this.searchFighters(fighter1Name),
                this.searchFighters(fighter2Name)
            ]);

            if (fighter1Results.length === 0 || fighter2Results.length === 0) {
                return null;
            }

            // Get detailed profiles for both fighters
            const [fighter1Profile, fighter2Profile] = await Promise.all([
                this.getFighterProfile(fighter1Results[0].FighterId),
                this.getFighterProfile(fighter2Results[0].FighterId)
            ]);

            if (!fighter1Profile || !fighter2Profile) {
                return null;
            }

            // Calculate comparison data
            const comparison = {
                fighter1: this.formatFighterData(fighter1Profile),
                fighter2: this.formatFighterData(fighter2Profile),
                analysis: this.analyzeFighters(fighter1Profile, fighter2Profile)
            };

            console.log(`✅ Successfully compared ${fighter1Name} vs ${fighter2Name}`);
            return comparison;

        } catch (error) {
            console.error(`❌ Error comparing fighters:`, error.message);
            return null;
        }
    }

    /**
     * Format fighter data for display
     * @param {Object} fighter - Raw fighter data from API
     * @returns {Object} Formatted fighter data
     */
    formatFighterData(fighter) {
        return {
            name: `${fighter.FirstName} ${fighter.LastName}`,
            nickname: fighter.Nickname || '',
            record: {
                wins: fighter.Wins || 0,
                losses: fighter.Losses || 0,
                draws: fighter.Draws || 0,
                noContests: fighter.NoContests || 0
            },
            physicalStats: {
                height: fighter.Height ? `${Math.floor(fighter.Height / 12)}'${fighter.Height % 12}"` : 'N/A',
                weight: fighter.Weight ? `${fighter.Weight} lbs` : 'N/A',
                reach: fighter.Reach ? `${fighter.Reach}"` : 'N/A'
            },
            details: {
                birthDate: fighter.BirthDate || 'N/A',
                birthCity: fighter.BirthCity || 'N/A',
                birthCountry: fighter.BirthCountry || 'N/A',
                weightClass: fighter.WeightClass || 'N/A'
            },
            careerStats: fighter.CareerStats || {}
        };
    }

    /**
     * Analyze two fighters for comparison
     * @param {Object} fighter1 - First fighter data
     * @param {Object} fighter2 - Second fighter data
     * @returns {Object} Analysis results
     */
    analyzeFighters(fighter1, fighter2) {
        const analysis = {};

        // Experience comparison
        const totalFights1 = (fighter1.Wins || 0) + (fighter1.Losses || 0) + (fighter1.Draws || 0);
        const totalFights2 = (fighter2.Wins || 0) + (fighter2.Losses || 0) + (fighter2.Draws || 0);
        
        if (totalFights1 > totalFights2) {
            analysis.experience = `${fighter1.FirstName} ${fighter1.LastName}`;
        } else if (totalFights2 > totalFights1) {
            analysis.experience = `${fighter2.FirstName} ${fighter2.LastName}`;
        } else {
            analysis.experience = 'Equal';
        }

        // Win percentage
        const winRate1 = totalFights1 > 0 ? (fighter1.Wins || 0) / totalFights1 : 0;
        const winRate2 = totalFights2 > 0 ? (fighter2.Wins || 0) / totalFights2 : 0;
        
        if (winRate1 > winRate2) {
            analysis.winRate = `${fighter1.FirstName} ${fighter1.LastName}`;
        } else if (winRate2 > winRate1) {
            analysis.winRate = `${fighter2.FirstName} ${fighter2.LastName}`;
        } else {
            analysis.winRate = 'Equal';
        }

        // Physical advantages
        if (fighter1.Height && fighter2.Height) {
            analysis.height = fighter1.Height > fighter2.Height ? 
                `${fighter1.FirstName} ${fighter1.LastName}` : 
                `${fighter2.FirstName} ${fighter2.LastName}`;
        }

        if (fighter1.Reach && fighter2.Reach) {
            analysis.reach = fighter1.Reach > fighter2.Reach ? 
                `${fighter1.FirstName} ${fighter1.LastName}` : 
                `${fighter2.FirstName} ${fighter2.LastName}`;
        }

        return analysis;
    }

    /**
     * Check API connection and key validity
     * @returns {boolean} True if API is accessible
     */
    async testConnection() {
        try {
            if (!this.apiKey) {
                console.error('❌ No SportsData.io API key configured');
                return false;
            }

            console.log('🔗 Testing SportsData.io API connection...');
            
            const response = await axios.get(`${this.baseUrl}/scores/json/Leagues`, {
                timeout: 5000,
                headers: {
                    'Ocp-Apim-Subscription-Key': this.apiKey
                }
            });

            if (response.status === 200) {
                console.log('✅ SportsData.io API connection successful');
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ SportsData.io API connection failed:', error.message);
            if (error.response?.status === 403) {
                console.error('❌ Invalid API key or subscription required');
            }
            return false;
        }
    }

    /**
     * Find UFC event by event number (e.g., UFC 199, UFC 309)
     * @param {string|number} eventNumber - UFC event number
     * @returns {Object|null} UFC event details
     */
    async getUFCEventByNumber(eventNumber) {
        try {
            if (!this.apiKey) {
                throw new Error('SportsData.io API key not configured');
            }

            const cacheKey = `ufc_event_${eventNumber}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`📋 Using cached UFC ${eventNumber} data`);
                    return cached.data;
                }
            }

            console.log(`🔍 SportsData.io: Searching for UFC ${eventNumber}`);
            
            // Search through multiple years to find the event
            const currentYear = new Date().getFullYear();
            // Limit search to years where we likely have API access (recent years)
            const yearsToSearch = [currentYear, currentYear - 1];
            
            for (const year of yearsToSearch) {
                try {
                    const schedule = await this.getUFCSchedule(year.toString());
                    
                    if (schedule && schedule.length > 0) {
                        // Look for events matching the number
                        const matchingEvent = schedule.find(event => {
                            const eventName = (event.Name || event.ShortName || '').toLowerCase();
                            const searchPattern = `ufc ${eventNumber}`;
                            
                            // Check if event name contains the UFC number
                            return eventName.includes(searchPattern) || 
                                   eventName.includes(`ufc${eventNumber}`) ||
                                   eventName === `ufc ${eventNumber}`;
                        });
                        
                        if (matchingEvent) {
                            // Get detailed event information
                            const eventDetails = await this.getEventDetails(matchingEvent.EventId);
                            
                            if (eventDetails) {
                                // Cache the results
                                this.cache.set(cacheKey, {
                                    data: eventDetails,
                                    timestamp: Date.now()
                                });
                                
                                console.log(`✅ Found UFC ${eventNumber}: ${eventDetails.Name}`);
                                return eventDetails;
                            }
                        }
                    }
                } catch (yearError) {
                    // If we get 401 for a specific year, continue to the next year
                    if (yearError.response?.status === 401) {
                        console.log(`⚠️ Limited API access for year ${year}, continuing search...`);
                        continue;
                    }
                    throw yearError;
                }
            }

            console.log(`❌ UFC ${eventNumber} not found in recent years`);
            return null;

        } catch (error) {
            console.error(`❌ Error searching for UFC ${eventNumber}:`, error.message);
            return null;
        }
    }
}
