// Comprehensive test of the button fix
import { Events, EmbedBuilder } from 'discord.js';

// Mock the interaction parts we need
class MockInteraction {
    constructor(customId) {
        this.customId = customId;
        this.user = { tag: 'TestUser#1234' };
        this.guildId = 'test-guild';
        this._deferred = false;
        this._replied = false;
    }
    
    async deferReply(options = {}) {
        this._deferred = true;
        console.log(`   ⏳ Deferred reply (ephemeral: ${options.ephemeral || false})`);
    }
    
    async editReply(options) {
        if (!this._deferred) throw new Error('Not deferred');
        console.log(`   📤 Edit reply: ${options.embeds?.[0]?.data?.title || 'No title'}`);
        if (options.embeds?.[0]?.data?.fields) {
            console.log(`   📊 Fields: ${options.embeds[0].data.fields.length}`);
        }
        return { id: 'test-message' };
    }
}

// Import the fixed functions (simplified versions for testing)
import SportsDataMMAService from './services/sportsDataMMAService.js';
import WikipediaUFCService from './services/wikipediaUFCService.js';
import { VERSION_CONFIG } from './config/version.js';

// Simplified version of the createUFCDetailsEmbed function for testing
async function createUFCDetailsEmbed(eventId, dataSource = null) {
    try {
        const sportsDataService = new SportsDataMMAService();
        const wikipediaService = new WikipediaUFCService();
        
        let eventDetails = null;
        let actualDataSource = 'Unknown';
        
        // Use the specified data source if available
        if (dataSource === 'sports' && eventId && !isNaN(eventId)) {
            try {
                eventDetails = await sportsDataService.getEventDetails(eventId);
                if (eventDetails) {
                    actualDataSource = 'SportsData.io';
                }
            } catch (error) {
                console.log(`   ❌ SportsData.io failed for event ${eventId}`);
            }
        } else if (dataSource === 'wiki') {
            try {
                eventDetails = await wikipediaService.getUFCEventByNumber(eventId);
                if (eventDetails) {
                    actualDataSource = 'Wikipedia';
                }
            } catch (error) {
                console.log(`   ❌ Wikipedia failed for UFC ${eventId}`);
            }
        }
        
        if (!eventDetails) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Details Not Available')
                .setDescription(`Sorry, I couldn't load detailed information for UFC ${eventId}.`);
            return embed;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#ff6600')
            .setTitle(`📋 ${eventDetails.title || eventDetails.Name || `UFC ${eventId}`} - Full Card Details`)
            .setDescription(eventDetails.description || eventDetails.ShortName || 'Complete fight card information');
        
        const fights = eventDetails.fights || eventDetails.Fights || [];
        embed.addFields({
            name: `🥊 Fight Card (${fights.length} fights)`,
            value: fights.length > 0 ? `Found ${fights.length} fights` : 'No fight details available',
            inline: false
        });
        
        embed.setFooter({ 
            text: `${VERSION_CONFIG.BOT_NAME} v${VERSION_CONFIG.VERSION} • Data from ${actualDataSource}` 
        });
        embed.setTimestamp();
        
        return embed;
        
    } catch (error) {
        console.error('   ❌ Error creating UFC details embed:', error.message);
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('❌ Error Loading Details')
            .setDescription('Sorry, there was an error loading the detailed fight card information.');
        return embed;
    }
}

// Simplified button handler for testing
async function handleUFCButton(interaction) {
    const { customId } = interaction;
    console.log(`🔍 Processing button: ${customId}`);
    
    const parts = customId.split('_');
    const action = parts[1];
    const dataSource = parts[2]; 
    const eventId = parts[3] || parts[2]; 
    
    console.log(`   🎯 Action: ${action}, DataSource: ${dataSource || 'legacy'}, EventId: ${eventId || 'N/A'}`);
    
    await interaction.deferReply({ ephemeral: true });
    
    if (action === 'details') {
        if (!eventId) {
            console.log('   ❌ Missing event ID');
            return;
        }
        
        const embed = await createUFCDetailsEmbed(eventId, dataSource);
        await interaction.editReply({ embeds: [embed] });
    }
}

async function runTests() {
    console.log('🧪 Testing button interaction fixes...\n');
    
    // Test 1: UFC 318 with new Wikipedia button
    console.log('Test 1: UFC 318 Wikipedia button (FIXED)');
    const wikiButton = new MockInteraction('ufc_details_wiki_318');
    await handleUFCButton(wikiButton);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: UFC 317 with SportsData button  
    console.log('Test 2: UFC 317 SportsData button');
    const sportsButton = new MockInteraction('ufc_details_sports_852');
    await handleUFCButton(sportsButton);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Legacy button format (should still work)
    console.log('Test 3: Legacy button format (UFC 300)');
    const legacyButton = new MockInteraction('ufc_details_300');
    await handleUFCButton(legacyButton);
    
    console.log('\n✅ All tests completed!');
}

runTests().catch(console.error);
