/**
 * Fixed lightweightSearchFighter method
 * Uses the correct CSS selectors that match the current UFC.com structure
 */

// Copy this method to replace the existing lightweightSearchFighter method

async lightweightSearchFighter(fighterName) {
    try {
        console.log(`🔍 UFC Stats: Lightweight search for: ${fighterName}`);
        const cacheKey = `ufc_lightweight_${fighterName.toLowerCase()}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`📋 Using cached lightweight search for: ${fighterName}`);
                return cached.data;
            }
        }

        // Search UFC.com for the fighter
        const searchUrl = `${this.baseUrl}/athletes/all?filters%5B0%5D=status%3A23&search=${encodeURIComponent(fighterName)}`;
        
        const response = await axios.get(searchUrl, {
            timeout: 8000, // Reduced timeout for autocomplete
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        if (response.status !== 200) {
            console.log(`❌ UFC search request failed with status: ${response.status}`);
            return [];
        }

        const $ = cheerio.load(response.data);
        const fighters = [];

        // Parse search results - use the SAME selectors as main search method
        $('.c-listing-athlete-flipcard__inner').each((index, element) => {
            try {
                const $fighter = $(element);
                const name = $fighter.find('.c-listing-athlete__name').text().trim();
                const nickname = $fighter.find('.c-listing-athlete__nickname').text().trim();
                const profileLink = $fighter.find('a').attr('href');
                
                if (name && profileLink) {
                    fighters.push({
                        name,
                        nickname: nickname.replace(/"/g, ''),
                        profileUrl: profileLink.startsWith('http') ? profileLink : `${this.baseUrl}${profileLink}`
                    });
                }
            } catch (parseError) {
                console.error('❌ Error parsing fighter element:', parseError.message);
            }
        });

        console.log(`✅ Found ${fighters.length} fighter(s) from UFC.com for "${fighterName}"`);

        // Cache the results
        this.cache.set(cacheKey, {
            data: fighters,
            timestamp: Date.now()
        });

        return fighters;

    } catch (error) {
        console.error('❌ UFC lightweight search error:', error.message);
        return [];
    }
}
