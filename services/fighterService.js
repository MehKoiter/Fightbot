/**
 * Fighter Service - Advanced Fighter Data Management
 * Handles fighter profiles, stats, comparisons, and analysis
 * Phase 7: Advanced Fighter Features
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export default class FighterService {
    constructor() {
        this.baseUrl = 'https://www.ufc.com';
        this.cache = new Map();
        this.cacheTimeout = 1800000; // 30 minutes
    }

    /**
     * Get detailed fighter profile by name
     * @param {string} fighterName - The fighter's name to search for
     * @returns {Object|null} Fighter profile data or null if not found
     */
    async getFighterProfile(fighterName) {
        try {
            const cacheKey = `fighter_${fighterName.toLowerCase()}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            // Search for fighter
            const searchResults = await this.searchFighter(fighterName);
            if (!searchResults || searchResults.length === 0) {
                return null;
            }

            // Get the first/best match
            const fighter = searchResults[0];
            const detailedProfile = await this.getFighterDetails(fighter.url);

            // Cache the result
            this.cache.set(cacheKey, {
                data: detailedProfile,
                timestamp: Date.now()
            });

            return detailedProfile;

        } catch (error) {
            console.error('Error fetching fighter profile:', error.message);
            return null;
        }
    }

    /**
     * Search for fighters by name
     * @param {string} fighterName - The fighter's name to search for
     * @returns {Array} Array of fighter search results
     */
    async searchFighter(fighterName) {
        try {
            // Mock search results for now - in production this would hit UFC API
            // This is a placeholder implementation
            const mockFighters = [
                {
                    name: "Jon Jones",
                    nickname: "Bones",
                    url: "/athlete/jon-jones",
                    weightClass: "Heavyweight",
                    record: "27-1-0",
                    ranking: "#1"
                },
                {
                    name: "Islam Makhachev",
                    nickname: "",
                    url: "/athlete/islam-makhachev", 
                    weightClass: "Lightweight",
                    record: "25-1-0",
                    ranking: "#1"
                },
                {
                    name: "Alexander Volkanovski",
                    nickname: "The Great",
                    url: "/athlete/alexander-volkanovski",
                    weightClass: "Featherweight", 
                    record: "26-3-0",
                    ranking: "#1"
                }
            ];

            // Simple search logic
            const searchTerm = fighterName.toLowerCase();
            return mockFighters.filter(fighter => 
                fighter.name.toLowerCase().includes(searchTerm) ||
                fighter.nickname.toLowerCase().includes(searchTerm)
            );

        } catch (error) {
            console.error('Error searching fighters:', error.message);
            return [];
        }
    }

    /**
     * Get detailed fighter information
     * @param {string} fighterUrl - The fighter's UFC profile URL
     * @returns {Object} Detailed fighter profile
     */
    async getFighterDetails(fighterUrl) {
        try {
            // Mock detailed fighter data - in production this would scrape UFC.com
            const mockDetails = {
                name: "Jon Jones",
                nickname: "Bones",
                record: {
                    wins: 27,
                    losses: 1,
                    draws: 0,
                    winsByKO: 10,
                    winsBySubmission: 6,
                    winsByDecision: 11
                },
                physicalStats: {
                    height: "6'4\"",
                    weight: "248 lbs",
                    reach: "84.5\"",
                    legReach: "44.5\"",
                    stance: "Orthodox",
                    age: 37
                },
                fightingStyle: {
                    striking: {
                        accuracy: "58%",
                        defense: "63%",
                        avgPerMinute: 3.81
                    },
                    grappling: {
                        takedownAccuracy: "43%",
                        takedownDefense: "95%",
                        avgPerFight: 2.1
                    },
                    ground: {
                        submissionAvg: 0.8,
                        controlTime: "4:32"
                    }
                },
                achievements: [
                    "Former UFC Light Heavyweight Champion",
                    "Current UFC Heavyweight Champion", 
                    "Longest title reign in UFC LHW history",
                    "Youngest UFC champion in history"
                ],
                lastFight: {
                    opponent: "Ciryl Gane",
                    result: "Win",
                    method: "Submission (Guillotine)",
                    date: "March 4, 2023",
                    round: 1
                },
                nextFight: {
                    opponent: "TBA",
                    date: "TBA",
                    event: "TBA"
                },
                socialMedia: {
                    instagram: "@jonnybones",
                    twitter: "@JonnyBones"
                },
                highlights: [
                    "UFC 285: Jones vs Gane",
                    "UFC 232: Jones vs Gustafsson 2", 
                    "UFC 165: Jones vs Gustafsson 1"
                ]
            };

            return mockDetails;

        } catch (error) {
            console.error('Error fetching fighter details:', error.message);
            return null;
        }
    }

    /**
     * Compare two fighters
     * @param {string} fighter1Name - First fighter name
     * @param {string} fighter2Name - Second fighter name
     * @returns {Object} Fighter comparison data
     */
    async compareFighters(fighter1Name, fighter2Name) {
        try {
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
                comparison: this.generateComparison(fighter1, fighter2)
            };

        } catch (error) {
            console.error('Error comparing fighters:', error.message);
            return null;
        }
    }

    /**
     * Generate comparison analysis between two fighters
     * @param {Object} fighter1 - First fighter data
     * @param {Object} fighter2 - Second fighter data
     * @returns {Object} Comparison analysis
     */
    generateComparison(fighter1, fighter2) {
        return {
            physical: {
                heightAdvantage: this.calculateHeightAdvantage(fighter1.physicalStats.height, fighter2.physicalStats.height),
                reachAdvantage: this.calculateReachAdvantage(fighter1.physicalStats.reach, fighter2.physicalStats.reach),
                ageAdvantage: fighter2.physicalStats.age - fighter1.physicalStats.age
            },
            experience: {
                totalFights: (fighter1.record.wins + fighter1.record.losses) - (fighter2.record.wins + fighter2.record.losses),
                winPercentage: this.calculateWinPercentage(fighter1.record) - this.calculateWinPercentage(fighter2.record)
            },
            advantages: {
                fighter1: this.getFighterAdvantages(fighter1, fighter2),
                fighter2: this.getFighterAdvantages(fighter2, fighter1)
            }
        };
    }

    /**
     * Calculate height advantage in inches
     */
    calculateHeightAdvantage(height1, height2) {
        // Convert height strings like "6'4\"" to inches
        const parseHeight = (height) => {
            const match = height.match(/(\d+)'(\d+)"/);
            if (match) {
                return parseInt(match[1]) * 12 + parseInt(match[2]);
            }
            return 0;
        };

        return parseHeight(height1) - parseHeight(height2);
    }

    /**
     * Calculate reach advantage in inches
     */
    calculateReachAdvantage(reach1, reach2) {
        const parseReach = (reach) => parseFloat(reach.replace('"', ''));
        return parseReach(reach1) - parseReach(reach2);
    }

    /**
     * Calculate win percentage
     */
    calculateWinPercentage(record) {
        const totalFights = record.wins + record.losses + record.draws;
        return totalFights > 0 ? (record.wins / totalFights) * 100 : 0;
    }

    /**
     * Get fighter advantages over opponent
     */
    getFighterAdvantages(fighter, opponent) {
        const advantages = [];

        // Physical advantages
        if (this.calculateHeightAdvantage(fighter.physicalStats.height, opponent.physicalStats.height) > 2) {
            advantages.push("Height advantage");
        }
        if (this.calculateReachAdvantage(fighter.physicalStats.reach, opponent.physicalStats.reach) > 2) {
            advantages.push("Reach advantage");
        }

        // Experience advantages
        const fighterTotalFights = fighter.record.wins + fighter.record.losses;
        const opponentTotalFights = opponent.record.wins + opponent.record.losses;
        if (fighterTotalFights > opponentTotalFights + 5) {
            advantages.push("Experience advantage");
        }

        // Style advantages (simplified)
        if (parseFloat(fighter.fightingStyle.striking.accuracy) > parseFloat(opponent.fightingStyle.striking.accuracy)) {
            advantages.push("Superior striking accuracy");
        }

        return advantages;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}
