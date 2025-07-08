/**
 * Notification Service
 * Handles sending notifications to premium users based on their preferences
 */

import { EmbedBuilder } from "discord.js";
import UserPreferencesService from "./userPreferencesService.js";

class NotificationService {
    constructor(client) {
        this.client = client;
        this.userPrefs = new UserPreferencesService();
        this.notificationQueue = [];
        this.isProcessing = false;
    }

    // Queue a notification to be sent
    queueNotification(type, data, targetUsers = null) {
        const notification = {
            id: this.generateNotificationId(),
            type,
            data,
            targetUsers,
            createdAt: new Date(),
            priority: this.getNotificationPriority(type)
        };

        this.notificationQueue.push(notification);
        this.processQueue();
    }

    // Process the notification queue
    async processQueue() {
        if (this.isProcessing || this.notificationQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        // Sort by priority (higher numbers first)
        this.notificationQueue.sort((a, b) => b.priority - a.priority);

        while (this.notificationQueue.length > 0) {
            const notification = this.notificationQueue.shift();
            await this.processNotification(notification);
            
            // Small delay to avoid rate limits
            await this.delay(100);
        }

        this.isProcessing = false;
    }

    // Process a single notification
    async processNotification(notification) {
        try {
            let recipients = notification.targetUsers;

            // If no specific users targeted, find users who want this notification type
            if (!recipients) {
                recipients = this.userPrefs.getUsersWithNotification(notification.type);
            }

            // Filter recipients based on their preferences
            const filteredRecipients = recipients.filter(userId => 
                this.userPrefs.shouldNotify(userId, notification.type)
            );

            // Send notification to each recipient
            for (const userId of filteredRecipients) {
                await this.sendNotificationToUser(userId, notification);
            }

            console.log(`Notification ${notification.id} sent to ${filteredRecipients.length} users`);
        } catch (error) {
            console.error(`Error processing notification ${notification.id}:`, error);
        }
    }

    // Send notification to a specific user
    async sendNotificationToUser(userId, notification) {
        try {
            const user = await this.client.users.fetch(userId);
            if (!user) {
                console.warn(`User ${userId} not found for notification`);
                return;
            }

            const embed = this.createNotificationEmbed(notification, userId);
            
            await user.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Failed to send notification to user ${userId}:`, error);
        }
    }

    // Create embed for notification
    createNotificationEmbed(notification, userId) {
        const userPrefs = this.userPrefs.getUserPreferences(userId);
        
        switch (notification.type) {
            case 'fightResults':
                return this.createFightResultEmbed(notification.data, userPrefs);
            case 'oddsChanges':
                return this.createOddsChangeEmbed(notification.data, userPrefs);
            case 'favoritesFights':
                return this.createFavoriteFightEmbed(notification.data, userPrefs);
            case 'eventReminders':
                return this.createEventReminderEmbed(notification.data, userPrefs);
            case 'breakingNews':
                return this.createBreakingNewsEmbed(notification.data, userPrefs);
            default:
                return this.createGenericEmbed(notification.data);
        }
    }

    // Fight result notification
    createFightResultEmbed(data, userPrefs) {
        const { fight, result, event } = data;
        
        return new EmbedBuilder()
            .setColor(result.winner === fight.redCorner.name ? '#ff0000' : '#0000ff')
            .setTitle('🥊 Fight Result Update')
            .setDescription(`**${event.title}**`)
            .addFields(
                {
                    name: '🏆 Winner',
                    value: `**${result.winner}** defeats ${result.loser}`,
                    inline: false
                },
                {
                    name: '📊 Method',
                    value: `${result.method} in Round ${result.round}`,
                    inline: true
                },
                {
                    name: '⏱️ Time',
                    value: result.time || 'N/A',
                    inline: true
                }
            )
            .setFooter({ text: 'FightBot Premium • Fight Results' })
            .setTimestamp();
    }

    // Odds change notification
    createOddsChangeEmbed(data, userPrefs) {
        const { fight, oldOdds, newOdds, movement } = data;
        
        return new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('💰 Significant Odds Movement')
            .setDescription(`**${fight.redCorner.name} vs ${fight.blueCorner.name}**`)
            .addFields(
                {
                    name: '📈 Odds Movement',
                    value: `${movement.direction === 'up' ? '⬆️' : '⬇️'} ${movement.percentage.toFixed(1)}% change`,
                    inline: false
                },
                {
                    name: '🔴 ' + fight.redCorner.name,
                    value: `${this.formatOdds(oldOdds.red, userPrefs)} → ${this.formatOdds(newOdds.red, userPrefs)}`,
                    inline: true
                },
                {
                    name: '🔵 ' + fight.blueCorner.name,
                    value: `${this.formatOdds(oldOdds.blue, userPrefs)} → ${this.formatOdds(newOdds.blue, userPrefs)}`,
                    inline: true
                }
            )
            .setFooter({ text: 'FightBot Premium • Odds Tracking' })
            .setTimestamp();
    }

    // Favorite fighter notification
    createFavoriteFightEmbed(data, userPrefs) {
        const { fighter, fight, event } = data;
        
        return new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('⭐ Your Favorite Fighter is Fighting!')
            .setDescription(`**${fighter}** has an upcoming fight`)
            .addFields(
                {
                    name: '🥊 Fight',
                    value: `${fight.redCorner.name} vs ${fight.blueCorner.name}`,
                    inline: false
                },
                {
                    name: '📅 Event',
                    value: `**${event.title}**\n${event.date}`,
                    inline: true
                },
                {
                    name: '📍 Venue',
                    value: event.venue || 'TBA',
                    inline: true
                }
            )
            .setFooter({ text: 'FightBot Premium • Favorite Fighter Alert' })
            .setTimestamp();
    }

    // Event reminder notification
    createEventReminderEmbed(data, userPrefs) {
        const { event, timeUntil } = data;
        
        return new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('📅 Event Reminder')
            .setDescription(`**${event.title}** starts ${timeUntil}!`)
            .addFields(
                {
                    name: '🕒 Start Time',
                    value: this.formatTimeForUser(event.date, userPrefs),
                    inline: true
                },
                {
                    name: '📍 Venue',
                    value: event.venue || 'TBA',
                    inline: true
                },
                {
                    name: '🥊 Main Event',
                    value: event.mainEvent || 'TBA',
                    inline: false
                }
            )
            .setFooter({ text: 'FightBot Premium • Event Reminders' })
            .setTimestamp();
    }

    // Breaking news notification
    createBreakingNewsEmbed(data, userPrefs) {
        const { title, content, source, urgency } = data;
        
        const urgencyColors = {
            low: '#00ff00',
            medium: '#ffa500',
            high: '#ff0000'
        };
        
        return new EmbedBuilder()
            .setColor(urgencyColors[urgency] || '#ffa500')
            .setTitle('🚨 Breaking MMA News')
            .setDescription(`**${title}**`)
            .addFields(
                {
                    name: '📰 Details',
                    value: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
                    inline: false
                },
                {
                    name: '📡 Source',
                    value: source || 'FightBot News',
                    inline: true
                },
                {
                    name: '⚠️ Urgency',
                    value: urgency.charAt(0).toUpperCase() + urgency.slice(1),
                    inline: true
                }
            )
            .setFooter({ text: 'FightBot Premium • Breaking News' })
            .setTimestamp();
    }

    // Generic notification embed
    createGenericEmbed(data) {
        return new EmbedBuilder()
            .setColor('#9932cc')
            .setTitle('🔔 FightBot Notification')
            .setDescription(data.message || 'You have a new notification from FightBot')
            .setFooter({ text: 'FightBot Premium' })
            .setTimestamp();
    }

    // Utility functions
    generateNotificationId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getNotificationPriority(type) {
        const priorities = {
            breakingNews: 10,
            fightResults: 8,
            favoritesFights: 6,
            oddsChanges: 4,
            eventReminders: 2
        };
        return priorities[type] || 1;
    }

    formatOdds(odds, userPrefs) {
        const format = userPrefs.betting.oddsFormat;
        
        switch (format) {
            case 'decimal':
                return (odds / 100 + 1).toFixed(2);
            case 'fractional':
                return this.toFractional(odds);
            default: // american
                return odds > 0 ? `+${odds}` : `${odds}`;
        }
    }

    toFractional(americanOdds) {
        if (americanOdds > 0) {
            return `${americanOdds}/100`;
        } else {
            return `100/${Math.abs(americanOdds)}`;
        }
    }

    formatTimeForUser(dateString, userPrefs) {
        const date = new Date(dateString);
        const timezone = userPrefs.display.timezone || 'UTC';
        const timeFormat = userPrefs.display.timeFormat || '12h';
        
        const options = {
            timeZone: timezone,
            hour12: timeFormat === '12h',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        };
        
        return date.toLocaleString('en-US', options);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public methods for external use
    notifyFightResult(fight, result, event) {
        this.queueNotification('fightResults', { fight, result, event });
    }

    notifyOddsChange(fight, oldOdds, newOdds, movement) {
        this.queueNotification('oddsChanges', { fight, oldOdds, newOdds, movement });
    }

    notifyFavoriteFighter(fighter, fight, event) {
        const targetUsers = this.userPrefs.getUsersWithFavoriteFighter(fighter);
        this.queueNotification('favoritesFights', { fighter, fight, event }, targetUsers);
    }

    notifyEventReminder(event, timeUntil) {
        this.queueNotification('eventReminders', { event, timeUntil });
    }

    notifyBreakingNews(title, content, source, urgency = 'medium') {
        this.queueNotification('breakingNews', { title, content, source, urgency });
    }
}

export default NotificationService;
