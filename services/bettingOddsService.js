/**
 * Betting Odds Service for FightBot Premium
 * Simulates betting odds data - in production, this would integrate with real sportsbook APIs
 */

class BettingOddsService {
    constructor() {
        this.sportsbooks = [
            'DraftKings',
            'FanDuel', 
            'BetMGM',
            'Caesars',
            'ESPN BET'
        ];
    }

    /**
     * Get betting odds for a fight
     * @param {Object} fight Fight data
     * @returns {Object} Betting odds data
     */
    async getFightOdds(fight) {
        if (!fight || !fight.redCorner || !fight.blueCorner) {
            return null;
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Generate realistic odds based on fighter rankings
        const redRank = this.parseRank(fight.redCorner.rank);
        const blueRank = this.parseRank(fight.blueCorner.rank);
        
        const odds = this.generateOdds(redRank, blueRank);

        return {
            fight: {
                redCorner: fight.redCorner.name,
                blueCorner: fight.blueCorner.name,
                weightClass: fight.weightClass
            },
            odds: {
                moneyline: odds.moneyline,
                overUnder: odds.overUnder,
                methodOfVictory: odds.methodOfVictory
            },
            sportsbooks: this.generateSportsbookOdds(odds),
            lastUpdated: new Date().toISOString(),
            disclaimer: "Odds are for entertainment purposes. Always gamble responsibly."
        };
    }

    /**
     * Parse fighter rank to numeric value
     */
    parseRank(rankString) {
        if (!rankString || rankString === 'Unranked') return 999;
        const match = rankString.match(/#?(\d+)/);
        return match ? parseInt(match[1]) : 999;
    }

    /**
     * Generate realistic betting odds
     */
    generateOdds(redRank, blueRank) {
        let redFavorite = redRank < blueRank;
        let rankDiff = Math.abs(redRank - blueRank);

        // Base odds calculation
        let favoriteOdds, underdogOdds;
        
        if (rankDiff <= 2) {
            // Close fight
            favoriteOdds = -120;
            underdogOdds = 100;
        } else if (rankDiff <= 5) {
            // Moderate favorite
            favoriteOdds = -180;
            underdogOdds = 150;
        } else {
            // Heavy favorite
            favoriteOdds = -250;
            underdogOdds = 200;
        }

        // Add some randomness
        favoriteOdds += Math.floor(Math.random() * 40) - 20;
        underdogOdds += Math.floor(Math.random() * 50) - 25;

        return {
            moneyline: {
                red: redFavorite ? favoriteOdds : underdogOdds,
                blue: redFavorite ? underdogOdds : favoriteOdds
            },
            overUnder: {
                rounds: 2.5,
                over: -110,
                under: -110
            },
            methodOfVictory: {
                ko_tko: 250,
                submission: 350,
                decision: 180
            }
        };
    }

    /**
     * Generate odds from multiple sportsbooks
     */
    generateSportsbookOdds(baseOdds) {
        return this.sportsbooks.map(book => ({
            sportsbook: book,
            moneyline: {
                red: baseOdds.moneyline.red + (Math.floor(Math.random() * 20) - 10),
                blue: baseOdds.moneyline.blue + (Math.floor(Math.random() * 20) - 10)
            },
            overUnder: {
                rounds: baseOdds.overUnder.rounds,
                over: baseOdds.overUnder.over + (Math.floor(Math.random() * 10) - 5),
                under: baseOdds.overUnder.under + (Math.floor(Math.random() * 10) - 5)
            }
        }));
    }

    /**
     * Format odds for display
     */
    formatOdds(odds) {
        if (odds > 0) return `+${odds}`;
        return odds.toString();
    }

    /**
     * Get odds movement/trends (simulated)
     */
    async getOddsMovement(fight) {
        return {
            trend: Math.random() > 0.5 ? 'up' : 'down',
            movement: Math.floor(Math.random() * 30) + 5,
            volume: Math.floor(Math.random() * 1000) + 100,
            publicBetting: {
                redCornerPercentage: Math.floor(Math.random() * 40) + 30,
                blueCornerPercentage: Math.floor(Math.random() * 40) + 30
            }
        };
    }
}

export default BettingOddsService;
