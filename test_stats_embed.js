import WikipediaUFCService from "./services/wikipediaUFCService.js";
import SportsDataMMAService from "./services/sportsDataMMAService.js";

async function testUFCStatsEmbed() {
  console.log("Testing createUFCStatsEmbed logic for UFC 222...");

  const sportsDataService = new SportsDataMMAService();
  const wikipediaService = new WikipediaUFCService();

  let eventDetails = null;
  let actualDataSource = "Unknown";
  const eventId = "222";

  // Try SportsData first (will fail for old events)
  try {
    eventDetails = await sportsDataService.getUFCEventByNumber(eventId);
    if (eventDetails) {
      actualDataSource = "SportsData.io";
    }
  } catch (error) {
    console.log("SportsData.io failed, trying Wikipedia...");
  }

  // Try Wikipedia
  if (!eventDetails) {
    try {
      eventDetails = await wikipediaService.getUFCEventByNumber(eventId);
      if (eventDetails) {
        actualDataSource = "Wikipedia";
      }
    } catch (error) {
      console.log("Wikipedia failed for UFC 222");
    }
  }

  if (!eventDetails) {
    console.log("No event details found");
    return;
  }

  const fights = eventDetails.fights || eventDetails.Fights || [];

  console.log(`Data source: ${actualDataSource}`);
  console.log(
    `Event: ${eventDetails.title || eventDetails.Name || "UFC " + eventId}`
  );
  console.log(`Total Fights: ${fights.length}`);
  console.log(
    `Date: ${
      eventDetails.dateTime || eventDetails.DateTime || eventDetails.date
    }`
  );
  console.log(`Venue: ${eventDetails.venue || eventDetails.location}`);

  if (fights.length > 0) {
    console.log("\nFirst 3 fights:");
    fights.slice(0, 3).forEach((fight, i) => {
      const name1 =
        fight.fighters?.[0]?.name || fight.Fighter1?.Name || "Unknown";
      const name2 =
        fight.fighters?.[1]?.name || fight.Fighter2?.Name || "Unknown";
      const weightClass = fight.weightClass || fight.WeightClass || "Unknown";
      console.log(`${i + 1}. ${name1} vs ${name2} (${weightClass})`);
    });
  }
}

testUFCStatsEmbed();
