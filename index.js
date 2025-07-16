// FightBot - Discord UFC Bot
// Enhanced with improved error handling, performance monitoring, and code organization

import { Client, Collection, GatewayIntentBits } from "discord.js";
import { token, config, validateConfig } from "./config.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "http";
import os from "os";
import NotificationService from "./services/notificationService.js";
import UserDatabaseService from "./services/userDatabaseService.js";
import { VERSION_CONFIG } from "./config/version.js";
import { errorHandler } from "./utils/errorHandler.js";
import { performanceMonitor } from "./utils/performanceMonitor.js";
import { memoryManager } from "./utils/memoryManager.js";

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate configuration before starting
if (!validateConfig()) {
  console.error("❌ Configuration validation failed. Exiting...");
  process.exit(1);
}

// Create Discord client with optimized intents and options
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessageTyping,
  ],
  // Optimized client options for better performance
  presence: {
    status: "online",
    activities: [
      {
        name: "UFC fights | /fight",
        type: 0, // Playing
      },
    ],
  },
  // Discord.js optimization options
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: false,
  },
  partials: [], // Only enable partials if needed
  restRequestTimeout: config.api.timeout,
  restSweepInterval: 60, // Sweep REST cache every 60 seconds
  restGlobalRateLimit: 50, // Global rate limit (requests per second)
  retryLimit: config.api.retryAttempts,
});

// Initialize services
client.commands = new Collection();
let notificationService;
let userDB;

// Enhanced performance monitoring
const performanceMetrics = {
  startTime: Date.now(),
  commandsLoaded: 0,
  eventsLoaded: 0,
  errors: 0,
  totalMemoryAllocated: 0,
  peakMemoryUsage: 0,
};

/**
 * Enhanced memory monitoring
 */
function updateMemoryMetrics() {
  const memUsage = process.memoryUsage();
  performanceMetrics.totalMemoryAllocated = memUsage.heapUsed;
  if (memUsage.heapUsed > performanceMetrics.peakMemoryUsage) {
    performanceMetrics.peakMemoryUsage = memUsage.heapUsed;
  }
}

/**
 * Dynamically loads command files from the commands directory with improved error handling
 */
async function loadCommands() {
  const commandsPath = path.join(__dirname, "commands");

  try {
    // Ensure commands directory exists
    await fs.promises.access(commandsPath);

    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));

    console.log(`📂 Loading ${commandFiles.length} command files...`);

    // Load commands with Promise.allSettled for better error handling
    const loadPromises = commandFiles.map(async (file) => {
      try {
        const command = (await import(`./commands/${file}`)).default;

        if (command?.data?.name) {
          client.commands.set(command.data.name, command);
          performanceMetrics.commandsLoaded++;
          return { status: "fulfilled", file, command: command.data.name };
        } else {
          throw new Error("Missing required data or name property");
        }
      } catch (error) {
        performanceMetrics.errors++;
        return { status: "rejected", file, error: error.message };
      }
    });

    const results = await Promise.allSettled(loadPromises);

    // Process results
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { file, command } = result.value;
        console.log(`✅ Loaded command: ${command} (${file})`);
      } else {
        const { file, error } = result.value;
        console.error(`❌ Failed to load command ${file}: ${error}`);
      }
    });

    console.log(
      `✅ Commands loaded: ${performanceMetrics.commandsLoaded}/${commandFiles.length}`
    );
  } catch (error) {
    console.error("❌ Failed to access commands directory:", error.message);
    throw new Error(`Commands directory not accessible: ${error.message}`);
  }
}

/**
 * Dynamically loads event files from the events directory with improved error handling
 */
async function loadEvents() {
  const eventsPath = path.join(__dirname, "events");

  try {
    // Ensure events directory exists
    await fs.promises.access(eventsPath);

    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter((file) => file.endsWith(".js"));

    console.log(`📂 Loading ${eventFiles.length} event files...`);

    // Load events with Promise.allSettled for better error handling
    const loadPromises = eventFiles.map(async (file) => {
      try {
        const discordEvent = (await import(`./events/${file}`)).default;

        if (discordEvent?.name) {
          if (discordEvent.once) {
            client.once(discordEvent.name, (...args) =>
              discordEvent.execute(...args)
            );
          } else {
            client.on(discordEvent.name, (...args) =>
              discordEvent.execute(...args)
            );
          }
          performanceMetrics.eventsLoaded++;
          return { status: "fulfilled", file, event: discordEvent.name };
        } else {
          throw new Error("Missing required name property");
        }
      } catch (error) {
        performanceMetrics.errors++;
        return { status: "rejected", file, error: error.message };
      }
    });

    const results = await Promise.allSettled(loadPromises);

    // Process results
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { file, event } = result.value;
        console.log(`✅ Loaded event: ${event} (${file})`);
      } else {
        const { file, error } = result.value;
        console.error(`❌ Failed to load event ${file}: ${error}`);
      }
    });

    console.log(
      `✅ Events loaded: ${performanceMetrics.eventsLoaded}/${eventFiles.length}`
    );
  } catch (error) {
    console.error("❌ Failed to access events directory:", error.message);
    throw new Error(`Events directory not accessible: ${error.message}`);
  }
}

/**
 * Initialize the Discord bot with comprehensive error handling and monitoring
 */
async function initialize() {
  const initStartTime = Date.now();

  console.log(
    `🤖 Starting FightBot ${VERSION_CONFIG.version} (All Features FREE!)...`
  );
  console.log(`🔧 Environment: ${config.environment}`);
  console.log(`🚀 Node.js: ${process.version}`);

  try {
    // Initialize user database with enhanced error handling
    console.log("📊 Initializing user database...");
    console.log("Environment details:", {
      NODE_ENV: process.env.NODE_ENV,
      platform: process.platform,
      cwd: process.cwd(),
      homedir: os.homedir(),
    });

    try {
      userDB = new UserDatabaseService();
      console.log("✅ UserDatabaseService instance created");
    } catch (constructorError) {
      console.error(
        "❌ Failed to create UserDatabaseService instance:",
        constructorError.message
      );
      throw new Error(
        `UserDatabaseService constructor failed: ${constructorError.message}`
      );
    }

    try {
      const dbInitialized = await userDB.initialize();

      if (!dbInitialized) {
        console.warn(
          "⚠️ Database initialization returned false, using fallback service"
        );
        throw new Error("Database initialization returned false");
      }

      // Make userDB available to the client
      client.userDB = userDB;
      console.log("✅ User database initialized successfully");
    } catch (dbError) {
      console.error("❌ Database initialization failed:", dbError.message);
      console.error("Environment info:", {
        NODE_ENV: process.env.NODE_ENV,
        platform: process.platform,
        cwd: process.cwd(),
      });

      // Create a mock database service for graceful degradation
      console.log(
        "⚠️ Creating fallback database service due to:",
        dbError.message
      );
      client.userDB = {
        logCommandUsage: async () =>
          console.log("📊 Database unavailable - command usage not logged"),
        getCommandStats: async () => ({
          totalCommands: 0,
          commandBreakdown: [],
        }),
        hasActiveSubscription: async () => true,
        isPremiumUser: async () => true,
        close: () => {},
      };
      console.log(
        "✅ Fallback database service created - bot will continue with limited analytics"
      );

      // Don't re-throw the error here - the bot should continue with fallback service
    }

    // Load commands and events
    await loadCommands();
    await loadEvents();

    // Validate that we have at least one command
    if (client.commands.size === 0) {
      console.warn(
        "⚠️ No commands loaded - bot will have limited functionality"
      );
    }

    // Login to Discord
    console.log("🔐 Logging in to Discord...");
    await client.login(token);

    // Initialize notification service after successful login
    notificationService = new NotificationService(client);
    client.notifications = notificationService;
    console.log("✅ Notification service initialized");

    // Calculate initialization time
    const initTime = Date.now() - initStartTime;
    performanceMetrics.initializationTime = initTime;

    console.log(
      `✅ FightBot initialized successfully in ${initTime}ms! All features are FREE! 🎉`
    );
    console.log(
      `📊 Stats: ${performanceMetrics.commandsLoaded} commands, ${performanceMetrics.eventsLoaded} events, ${performanceMetrics.errors} errors`
    );

    // Start background services
    startBackgroundServices();
  } catch (error) {
    console.error("❌ Failed to initialize FightBot:", error.message);
    console.error("Full error object:", error);
    console.error("Stack trace:", error.stack);

    // Log additional context for debugging
    console.error("Error occurred during initialization phase");
    console.error("Performance metrics at failure:", performanceMetrics);

    // Attempt graceful shutdown
    try {
      if (client.isReady()) {
        await client.destroy();
      }
    } catch (shutdownError) {
      console.error("❌ Error during shutdown:", shutdownError.message);
    }

    process.exit(1);
  }
}

// Error handling for uncaught exceptions
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});

/**
 * Start background services and tasks
 */
function startBackgroundServices() {
  console.log("🌟 Starting background services...");

  // Check for event reminders every hour
  setInterval(checkEventReminders, 60 * 60 * 1000);

  // Check for odds changes every 15 minutes (if odds service is available)
  setInterval(checkOddsChanges, 15 * 60 * 1000);

  console.log("✅ Background services started");
}

/**
 * Check for upcoming events and send reminders
 */
async function checkEventReminders() {
  try {
    // This would check for events starting soon and send reminders
    console.log("📅 Checking for event reminders...");
    // Implementation would go here
  } catch (error) {
    console.error("Error checking event reminders:", error);
  }
}

/**
 * Check for significant odds changes
 */
async function checkOddsChanges() {
  try {
    // This would monitor odds changes and notify users
    console.log("💰 Checking for odds changes...");
    // Implementation would go here
  } catch (error) {
    console.error("Error checking odds changes:", error);
  }
}

// Start the bot
initialize();

/**
 * Create a simple HTTP server for Render port binding
 *
 * DEPLOYMENT FIX: This server solves the "Port scan timeout" error on Render.com
 *
 * Background:
 * - Render Web Services require binding to at least one port
 * - Discord bots don't naturally bind to ports (they use WebSocket connections)
 * - Without port binding, Render deployment fails with timeout error
 *
 * Solution:
 * - Creates lightweight HTTP server alongside Discord bot
 * - Binds to process.env.PORT (required by Render) or defaults to 3000
 * - Provides health check endpoints for monitoring
 * - Doesn't interfere with Discord bot functionality
 *
 * Endpoints:
 * - GET / - Basic health check
 * - GET /health - Detailed status (bot info, uptime, version)
 *
 * This approach allows deployment as "Web Service" on Render's free tier
 * Alternative would be "Background Worker" but requires paid plan
 */
function createHealthServer() {
  const server = http.createServer((req, res) => {
    // Handle health check endpoint
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "healthy",
          bot: client.user ? client.user.tag : "Not logged in",
          uptime: process.uptime(),
          version: VERSION_CONFIG.version,
          timestamp: new Date().toISOString(),
        })
      );
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`🌐 Health server running on port ${port}`);
    console.log(
      `📊 Health check available at: http://localhost:${port}/health`
    );
  });

  return server;
}

// Start the health server for Render
createHealthServer();
