import axios from "axios";
import * as cheerio from "cheerio";

async function debugUFC222() {
  console.log("Examining UFC 222 Results section content...");

  try {
    // Get the results section specifically (section 2)
    const sectionResponse = await axios.get(
      "https://en.wikipedia.org/w/api.php",
      {
        params: {
          action: "parse",
          format: "json",
          page: "UFC 222",
          prop: "text",
          section: "2",
        },
        timeout: 10000,
      }
    );

    if (sectionResponse.data.parse) {
      const html = sectionResponse.data.parse.text["*"];
      const $ = cheerio.load(html);

      console.log("Looking for tables...");

      // Look for all table content
      $("table").each((i, table) => {
        const $table = $(table);
        console.log(`\nTable ${i}:`);

        // Get headers
        const headers = $table
          .find("th")
          .map((j, th) => $(th).text().trim())
          .get();
        if (headers.length > 0) {
          console.log("Headers:", headers.join(" | "));
        }

        // Show first few data rows
        $table.find("tr").each((rowIndex, row) => {
          const $row = $(row);
          const cells = $row
            .find("td")
            .map((j, cell) => $(cell).text().trim())
            .get();
          if (cells.length > 0) {
            console.log(`Row ${rowIndex}:`, cells.join(" | "));

            // Look for fighter names in the first few cells
            if (rowIndex < 5) {
              cells.forEach((cell) => {
                if (cell.includes("def.") || cell.includes("defeated")) {
                  console.log("  → Found fight result:", cell);
                }
              });
            }
          }
        });

        console.log("---");
      });

      // Also look for text patterns
      console.log('\nLooking for "def." patterns in text:');
      const defMatches = html.match(/[A-Za-z\s]+ def\. [A-Za-z\s]+/g);
      if (defMatches) {
        defMatches.slice(0, 5).forEach((match) => {
          console.log("  Found:", match.trim());
        });
      }
    }
  } catch (error) {
    console.log("Error:", error.message);
  }
}

debugUFC222();
