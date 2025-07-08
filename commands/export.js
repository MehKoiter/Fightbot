import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from "discord.js";
import UfcService from "../services/ufcService.js";
import BettingOddsService from "../services/bettingOddsService.js";
import { VERSION_CONFIG, isFeatureEnabled } from "../config/version.js";

export default {
    data: new SlashCommandBuilder()
        .setName('export')
        .setDescription('Export fight data and analytics (Premium feature)')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type of data to export')
                .setRequired(true)
                .addChoices(
                    { name: 'Fight Card', value: 'fightcard' },
                    { name: 'Fighter Statistics', value: 'stats' },
                    { name: 'Betting Odds', value: 'odds' },
                    { name: 'Event History', value: 'history' },
                    { name: 'Analytics Report', value: 'analytics' }
                ))
        .addStringOption(option =>
            option.setName('format')
                .setDescription('Export format')
                .setRequired(false)
                .addChoices(
                    { name: 'JSON', value: 'json' },
                    { name: 'CSV', value: 'csv' },
                    { name: 'PDF Report', value: 'pdf' }
                )),
    
    execute: async (interaction) => {
        // Check if premium feature
        if (!isFeatureEnabled('exportData')) {
            const featureLockedEmbed = new EmbedBuilder()
                .setColor('#ff6347')
                .setTitle('🔒 Premium Feature')
                .setDescription(VERSION_CONFIG.messages.featureDisabled)
                .addFields({
                    name: '🌟 Available in Premium',
                    value: '• Export fight cards and statistics\n• Generate detailed analytics reports\n• Download betting odds data\n• Historical event data export\n• Multiple format support (JSON, CSV, PDF)',
                    inline: false
                })
                .setFooter({ text: 'Use /premium to learn more about upgrading' });
            
            await interaction.reply({ embeds: [featureLockedEmbed], ephemeral: true });
            return;
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            const exportType = interaction.options.getString('type');
            const format = interaction.options.getString('format') || 'json';
            
            const ufcService = new UfcService();
            const bettingService = new BettingOddsService();
            
            let exportData;
            let filename;
            
            switch (exportType) {
                case 'fightcard':
                    exportData = await this.exportFightCard(ufcService, format);
                    filename = `fightcard-${Date.now()}`;
                    break;
                    
                case 'stats':
                    exportData = await this.exportFighterStats(ufcService, format);
                    filename = `fighter-stats-${Date.now()}`;
                    break;
                    
                case 'odds':
                    exportData = await this.exportBettingOdds(ufcService, bettingService, format);
                    filename = `betting-odds-${Date.now()}`;
                    break;
                    
                case 'history':
                    exportData = await this.exportEventHistory(ufcService, format);
                    filename = `event-history-${Date.now()}`;
                    break;
                    
                case 'analytics':
                    exportData = await this.exportAnalyticsReport(ufcService, bettingService, format);
                    filename = `analytics-report-${Date.now()}`;
                    break;
                    
                default:
                    throw new Error('Invalid export type');
            }

            if (!exportData) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Export Failed')
                    .setDescription('No data available for export at this time.');
                
                await interaction.editReply({ embeds: [errorEmbed] });
                return;
            }

            // Create file attachment
            const fileExtension = format === 'pdf' ? 'pdf' : (format === 'csv' ? 'csv' : 'json');
            const fullFilename = `${filename}.${fileExtension}`;
            
            let fileContent;
            if (format === 'json') {
                fileContent = JSON.stringify(exportData, null, 2);
            } else if (format === 'csv') {
                fileContent = this.convertToCSV(exportData);
            } else if (format === 'pdf') {
                fileContent = await this.generatePDF(exportData, exportType);
            }

            const attachment = new AttachmentBuilder(Buffer.from(fileContent), { name: fullFilename });

            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('📤 Export Successful')
                .setDescription(`Your ${exportType} data has been exported successfully.`)
                .addFields(
                    {
                        name: '📋 Export Details',
                        value: `• Type: ${exportType.charAt(0).toUpperCase() + exportType.slice(1)}\n• Format: ${format.toUpperCase()}\n• File: ${fullFilename}\n• Size: ${(fileContent.length / 1024).toFixed(2)} KB`,
                        inline: false
                    },
                    {
                        name: '⏰ Generated',
                        value: new Date().toLocaleString(),
                        inline: true
                    },
                    {
                        name: '🔒 Privacy',
                        value: 'This file is private and only visible to you',
                        inline: true
                    }
                )
                .setFooter({ text: 'FightBot Premium • Data Export Service' });

            await interaction.editReply({ 
                embeds: [successEmbed], 
                files: [attachment]
            });

        } catch (error) {
            console.error('Error exporting data:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Export Error')
                .setDescription('Unable to export data at this time. Please try again later.');
            
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },

    async exportFightCard(ufcService, format) {
        const event = await ufcService.getUpcomingEvent();
        if (!event) return null;

        const exportData = {
            metadata: {
                exportType: 'fightcard',
                generatedAt: new Date().toISOString(),
                source: 'FightBot Premium'
            },
            event: {
                title: event.title,
                subtitle: event.subtitle,
                date: event.date,
                venue: event.venue,
                location: event.location
            },
            fights: event.fights.map(fight => ({
                weightClass: fight.weightClass,
                redCorner: {
                    name: fight.redCorner.name,
                    rank: fight.redCorner.rank,
                    record: fight.redCorner.record
                },
                blueCorner: {
                    name: fight.blueCorner.name,
                    rank: fight.blueCorner.rank,
                    record: fight.blueCorner.record
                },
                titleFight: fight.titleFight || false,
                rounds: fight.rounds || 3
            }))
        };

        return exportData;
    },

    async exportFighterStats(ufcService, format) {
        const event = await ufcService.getUpcomingEvent();
        if (!event || !event.fights) return null;

        const exportData = {
            metadata: {
                exportType: 'fighter-statistics',
                generatedAt: new Date().toISOString(),
                source: 'FightBot Premium'
            },
            fighters: []
        };

        // Extract unique fighters
        const fighters = new Set();
        event.fights.forEach(fight => {
            fighters.add(fight.redCorner.name);
            fighters.add(fight.blueCorner.name);
        });

        // Generate mock stats for each fighter
        for (const fighterName of fighters) {
            const stats = this.generateMockFighterStats(fighterName);
            exportData.fighters.push(stats);
        }

        return exportData;
    },

    async exportBettingOdds(ufcService, bettingService, format) {
        const event = await ufcService.getUpcomingEvent();
        if (!event || !event.fights) return null;

        const exportData = {
            metadata: {
                exportType: 'betting-odds',
                generatedAt: new Date().toISOString(),
                source: 'FightBot Premium'
            },
            event: {
                title: event.title,
                date: event.date
            },
            odds: []
        };

        // Get odds for main fights
        for (const fight of event.fights.slice(0, 5)) {
            const oddsData = await bettingService.getFightOdds(fight);
            if (oddsData) {
                exportData.odds.push({
                    fight: {
                        redCorner: fight.redCorner.name,
                        blueCorner: fight.blueCorner.name,
                        weightClass: fight.weightClass
                    },
                    moneyline: oddsData.odds.moneyline,
                    overUnder: oddsData.odds.overUnder,
                    methodOfVictory: oddsData.odds.methodOfVictory,
                    sportsbooks: oddsData.sportsbooks,
                    lastUpdated: oddsData.lastUpdated
                });
            }
        }

        return exportData;
    },

    async exportEventHistory(ufcService, format) {
        // Generate mock historical data
        const exportData = {
            metadata: {
                exportType: 'event-history',
                generatedAt: new Date().toISOString(),
                source: 'FightBot Premium'
            },
            events: this.generateMockEventHistory()
        };

        return exportData;
    },

    async exportAnalyticsReport(ufcService, bettingService, format) {
        const event = await ufcService.getUpcomingEvent();
        if (!event) return null;

        const exportData = {
            metadata: {
                exportType: 'analytics-report',
                generatedAt: new Date().toISOString(),
                source: 'FightBot Premium'
            },
            event: {
                title: event.title,
                date: event.date
            },
            analytics: {
                summary: {
                    totalFights: event.fights.length,
                    titleFights: event.fights.filter(f => f.titleFight).length,
                    avgFighterRank: this.calculateAvgRank(event.fights)
                },
                predictions: await this.generateEventPredictions(event),
                trends: this.generateTrendAnalysis(event),
                insights: this.generateInsights(event)
            }
        };

        return exportData;
    },

    convertToCSV(data) {
        if (data.fights) {
            // Fight card CSV
            let csv = 'Weight Class,Red Corner,Red Rank,Red Record,Blue Corner,Blue Rank,Blue Record,Title Fight\n';
            data.fights.forEach(fight => {
                csv += `"${fight.weightClass}","${fight.redCorner.name}","${fight.redCorner.rank || ''}","${fight.redCorner.record || ''}","${fight.blueCorner.name}","${fight.blueCorner.rank || ''}","${fight.blueCorner.record || ''}","${fight.titleFight || false}"\n`;
            });
            return csv;
        } else if (data.fighters) {
            // Fighter stats CSV
            let csv = 'Fighter,Wins,Losses,Draws,Striking Accuracy,Takedown Accuracy,Takedown Defense,Submission Avg\n';
            data.fighters.forEach(fighter => {
                csv += `"${fighter.name}",${fighter.wins},${fighter.losses},${fighter.draws},${fighter.strikingAccuracy},${fighter.takedownAccuracy},${fighter.takedownDefense},${fighter.submissionAvg}\n`;
            });
            return csv;
        } else {
            // Generic CSV conversion
            return JSON.stringify(data, null, 2);
        }
    },

    async generatePDF(data, exportType) {
        // In a real implementation, this would use a PDF generation library
        // For now, return formatted text
        let pdfContent = `FIGHTBOT PREMIUM REPORT\n`;
        pdfContent += `========================\n\n`;
        pdfContent += `Export Type: ${exportType.toUpperCase()}\n`;
        pdfContent += `Generated: ${new Date().toLocaleString()}\n\n`;
        
        if (data.event) {
            pdfContent += `EVENT: ${data.event.title}\n`;
            pdfContent += `Date: ${data.event.date}\n\n`;
        }
        
        pdfContent += `DATA:\n`;
        pdfContent += JSON.stringify(data, null, 2);
        
        return pdfContent;
    },

    generateMockFighterStats(fighterName) {
        return {
            name: fighterName,
            wins: Math.floor(Math.random() * 20) + 5,
            losses: Math.floor(Math.random() * 8),
            draws: Math.floor(Math.random() * 2),
            strikingAccuracy: (Math.random() * 30 + 40).toFixed(1) + '%',
            takedownAccuracy: (Math.random() * 40 + 30).toFixed(1) + '%',
            takedownDefense: (Math.random() * 30 + 60).toFixed(1) + '%',
            submissionAvg: (Math.random() * 3).toFixed(1),
            avgFightTime: (Math.random() * 10 + 8).toFixed(1) + ' min',
            finishRate: (Math.random() * 40 + 30).toFixed(1) + '%'
        };
    },

    generateMockEventHistory() {
        const events = [];
        const eventNames = [
            'UFC 299: O\'Malley vs Vera 2',
            'UFC 298: Volkanovski vs Topuria',
            'UFC 297: Strickland vs du Plessis',
            'UFC 296: Edwards vs Muhammad 2',
            'UFC 295: Prochazka vs Pereira'
        ];

        eventNames.forEach((name, index) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (index + 1));
            
            events.push({
                title: name,
                date: date.toISOString().split('T')[0],
                venue: `T-Mobile Arena, Las Vegas`,
                mainEvent: name.split(': ')[1],
                totalFights: Math.floor(Math.random() * 5) + 10,
                attendance: Math.floor(Math.random() * 5000) + 15000
            });
        });

        return events;
    },

    calculateAvgRank(fights) {
        let totalRank = 0;
        let rankedFighters = 0;

        fights.forEach(fight => {
            [fight.redCorner, fight.blueCorner].forEach(fighter => {
                if (fighter.rank && fighter.rank !== 'Unranked') {
                    const rank = parseInt(fighter.rank.replace('#', ''));
                    if (!isNaN(rank)) {
                        totalRank += rank;
                        rankedFighters++;
                    }
                }
            });
        });

        return rankedFighters > 0 ? (totalRank / rankedFighters).toFixed(1) : 'N/A';
    },

    async generateEventPredictions(event) {
        return event.fights.slice(0, 3).map(fight => ({
            fight: `${fight.redCorner.name} vs ${fight.blueCorner.name}`,
            prediction: Math.random() > 0.5 ? fight.redCorner.name : fight.blueCorner.name,
            confidence: (Math.random() * 30 + 60).toFixed(1) + '%',
            method: ['Decision', 'KO/TKO', 'Submission'][Math.floor(Math.random() * 3)]
        }));
    },

    generateTrendAnalysis(event) {
        return {
            competitiveBalance: (Math.random() * 20 + 70).toFixed(1) + '%',
            finishProbability: (Math.random() * 30 + 45).toFixed(1) + '%',
            upsetPotential: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
            viewerInterest: (Math.random() * 20 + 75).toFixed(1) + '%'
        };
    },

    generateInsights(event) {
        return [
            'Main event features two highly ranked contenders',
            'Multiple title implications throughout the card',
            'Strong betting interest across main card fights',
            'High finish rate expected based on fighter styles',
            'Potential for multiple performance bonuses'
        ];
    }
};
