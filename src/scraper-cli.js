#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

const { scrapeReddit } = require('./scrapers/reddit');
const { scrapeGitHub } = require('./scrapers/github');
const { scrapeTwitter, filterTweets } = require('./scrapers/twitter');
const { 
  initStorage, 
  loadFeed, 
  loadSeen, 
  saveFeed, 
  saveSeen,
  filterNewItems 
} = require('./storage');

/**
 * CLI scraper that runs once and outputs to public/data/feed.json
 * Used by GitHub Actions
 */
async function main() {
  try {
    console.log('[CLI] Starting feed scrape...');
    await initStorage();

    const feed = await loadFeed();
    const seenData = await loadSeen();
    
    // Convert seen data to Set for efficient lookups
    const seen = new Set(seenData.ids || []);

    console.log('[CLI] Current feed size:', feed.length);
    console.log('[CLI] Seen items:', seen.size);

    const results = await Promise.allSettled([
      scrapeReddit(),
      scrapeGitHub(),
      scrapeTwitter()
    ]);

    let allItems = [];

    results.forEach((result, index) => {
      const source = ['Reddit', 'GitHub', 'Twitter'][index];
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        console.log(`[CLI] ${source}: fetched ${result.value.length} items`);
        allItems = allItems.concat(result.value);
      } else if (result.status === 'rejected') {
        console.error(`[CLI] ${source}: failed -`, result.reason?.message || result.reason);
      }
    });

    // Filter tweets if we got any
    const twitterItems = allItems.filter(item => item.source === 'twitter');
    if (twitterItems.length > 0) {
      const filteredTwitter = filterTweets(twitterItems);
      const otherItems = allItems.filter(item => item.source !== 'twitter');
      allItems = [...otherItems, ...filteredTwitter];
      console.log(`[CLI] Twitter: filtered to ${filteredTwitter.length} items`);
    }

    const newItems = filterNewItems(allItems, seen);
    console.log(`[CLI] New items to add: ${newItems.length}`);

    if (newItems.length > 0) {
      newItems.forEach(item => seen.add(item.id));
      feed.push(...newItems);
      
      // Sort by timestamp (newest first)
      feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Keep only last 500 items
      const trimmedFeed = feed.slice(0, 500);
      
      await saveFeed(trimmedFeed);
      
      // Convert Set back to array for storage
      await saveSeen({ ids: Array.from(seen), conversations: seenData.conversations || [] });
      
      console.log(`[CLI] Feed updated: ${trimmedFeed.length} total items`);
    } else {
      console.log('[CLI] No new items');
    }

    // Write to docs/data/feed.json for GitHub Pages
    const docsDataDir = path.join(__dirname, '../docs/data');
    await fs.mkdir(docsDataDir, { recursive: true });
    
    const docsFeedPath = path.join(docsDataDir, 'feed.json');
    await fs.writeFile(docsFeedPath, JSON.stringify(feed, null, 2));
    
    console.log('[CLI] Wrote feed to:', docsFeedPath);
    console.log('[CLI] Scrape complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('[CLI] Fatal error:', error);
    process.exit(1);
  }
}

main();
