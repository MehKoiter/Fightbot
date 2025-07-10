---
name: 🐛 UFC.com Search Issues - Multiple Problems Identified
about: Report and track multiple UFC.com search and scraping issues
title: 'UFC.com Search Issues - Invalid URLs, Timeouts, and Profile Parsing Errors'
labels: bug, ufc-scraping, performance
assignees: ''
---

## 🔍 Problem Summary

Several critical issues identified in UFC.com fighter search functionality affecting autocomplete and profile fetching:

1. **Invalid Profile URLs**: Malformed URLs being generated for fighter profiles
2. **Search Timeout Issues**: UFC.com searches timing out frequently 
3. **Profile Scraping Errors**: "Search results" being returned instead of fighter names
4. **URL Encoding Problems**: Spaces in fighter names not properly handled

## 📊 Error Evidence

```
🔍 Fetching UFC fighter profile: https://www.ufc.com/athlete/alex volk
⚠️ UFC.com search timed out, using fallback suggestions
✅ Successfully scraped profile for: Search results
```

## 🔧 Technical Details

### Key Issues Identified

#### 1. Invalid Profile URL Formation
- **Issue**: URL contains unencoded spaces: `https://www.ufc.com/athlete/alex volk`
- **Expected**: `https://www.ufc.com/athlete/alex-volk` or proper URL encoding
- **Impact**: Causes 404 errors or malformed requests to UFC.com

#### 2. Search Timeout Pattern
- **Issue**: Frequent timeouts on UFC.com searches (1-second timeout too aggressive)
- **Pattern**: `⚠️ UFC.com search timed out, using fallback suggestions`
- **Impact**: Reduces autocomplete effectiveness, forces fallback to static list

#### 3. Profile Parsing Issues  
- **Issue**: Scraper returning "Search results" instead of actual fighter names
- **Pattern**: `✅ Successfully scraped profile for: Search results`
- **Impact**: Invalid fighter data being cached and returned to users

### Affected Files
- `services/ufcStatsFighterService.js` - Lines 640-700 (lightweightSearchFighter method)
- `services/ufcStatsFighterService.js` - Lines 200-250 (getFighterProfile method)

### Root Causes

#### URL Formation Bug
```javascript
// PROBLEM: Direct concatenation without proper encoding
const profileUrl = fighterUrl.startsWith('http') ? fighterUrl : `${this.baseUrl}/athlete/${fighterUrl}`;
// ISSUE: fighterUrl might be "alex volk" instead of "alex-volk"
```

#### Timeout Configuration
```javascript
// Current timeout is too aggressive for UFC.com
const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Search timeout')), 1000) // Too short
);
```

## 🎯 Proposed Solutions

### 1. Fix URL Encoding
```javascript
// Proper URL formation with encoding
const profileUrl = fighterUrl.startsWith('http') 
    ? fighterUrl 
    : `${this.baseUrl}/athlete/${encodeURIComponent(fighterUrl.replace(/\\s+/g, '-'))}`;
```

### 2. Adjust Timeout Strategy
```javascript
// More realistic timeouts for UFC.com
const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Search timeout')), 2000) // Increased to 2 seconds
);
```

### 3. Enhanced Profile URL Validation
```javascript
// Validate and clean profile URLs before fetching
const cleanProfileUrl = (url) => {
    if (!url) return null;
    
    // Extract fighter slug and rebuild URL properly
    const match = url.match(/\\/athlete\\/([^\\/?]+)/);
    if (match) {
        const fighterSlug = match[1].replace(/\\s+/g, '-').toLowerCase();
        return `${this.baseUrl}/athlete/${fighterSlug}`;
    }
    
    return url;
};
```

### 4. Better Error Handling
```javascript
// Enhanced parsing with validation
const name = $('.hero-profile__name').text().trim() || 
             $('.c-hero__headline-suffix').text().trim() ||
             $('h1').first().text().trim();

// Validate that we got a real name, not page artifacts
if (!name || name === 'Search results' || name.length < 2) {
    console.log('❌ Invalid fighter name extracted, skipping profile');
    return null;
}
```

## 🧪 Test Cases Needed

### URL Formation Tests
- [ ] Test fighter names with spaces: "Alex Volkanovski"
- [ ] Test special characters: "Sean O'Malley"  
- [ ] Test hyphenated names: "Jean-Claude Van Damme"

### Timeout Handling Tests
- [ ] Simulate slow UFC.com responses
- [ ] Test fallback mechanism activation
- [ ] Verify autocomplete still works under load

### Profile Parsing Tests
- [ ] Test various UFC.com page structures
- [ ] Validate name extraction accuracy
- [ ] Test error handling for malformed pages

## 🚨 Impact Assessment

### User Experience Impact
- **High**: Autocomplete failures for specific fighters (Alex Volkanovski, etc.)
- **Medium**: Occasional timeout-related slowdowns
- **Low**: Cache pollution with invalid "Search results" data

### Performance Impact
- **Network**: Increased failed requests to UFC.com
- **Cache**: Invalid data being cached, reducing efficiency
- **Response Time**: Timeouts causing 1-2 second delays

## 📋 Action Items

### Immediate (v1.8.3)
- [ ] Fix URL encoding for profile requests
- [ ] Increase autocomplete search timeout to 2 seconds
- [ ] Add validation for extracted fighter names
- [ ] Implement profile URL cleaning function

### Short Term (v1.8.4)
- [ ] Add comprehensive URL formation tests
- [ ] Implement retry mechanism for failed UFC.com requests
- [ ] Add metrics for success/failure rates
- [ ] Create UFC.com scraping health check

### Long Term (v1.9.0)
- [ ] Consider alternative UFC data sources for redundancy
- [ ] Implement more sophisticated caching strategy
- [ ] Add monitoring for UFC.com structural changes
- [ ] Create automated scraping validation tests

## 🔍 Steps to Reproduce

1. Start bot in development mode with debug logging
2. Use `/fighter` command with autocomplete
3. Type "alex volk" slowly to trigger multiple autocomplete requests
4. Observe logs for timeout messages and invalid URLs
5. Check for "Search results" being cached as fighter names

## 🌐 Environment

- **Bot Version**: v1.8.2
- **Node.js**: 18+
- **Target**: UFC.com athlete search and profile pages
- **Impact**: Production autocomplete functionality

## 📎 Additional Context

- **Related Documentation**: `docs/issues/GITHUB-ISSUE-UFC-SEARCH-PROBLEMS.md`
- **Expected Outcome**: Reliable UFC.com scraping with proper URL formation, realistic timeouts, and robust error handling
- **Current Workaround**: Fallback system partially mitigates issues, but user experience is degraded for affected fighters

## 🏷️ Labels
`bug` `ufc-scraping` `performance` `v1.8.3`
