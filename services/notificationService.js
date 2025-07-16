/**
 * Notification Service - Free Version
 * Simple notification system for Discord bot
 */

class NotificationService {
  constructor() {
    this.client = null;
  }

  setClient(client) {
    this.client = client;
  }

  async initialize() {
    console.log("📢 Notification service initialized (free version)");
    return Promise.resolve();
  }

  // For free version, we don't send notifications but keep the interface
  async sendNotification(userId, message) {
    console.log(`📢 Would send notification to ${userId}: ${message}`);
    return Promise.resolve();
  }

  async scheduleNotification(userId, message, scheduledTime) {
    console.log(
      `📅 Would schedule notification for ${userId} at ${scheduledTime}: ${message}`
    );
    return Promise.resolve();
  }

  // Placeholder methods for compatibility
  async getUserNotificationPreferences(userId) {
    return {
      enabled: true,
      fightResults: true,
      upcomingEvents: true,
      favoriteFighters: true,
    };
  }

  async updateUserNotificationPreferences(userId, preferences) {
    console.log(`⚙️ Updated notification preferences for ${userId}`);
    return Promise.resolve();
  }
}

export default NotificationService;
