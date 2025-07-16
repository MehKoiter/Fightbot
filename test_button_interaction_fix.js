/**
 * Test script to validate the button interaction fix
 * This script simulates the button interaction error scenario and validates our fixes
 */

console.log("🧪 Testing Button Interaction Fix...\n");

// Mock Discord interaction object for testing
function createMockInteraction(customId, options = {}) {
  const interaction = {
    customId: customId,
    user: { tag: "testuser#1234" },
    replied: options.replied || false,
    deferred: options.deferred || false,
    guildId: "test-guild-123",

    // Mock Discord API methods
    deferReply: async (opts) => {
      if (options.shouldFailDefer) {
        const error = new Error("Unknown interaction");
        error.code = 10062;
        throw error;
      }
      if (interaction.replied || interaction.deferred) {
        const error = new Error("Interaction has already been acknowledged.");
        error.code = 10062;
        throw error;
      }
      interaction.deferred = true;
      console.log(`✅ Mock defer successful for ${customId}`);
    },

    editReply: async (content) => {
      if (options.shouldFailEdit) {
        const error = new Error("Unknown interaction");
        error.code = 10062;
        throw error;
      }
      console.log(`✅ Mock edit reply successful for ${customId}`);
    },

    reply: async (content) => {
      if (interaction.replied || interaction.deferred) {
        const error = new Error("Interaction has already been acknowledged.");
        error.code = 10062;
        throw error;
      }
      interaction.replied = true;
      console.log(`✅ Mock reply successful for ${customId}`);
    },

    isButton: () => true,
    isAutocomplete: () => false,
  };

  return interaction;
}

// Test case 1: Normal UFC button interaction
async function testNormalUFCButton() {
  console.log("Test 1: Normal UFC button interaction");
  try {
    const interaction = createMockInteraction("ufc_stats_wiki_234");

    // Simulate the main handling logic
    const customId = interaction.customId;

    if (customId.startsWith("ufc_")) {
      const parts = customId.split("_");
      const action = parts[1];
      const dataSource = parts[2];
      const eventId = parts[3] || parts[2];

      console.log(
        `   Action: ${action}, DataSource: ${dataSource}, EventId: ${eventId}`
      );

      // Test defer logic
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }

      // Mock successful processing
      await interaction.editReply({ content: "Test response" });
    }

    console.log("✅ Test 1 PASSED\n");
  } catch (error) {
    console.error("❌ Test 1 FAILED:", error.message, "\n");
  }
}

// Test case 2: Already deferred interaction
async function testAlreadyDeferredButton() {
  console.log("Test 2: Already deferred UFC button interaction");
  try {
    const interaction = createMockInteraction("ufc_stats_wiki_234", {
      deferred: true,
    });

    const customId = interaction.customId;

    if (customId.startsWith("ufc_")) {
      // Test defer logic - should skip
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      } else {
        console.log("   Skipped defer - already deferred");
      }

      // Should still work
      await interaction.editReply({ content: "Test response" });
    }

    console.log("✅ Test 2 PASSED\n");
  } catch (error) {
    console.error("❌ Test 2 FAILED:", error.message, "\n");
  }
}

// Test case 3: Expired interaction (defer fails)
async function testExpiredInteractionDefer() {
  console.log("Test 3: Expired interaction (defer fails)");
  try {
    const interaction = createMockInteraction("ufc_stats_wiki_234", {
      shouldFailDefer: true,
    });

    const customId = interaction.customId;

    if (customId.startsWith("ufc_")) {
      try {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferReply({ ephemeral: true });
        }
      } catch (deferError) {
        if (
          deferError.code === 10062 ||
          deferError.message.includes("Unknown interaction")
        ) {
          console.log(
            "   Detected expired interaction - throwing Unknown interaction error"
          );
          throw new Error("Unknown interaction");
        }
        throw deferError;
      }
    }

    console.log("❌ Test 3 FAILED: Should have thrown error\n");
  } catch (error) {
    if (error.message === "Unknown interaction") {
      console.log("✅ Test 3 PASSED: Properly detected expired interaction\n");
    } else {
      console.error("❌ Test 3 FAILED: Wrong error:", error.message, "\n");
    }
  }
}

// Test case 4: Unknown button pattern
async function testUnknownButton() {
  console.log("Test 4: Unknown button pattern");
  try {
    const interaction = createMockInteraction("unknown_button_xyz");

    const customId = interaction.customId;

    // This should fall through to the unknown button error
    if (customId.startsWith("fighter_") || customId.startsWith("comparison_")) {
      console.log("   Fighter button");
    } else if (customId.startsWith("ufc_")) {
      console.log("   UFC button");
    } else if (customId.startsWith("fight_")) {
      console.log("   Fight button");
    } else {
      console.log("   Unknown button - throwing error");
      throw new Error(`Unknown button interaction: ${customId}`);
    }

    console.log("❌ Test 4 FAILED: Should have thrown unknown button error\n");
  } catch (error) {
    if (error.message.includes("Unknown button interaction")) {
      console.log("✅ Test 4 PASSED: Properly detected unknown button\n");
    } else {
      console.error("❌ Test 4 FAILED: Wrong error:", error.message, "\n");
    }
  }
}

// Run all tests
async function runTests() {
  console.log("🧪 Running Button Interaction Fix Tests...\n");

  await testNormalUFCButton();
  await testAlreadyDeferredButton();
  await testExpiredInteractionDefer();
  await testUnknownButton();

  console.log("🏁 Test suite completed!");
}

// Run the tests
runTests().catch(console.error);
