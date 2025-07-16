/**
 * Hybrid Fighter Service
 * Combines SportsData.io API with existing UFC scraping for comprehensive fighter data
 *
 * Priority Order:
 * 1. SportsData.io API (most reliable)
 * 2. UFC Stats Fighter Service (fallback)
 * 3. Basic Fighter Service (final fallback)
 */

import SportsDataMMAService from "./sportsDataMMAService.js";
import UFCStatsFighterService from "./ufcStatsFighterService.js";
import FighterService from "./fighterService.js";

export default class HybridFighterService {
  constructor() {
    this.sportsDataService = new SportsDataMMAService();
    this.ufcStatsService = new UFCStatsFighterService();
    this.basicFighterService = new FighterService();

    this.cache = new Map();
    this.cacheTimeout = 1800000; // 30 minutes
  }

  /**
   * Get fighter profile using best available data source
   * @param {string} fighterName - Fighter name to search for
   * @returns {Object|null} Fighter profile data
   */
  async getFighterProfile(fighterName) {
    try {
      console.log(`🔍 Hybrid: Getting fighter profile for: ${fighterName}`);

      const cacheKey = `hybrid_fighter_${fighterName.toLowerCase()}`;

      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          console.log(`📋 Using cached fighter profile for: ${fighterName}`);
          return cached.data;
        }
      }

      let fighterProfile = null;

      // Try SportsData.io API first
      try {
        const sportsDataFighters = await this.sportsDataService.searchFighters(
          fighterName
        );
        if (sportsDataFighters && sportsDataFighters.length > 0) {
          const detailedProfile =
            await this.sportsDataService.getFighterProfile(
              sportsDataFighters[0].FighterId
            );
          if (detailedProfile) {
            fighterProfile = this.formatSportsDataProfile(detailedProfile);
            fighterProfile.source = "SportsData.io API";
            console.log(
              `✅ Found fighter via SportsData.io: ${fighterProfile.name}`
            );
          }
        }
      } catch (error) {
        console.log(`⚠️ SportsData.io lookup failed: ${error.message}`);
      }

      // Fallback to UFC Stats service
      if (!fighterProfile) {
        try {
          const ufcProfile = await this.ufcStatsService.getFighterProfile(
            fighterName
          );
          if (ufcProfile) {
            fighterProfile = this.formatUFCStatsProfile(ufcProfile);
            fighterProfile.source = "UFC.com Scraping";
            console.log(
              `✅ Found fighter via UFC scraping: ${fighterProfile.name}`
            );
          }
        } catch (error) {
          console.log(`⚠️ UFC Stats lookup failed: ${error.message}`);
        }
      }

      // Final fallback to basic service
      if (!fighterProfile) {
        try {
          const basicProfile = await this.basicFighterService.getFighterProfile(
            fighterName
          );
          if (basicProfile) {
            fighterProfile = this.formatBasicProfile(basicProfile);
            fighterProfile.source = "Basic/Mock Data";
            console.log(
              `✅ Found fighter via basic service: ${fighterProfile.name}`
            );
          }
        } catch (error) {
          console.log(`⚠️ Basic service lookup failed: ${error.message}`);
        }
      }

      if (fighterProfile) {
        // Cache the result
        this.cache.set(cacheKey, {
          data: fighterProfile,
          timestamp: Date.now(),
        });
      }

      return fighterProfile;
    } catch (error) {
      console.error(
        `❌ Error in hybrid fighter lookup for ${fighterName}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Search for fighters using best available data source
   * @param {string} query - Search query
   * @returns {Array} Array of fighter search results
   */
  async searchFighters(query) {
    try {
      console.log(`🔍 Hybrid: Searching fighters for: ${query}`);

      // Try SportsData.io first
      try {
        const sportsDataResults = await this.sportsDataService.searchFighters(
          query
        );
        if (sportsDataResults && sportsDataResults.length > 0) {
          console.log(
            `✅ Found ${sportsDataResults.length} fighters via SportsData.io`
          );
          return sportsDataResults.map((fighter) => ({
            name: `${fighter.FirstName} ${fighter.LastName}`,
            nickname: fighter.Nickname || "",
            source: "SportsData.io API",
            id: fighter.FighterId,
          }));
        }
      } catch (error) {
        console.log(`⚠️ SportsData.io search failed: ${error.message}`);
      }

      // Fallback to UFC Stats
      try {
        const ufcResults = await this.ufcStatsService.searchFighter(query);
        if (ufcResults && ufcResults.length > 0) {
          console.log(
            `✅ Found ${ufcResults.length} fighters via UFC scraping`
          );
          return ufcResults.map((fighter) => ({
            name: fighter.name,
            nickname: fighter.nickname || "",
            source: "UFC.com Scraping",
            profileUrl: fighter.profileUrl,
          }));
        }
      } catch (error) {
        console.log(`⚠️ UFC Stats search failed: ${error.message}`);
      }

      // Final fallback to basic service
      try {
        const basicResults = await this.basicFighterService.searchFighter(
          query
        );
        if (basicResults && basicResults.length > 0) {
          console.log(
            `✅ Found ${basicResults.length} fighters via basic service`
          );
          return basicResults.map((fighter) => ({
            name: fighter.name,
            nickname: fighter.nickname || "",
            source: "Basic/Mock Data",
            url: fighter.url,
          }));
        }
      } catch (error) {
        console.log(`⚠️ Basic search failed: ${error.message}`);
      }

      return [];
    } catch (error) {
      console.error(`❌ Error in hybrid fighter search:`, error.message);
      return [];
    }
  }

  /**
   * Compare two fighters using best available data
   * @param {string} fighter1Name - First fighter name
   * @param {string} fighter2Name - Second fighter name
   * @returns {Object|null} Fighter comparison data
   */
  async compareFighters(fighter1Name, fighter2Name) {
    try {
      console.log(`🔍 Hybrid: Comparing ${fighter1Name} vs ${fighter2Name}`);

      // Try SportsData.io comparison first
      try {
        const sportsDataComparison =
          await this.sportsDataService.compareFighters(
            fighter1Name,
            fighter2Name
          );
        if (sportsDataComparison) {
          sportsDataComparison.source = "SportsData.io API";
          console.log(`✅ Comparison via SportsData.io successful`);
          return sportsDataComparison;
        }
      } catch (error) {
        console.log(`⚠️ SportsData.io comparison failed: ${error.message}`);
      }

      // Fallback to UFC Stats comparison
      try {
        const ufcComparison = await this.ufcStatsService.compareFighters(
          fighter1Name,
          fighter2Name
        );
        if (ufcComparison) {
          ufcComparison.source = "UFC.com Scraping";
          console.log(`✅ Comparison via UFC scraping successful`);
          return ufcComparison;
        }
      } catch (error) {
        console.log(`⚠️ UFC Stats comparison failed: ${error.message}`);
      }

      // Final fallback - get individual profiles and compare
      const [fighter1, fighter2] = await Promise.all([
        this.getFighterProfile(fighter1Name),
        this.getFighterProfile(fighter2Name),
      ]);

      if (fighter1 && fighter2) {
        return {
          fighter1,
          fighter2,
          analysis: this.compareProfiles(fighter1, fighter2),
          source: "Hybrid Analysis",
        };
      }

      return null;
    } catch (error) {
      console.error(`❌ Error comparing fighters:`, error.message);
      return null;
    }
  }

  /**
   * Get autocomplete suggestions using hybrid approach
   * @param {string} query - Search query
   * @returns {Array} Array of autocomplete suggestions
   */
  async getAutocompleteSuggestions(query) {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      // Try SportsData.io first
      try {
        const sportsDataSuggestions =
          await this.sportsDataService.getAutocompleteSuggestions(query);
        if (sportsDataSuggestions && sportsDataSuggestions.length > 0) {
          return sportsDataSuggestions;
        }
      } catch (error) {
        console.log(`⚠️ SportsData.io autocomplete failed: ${error.message}`);
      }

      // Fallback to UFC Stats
      try {
        const ufcSuggestions =
          await this.ufcStatsService.getAutocompleteSuggestions(query);
        if (ufcSuggestions && ufcSuggestions.length > 0) {
          return ufcSuggestions.map((name) => ({
            name,
            value: name,
            source: "UFC.com",
          }));
        }
      } catch (error) {
        console.log(`⚠️ UFC Stats autocomplete failed: ${error.message}`);
      }

      return [];
    } catch (error) {
      console.error(
        `❌ Error getting autocomplete suggestions:`,
        error.message
      );
      return [];
    }
  }

  /**
   * Format SportsData.io fighter profile
   * @param {Object} fighter - Raw SportsData.io fighter data
   * @returns {Object} Formatted fighter profile
   */
  formatSportsDataProfile(fighter) {
    return {
      name: `${fighter.FirstName} ${fighter.LastName}`,
      nickname: fighter.Nickname || "",
      record: {
        wins: fighter.Wins || 0,
        losses: fighter.Losses || 0,
        draws: fighter.Draws || 0,
        noContests: fighter.NoContests || 0,
      },
      physicalStats: {
        height: fighter.Height
          ? `${Math.floor(fighter.Height / 12)}'${fighter.Height % 12}"`
          : "N/A",
        weight: fighter.Weight ? `${fighter.Weight} lbs` : "N/A",
        reach: fighter.Reach ? `${fighter.Reach}"` : "N/A",
      },
      details: {
        birthDate: fighter.BirthDate || "N/A",
        birthPlace:
          fighter.BirthCity && fighter.BirthCountry
            ? `${fighter.BirthCity}, ${fighter.BirthCountry}`
            : "N/A",
        weightClass: fighter.WeightClass || "N/A",
      },
      careerStats: fighter.CareerStats || {},
      dataQuality: "High",
    };
  }

  /**
   * Format UFC Stats fighter profile
   * @param {Object} fighter - Raw UFC Stats fighter data
   * @returns {Object} Formatted fighter profile
   */
  formatUFCStatsProfile(fighter) {
    return {
      name: fighter.name,
      nickname: fighter.nickname || "",
      record: fighter.record || "N/A",
      physicalStats: {
        height: fighter.height || "N/A",
        weight: fighter.weight || "N/A",
        reach: fighter.reach || "N/A",
      },
      details: {
        birthDate: fighter.birthdate || "N/A",
        birthPlace: fighter.birthplace || "N/A",
        weightClass: fighter.weightClass || "N/A",
        stance: fighter.stance || "N/A",
        team: fighter.team || "N/A",
      },
      recentFights: fighter.recentFights || [],
      profileUrl: fighter.profileUrl,
      dataQuality: "Medium",
    };
  }

  /**
   * Format basic fighter profile
   * @param {Object} fighter - Raw basic fighter data
   * @returns {Object} Formatted fighter profile
   */
  formatBasicProfile(fighter) {
    return {
      name: fighter.name,
      nickname: fighter.nickname || "",
      record: fighter.record || "N/A",
      physicalStats: fighter.physicalStats || {},
      details: fighter.details || {},
      dataQuality: "Basic",
    };
  }

  /**
   * Compare two fighter profiles
   * @param {Object} fighter1 - First fighter profile
   * @param {Object} fighter2 - Second fighter profile
   * @returns {Object} Comparison analysis
   */
  compareProfiles(fighter1, fighter2) {
    const analysis = {};

    // Record comparison
    if (fighter1.record && fighter2.record) {
      if (
        typeof fighter1.record === "object" &&
        typeof fighter2.record === "object"
      ) {
        const wins1 = fighter1.record.wins || 0;
        const wins2 = fighter2.record.wins || 0;
        analysis.moreWins = wins1 > wins2 ? fighter1.name : fighter2.name;
      }
    }

    // Physical stats comparison
    if (fighter1.physicalStats && fighter2.physicalStats) {
      // Height comparison (simplified)
      if (fighter1.physicalStats.height && fighter2.physicalStats.height) {
        // This is a simplified comparison - in reality you'd parse the height strings
        analysis.height = "Comparison available";
      }
    }

    return analysis;
  }

  /**
   * Test connection to all services
   * @returns {Object} Connection status for each service
   */
  async testConnections() {
    const results = {};

    try {
      results.sportsDataIO = await this.sportsDataService.testConnection();
    } catch (error) {
      results.sportsDataIO = false;
    }

    // UFC Stats and Basic services don't have explicit test methods
    results.ufcStats = true; // Assume available
    results.basicService = true; // Assume available

    return results;
  }
}
