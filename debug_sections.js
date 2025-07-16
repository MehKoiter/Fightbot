import WikipediaUFCService from "./services/wikipediaUFCService.js";
import axios from "axios";

async function debugSectionParsing() {
  console.log("Debugging section parsing for UFC 222...");

  try {
    // Get sections first
    const sectionsResponse = await axios.get(
      "https://en.wikipedia.org/w/api.php",
      {
        params: {
          action: "parse",
          format: "json",
          page: "UFC 222",
          prop: "sections",
        },
        timeout: 10000,
      }
    );

    if (sectionsResponse.data.parse && sectionsResponse.data.parse.sections) {
      console.log("Available sections:");
      sectionsResponse.data.parse.sections.forEach((section) => {
        console.log(`  ${section.index}: "${section.line}"`);
      });

      // Filter sections like the code does
      const sections = sectionsResponse.data.parse.sections;
      const fightCardSections = sections.filter((section) => {
        const title = section.line.toLowerCase();
        return (
          title.includes("fight") ||
          title.includes("card") ||
          title.includes("results") ||
          title.includes("bout")
        );
      });

      console.log("\nFiltered fight card sections:");
      fightCardSections.forEach((section) => {
        console.log(`  ${section.index}: "${section.line}"`);
      });

      if (fightCardSections.length > 0) {
        // Test parsing the Results section
        const section = fightCardSections[0];
        console.log(
          `\nTesting parsing section ${section.index}: "${section.line}"`
        );

        const sectionResponse = await axios.get(
          "https://en.wikipedia.org/w/api.php",
          {
            params: {
              action: "parse",
              format: "json",
              page: "UFC 222",
              prop: "text",
              section: section.index,
            },
            timeout: 10000,
          }
        );

        if (sectionResponse.data.parse) {
          const html = sectionResponse.data.parse.text["*"];

          const wikiService = new WikipediaUFCService();
          const fights = wikiService.parseFightCardHTML(html);
          console.log(`Parsed ${fights.length} fights from section`);

          if (fights.length > 0) {
            fights.slice(0, 3).forEach((fight, i) => {
              console.log(
                `${i + 1}: ${fight.fighters[0]?.name} def. ${
                  fight.fighters[1]?.name
                }`
              );
            });
          }
        }
      }
    }
  } catch (error) {
    console.log("Error:", error.message);
  }
}

debugSectionParsing();
