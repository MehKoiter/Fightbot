/**
 * Interaction State Manager
 * Prevents race conditions and duplicate responses for Discord interactions
 */

class InteractionStateManager {
    constructor() {
        this.processedInteractions = new Map();
        this.cleanupInterval = 10000; // 10 seconds
        
        // Clean up old interactions periodically
        setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }

    /**
     * Check if interaction has been processed and mark it as processing
     * @param {Object} interaction - Discord interaction
     * @returns {boolean} True if safe to process, false if already being processed
     */
    markAsProcessing(interaction) {
        const interactionId = interaction.id;
        const now = Date.now();
        
        // Check if already processing
        if (this.processedInteractions.has(interactionId)) {
            console.log(`⚠️ Interaction ${interactionId} already being processed`);
            return false;
        }
        
        // Mark as processing
        this.processedInteractions.set(interactionId, {
            timestamp: now,
            type: interaction.type,
            commandName: interaction.commandName || 'unknown'
        });
        
        console.log(`🔄 Marked interaction ${interactionId} as processing`);
        return true;
    }

    /**
     * Mark interaction as completed
     * @param {Object} interaction - Discord interaction
     */
    markAsCompleted(interaction) {
        const interactionId = interaction.id;
        if (this.processedInteractions.has(interactionId)) {
            const data = this.processedInteractions.get(interactionId);
            data.completed = true;
            data.completedAt = Date.now();
            console.log(`✅ Marked interaction ${interactionId} as completed`);
        }
    }

    /**
     * Check if interaction is safe to respond to
     * @param {Object} interaction - Discord interaction
     * @returns {boolean} True if safe to respond
     */
    isSafeToRespond(interaction) {
        return !interaction.responded && 
               !interaction.deferred && 
               this.processedInteractions.has(interaction.id);
    }

    /**
     * Clean up old interactions (older than 30 seconds)
     */
    cleanup() {
        const cutoff = Date.now() - 30000; // 30 seconds
        let cleaned = 0;
        
        for (const [id, data] of this.processedInteractions.entries()) {
            if (data.timestamp < cutoff) {
                this.processedInteractions.delete(id);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} old interactions`);
        }
    }

    /**
     * Get stats about processed interactions
     * @returns {Object} Stats object
     */
    getStats() {
        return {
            totalProcessed: this.processedInteractions.size,
            byType: Array.from(this.processedInteractions.values()).reduce((acc, data) => {
                acc[data.type] = (acc[data.type] || 0) + 1;
                return acc;
            }, {})
        };
    }
}

// Create singleton instance
const interactionStateManager = new InteractionStateManager();

export default interactionStateManager;
