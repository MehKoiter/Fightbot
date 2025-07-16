import WikipediaUFCService from "./services/wikipediaUFCService.js";

async function testGetFightCard() {
  console.log("Testing getFightCardFromWikipedia directly...");

  const wikiService = new WikipediaUFCService();
  try {
    const fightCard = await wikiService.getFightCardFromWikipedia("UFC 222");
    console.log("Fight card result:", fightCard);
    if (fightCard && fightCard.length > 0) {
      console.log("Found", fightCard.length, "fights");
      fightCard.slice(0, 3).forEach((fight, i) => {
        console.log(
          `${i + 1}: ${fight.fighters[0]?.name} vs ${fight.fighters[1]?.name}`
        );
      });
    } else {
      console.log("No fights found in fight card");
    }
  } catch (error) {
    console.log("Error:", error.message);
  }
}

testGetFightCard();
