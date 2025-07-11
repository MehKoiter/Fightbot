// Test the Full Card functionality with winner display
import { EmbedBuilder } from 'discord.js';
import SportsDataMMAService from './services/sportsDataMMAService.js';
import WikipediaUFCService from './services/wikipediaUFCService.js';

const sportsDataService = new SportsDataMMAService();
const wikipediaService = new WikipediaUFCService();

// Simulate the createUFCDetailsEmbed function logic for testing
async function testFullCardDisplay(eventId) {
    console.log(`Testing Full Card display for UFC ${eventId}...`);
    
    let eventDetails = null;
    let dataSource = 'Unknown';
    
    // Try SportsData.io first if we have an event ID
    if (eventId && !isNaN(eventId)) {
        try {
            eventDetails = await sportsDataService.getEventDetails(eventId);
            if (eventDetails) {
                dataSource = 'SportsData.io';
            }
        } catch (error) {
            console.log(`SportsData.io failed for event ${eventId}, trying alternative...`);
        }
    }
    
    // If SportsData failed or we have a UFC number, try Wikipedia
    if (!eventDetails) {
        try {
            eventDetails = await wikipediaService.getUFCEventByNumber(eventId);
            if (eventDetails) {
                dataSource = 'Wikipedia';
            }
        } catch (error) {
            console.log(`Wikipedia failed for UFC ${eventId}`);
        }
    }
    
    if (!eventDetails) {
        console.log('❌ No event details found');
        return;
    }
    
    console.log(`✅ Found event via ${dataSource}`);
    console.log(`Event: ${eventDetails.title || eventDetails.Name}`);
    
    // Test the fight display logic
    const fights = eventDetails.fights || eventDetails.Fights || [];
    if (fights.length > 0) {
        console.log(`\n🥊 Found ${fights.length} fights`);
        
        // Show first few fights with the new winner display logic
        const displayFights = fights.slice(0, 5);
        displayFights.forEach((fight, index) => {
            if (dataSource === 'Wikipedia') {
                if (fight.fighters && fight.fighters.length >= 2) {
                    const emoji = index === 0 ? '👑' : index < 5 ? '🥊' : '⚔️';
                    let fightText = '';
                    
                    if (fight.result === 'win' || fight.winner) {
                        const winner = fight.winner || fight.fighters[0].name;
                        const loser = fight.fighters.find(f => f.name !== winner)?.name || fight.fighters[1].name;
                        fightText = `${emoji} **${winner}** def. ${loser}`;
                        
                        if (fight.method) {
                            fightText += ` (${fight.method})`;
                        }
                    } else {
                        fightText = `${emoji} **${fight.fighters[0].name}** vs **${fight.fighters[1].name}**`;
                    }
                    
                    if (fight.weightClass) {
                        fightText += ` - ${fight.weightClass}`;
                    }
                    
                    console.log(fightText);
                }
            } else {
                // SportsData format
                const fighter1 = fight.Fighters?.[0];
                const fighter2 = fight.Fighters?.[1];
                
                if (fighter1 && fighter2) {
                    const emoji = index === 0 ? '👑' : index < 5 ? '🥊' : '⚔️';
                    const name1 = `${fighter1.FirstName} ${fighter1.LastName}`;
                    const name2 = `${fighter2.FirstName} ${fighter2.LastName}`;
                    let fightText = '';
                    
                    if (fight.Status === 'Final' || fighter1.Winner !== undefined || fighter2.Winner !== undefined) {
                        let winner, loser;
                        
                        if (fighter1.Winner === true) {
                            winner = name1;
                            loser = name2;
                        } else if (fighter2.Winner === true) {
                            winner = name2;
                            loser = name1;
                        }
                        
                        if (winner && loser) {
                            fightText = `${emoji} **${winner}** def. ${loser}`;
                            
                            if (fight.ResultType && fight.ResultType !== 'Scrambled') {
                                fightText += ` (${fight.ResultType})`;
                            }
                            
                            if (fight.ResultRound && fight.ResultRound !== 'Scrambled') {
                                fightText += ` R${fight.ResultRound}`;
                            }
                        } else {
                            fightText = `${emoji} **${name1}** vs **${name2}**`;
                        }
                    } else {
                        fightText = `${emoji} **${name1}** vs **${name2}**`;
                    }
                    
                    if (fight.WeightClass && fight.WeightClass !== 'Scrambled') {
                        fightText += ` - ${fight.WeightClass}`;
                    }
                    
                    console.log(fightText);
                }
            }
        });
    } else {
        console.log('❌ No fights found');
    }
}

// Test with a recent event that should have results
testFullCardDisplay('791').catch(console.error); // UFC Fight Night: Ankalaev vs. Walker 2
