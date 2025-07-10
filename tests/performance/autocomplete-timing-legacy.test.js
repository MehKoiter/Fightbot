/**
 * Test script for fighter autocomplete timing issues
 * Tests the interaction between autocomplete and command execution
 */

import { SlashCommandBuilder } from 'discord.js';

console.log('🧪 Testing Fighter Autocomplete Timing Issues');
console.log('==============================================');

// Mock interaction objects to simulate the timing issue
class MockAutocompleteInteraction {
    constructor(id) {
        this.id = id;
        this.responded = false;
        this.replied = false;
        this.deferred = false;
        this.commandName = 'fighter';
    }
    
    options = {
        getFocused: () => 'Jon'
    };
    
    async respond(choices) {
        if (this.responded) {
            throw new Error('Interaction has already been acknowledged.');
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
        
        this.responded = true;
        return choices;
    }
}

class MockCommandInteraction {
    constructor(id) {
        this.id = id;
        this.responded = false;
        this.replied = false;
        this.deferred = false;
        this.commandName = 'fighter';
    }
    
    options = {
        getString: (name) => {
            if (name === 'name') return 'Jon Jones';
            if (name === 'compare') return null;
            return null;
        }
    };
    
    async deferReply() {
        if (this.deferred || this.replied) {
            throw new Error('Interaction has already been acknowledged.');
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
        
        this.deferred = true;
    }
    
    async reply(data) {
        if (this.replied || this.deferred) {
            throw new Error('Interaction has already been acknowledged.');
        }
        
        this.replied = true;
        return data;
    }
    
    async editReply(data) {
        if (!this.deferred) {
            throw new Error('Interaction has not been deferred.');
        }
        
        return data;
    }
}

// Test autocomplete function
async function testAutocomplete(interaction) {
    try {
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Autocomplete timeout')), 2000)
        );
        
        const autocompletePromise = (async () => {
            const focusedValue = interaction.options.getFocused();
            
            const fighters = [
                'Jon Jones', 'Islam Makhachev', 'Alexander Volkanovski',
                'Leon Edwards', 'Aljamain Sterling', 'Charles Oliveira'
            ];

            const filtered = fighters
                .filter(fighter => fighter.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25);

            if (!interaction.responded) {
                await interaction.respond(
                    filtered.map(fighter => ({
                        name: fighter,
                        value: fighter
                    }))
                );
            }
        })();
        
        await Promise.race([autocompletePromise, timeout]);
        return true;
        
    } catch (error) {
        console.error('Autocomplete error:', error.message);
        
        try {
            if (!interaction.responded) {
                await interaction.respond([]);
            }
        } catch (responseError) {
            console.error('Failed to send empty response:', responseError.message);
        }
        return false;
    }
}

// Test command execution with safe defer
async function testCommandExecution(interaction) {
    try {
        let hasDeferred = false;
        
        const safeDeferReply = async () => {
            if (!hasDeferred && !interaction.replied && !interaction.deferred) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.deferReply();
                        hasDeferred = true;
                    }
                } catch (error) {
                    if (error.message.includes('already been acknowledged')) {
                        console.log('Interaction was already handled - continuing without defer');
                        return;
                    }
                    throw error;
                }
            }
        };
        
        await safeDeferReply();
        
        // Simulate command processing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = { content: 'Fighter command executed successfully' };
        
        if (hasDeferred || interaction.deferred) {
            await interaction.editReply(response);
        } else {
            await interaction.reply(response);
        }
        
        return true;
        
    } catch (error) {
        console.error('Command execution error:', error.message);
        return false;
    }
}

// Run timing tests
async function runTimingTests() {
    console.log('📋 Test 1: Autocomplete Timing');
    console.log('-------------------------------');
    
    const results = {
        autocompleteSuccess: 0,
        autocompleteFailure: 0,
        commandSuccess: 0,
        commandFailure: 0
    };
    
    // Test multiple autocomplete scenarios
    for (let i = 0; i < 5; i++) {
        const autocompleteInteraction = new MockAutocompleteInteraction(`autocomplete_${i}`);
        const success = await testAutocomplete(autocompleteInteraction);
        
        if (success) {
            results.autocompleteSuccess++;
            console.log(`✅ Autocomplete ${i + 1}: Success`);
        } else {
            results.autocompleteFailure++;
            console.log(`❌ Autocomplete ${i + 1}: Failed`);
        }
    }
    
    console.log('\n📋 Test 2: Command Execution with Safe Defer');
    console.log('--------------------------------------------');
    
    // Test command execution scenarios
    for (let i = 0; i < 5; i++) {
        const commandInteraction = new MockCommandInteraction(`command_${i}`);
        const success = await testCommandExecution(commandInteraction);
        
        if (success) {
            results.commandSuccess++;
            console.log(`✅ Command ${i + 1}: Success`);
        } else {
            results.commandFailure++;
            console.log(`❌ Command ${i + 1}: Failed`);
        }
    }
    
    console.log('\n📊 Test Results Summary:');
    console.log('=========================');
    console.log(`Autocomplete Success: ${results.autocompleteSuccess}/5`);
    console.log(`Autocomplete Failures: ${results.autocompleteFailure}/5`);
    console.log(`Command Success: ${results.commandSuccess}/5`);
    console.log(`Command Failures: ${results.commandFailure}/5`);
    
    const totalSuccess = results.autocompleteSuccess + results.commandSuccess;
    const totalTests = 10;
    const successRate = (totalSuccess / totalTests * 100).toFixed(1);
    
    console.log(`\n🎯 Overall Success Rate: ${successRate}%`);
    
    if (successRate >= 90) {
        console.log('🎉 Autocomplete timing fix is working well!');
    } else {
        console.log('⚠️ Autocomplete timing needs further improvement.');
    }
}

runTimingTests().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error(error);
    process.exit(1);
});
