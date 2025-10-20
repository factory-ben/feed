require('dotenv').config();
const express = require('express');
const path = require('path');
const cron = require('node-cron');

const { scrapeReddit } = require('./scrapers/reddit');
const { scrapeGitHub } = require('./scrapers/github');
const { scrapeTwitter, filterTweets } = require('./scrapers/twitter');
const { postBatchToSlack } = require('./slack');
const { 
  initStorage, 
  loadFeed, 
  loadSeen, 
  saveFeed, 
  saveSeen,
  filterNewItems 
} = require('./storage');

const app = express();
const PORT = process.env.PORT || 3000;

let isPolling = false;
let lastManualRefresh = 0;
const MANUAL_REFRESH_THROTTLE_MS = 30000;

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API endpoint to get feed
app.get('/api/feed', async (req, res) => {
  try {
    const feed = await loadFeed();
    res.json(feed);
  } catch (error) {
    console.error('[API] Error serving feed:', error.message);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

// API endpoint for manual refresh
app.post('/api/refresh', async (req, res) => {
  try {
    if (isPolling) {
      return res.status(429).json({ error: 'A poll is already in progress. Please wait.' });
    }

    const now = Date.now();
    if (now - lastManualRefresh < MANUAL_REFRESH_THROTTLE_MS) {
      const waitTime = Math.ceil((MANUAL_REFRESH_THROTTLE_MS - (now - lastManualRefresh)) / 1000);
      return res.status(429).json({ error: `Please wait ${waitTime}s before refreshing again` });
    }

    lastManualRefresh = now;
    await pollFeeds();
    res.json({ success: true, message: 'Feed refreshed' });
  } catch (error) {
    console.error('[API] Error during manual refresh:', error.message);
    res.status(500).json({ error: 'Failed to refresh feed' });
  }
});

app.post('/api/slack/send', async (req, res) => {
  try {
    const { itemIds, channel } = req.body || {};

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds must be a non-empty array' });
    }

    const feed = await loadFeed();
    const idSet = new Set(itemIds);
    const itemsToSend = feed.filter(item => idSet.has(item.id));

    if (itemsToSend.length === 0) {
      return res.status(404).json({ error: 'No matching feed items found' });
    }

    console.log(`[API] Sending ${itemsToSend.length} items to Slack${channel ? ` (channel: ${channel})` : ''}`);
    await postBatchToSlack(itemsToSend, { channel });

    res.json({ success: true, count: itemsToSend.length });
  } catch (error) {
    console.error('[API] Error sending items to Slack:', error.message);
    res.status(500).json({ error: 'Failed to send items to Slack' });
  }
});

/**
 * Main polling function that aggregates all sources
 */
async function pollFeeds() {
  if (isPolling) {
    console.log('[Polling] Poll already in progress, skipping...');
    return;
  }

  isPolling = true;
  console.log('\n[Polling] Starting feed aggregation...');
  const startTime = Date.now();

  try {
    // Load existing data
    const [currentFeed, seenData] = await Promise.all([
      loadFeed(),
      loadSeen()
    ]);

    const seenIds = new Set(seenData.ids);
    const seenConversations = new Set(seenData.conversations);

    // Fetch from all sources in parallel
    const [redditPosts, githubDiscussions, tweets] = await Promise.all([
      scrapeReddit(),
      scrapeGitHub(),
      scrapeTwitter()
    ]);

    // Filter tweets for team members and thread deduplication
    const filteredTweets = filterTweets(tweets, seenConversations);

    // Combine all items
    const allItems = [...redditPosts, ...githubDiscussions, ...filteredTweets];

    // Filter out items we've already seen
    const newItems = filterNewItems(allItems, seenIds);

    console.log(`[Polling] Found ${newItems.length} new items`);

    if (newItems.length > 0) {
      // Update feed
      const updatedFeed = [...currentFeed, ...newItems];
      await saveFeed(updatedFeed);

      // Update seen IDs
      const newIds = newItems.map(item => item.id);
      const newConversations = filteredTweets
        .map(t => t.metadata?.conversation_id)
        .filter(Boolean);
      
      await saveSeen({
        ids: [...seenData.ids, ...newIds],
        conversations: [...seenData.conversations, ...newConversations]
      });

      // Post to Slack
      await postBatchToSlack(newItems);

      console.log(`[Polling] Successfully processed ${newItems.length} new items`);
    } else {
      console.log('[Polling] No new items to process');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Polling] Completed in ${duration}s\n`);

  } catch (error) {
    console.error('[Polling] Error during feed aggregation:', error.message);
  } finally {
    isPolling = false;
  }
}

/**
 * Initialize and start the application
 */
async function start() {
  console.log('🚀 Factory Social Feed Aggregator Starting...\n');

  // Initialize storage
  await initStorage();

  // Start web server
  app.listen(PORT, () => {
    console.log(`✓ Web server running at http://localhost:${PORT}`);
  });

  // Run initial poll
  console.log('✓ Running initial poll...');
  await pollFeeds();

  // Schedule periodic polling
  const pollInterval = parseInt(process.env.POLL_INTERVAL_MINUTES || '10');
  const cronExpression = `*/${pollInterval} * * * *`;
  
  cron.schedule(cronExpression, () => {
    pollFeeds();
  });

  console.log(`✓ Scheduled polling every ${pollInterval} minutes`);
  console.log('\n📡 System ready and monitoring feeds!\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Start the application
start().catch(error => {
  console.error('Fatal error during startup:', error);
  process.exit(1);
});
