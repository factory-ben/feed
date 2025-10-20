const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const FEED_FILE = path.join(DATA_DIR, 'feed.json');
const SEEN_FILE = path.join(DATA_DIR, 'seen.json');

/**
 * Ensures data directory and files exist
 */
async function initStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Initialize feed.json if it doesn't exist
    try {
      await fs.access(FEED_FILE);
    } catch {
      await fs.writeFile(FEED_FILE, JSON.stringify([], null, 2));
    }

    // Initialize seen.json if it doesn't exist
    try {
      await fs.access(SEEN_FILE);
    } catch {
      await fs.writeFile(SEEN_FILE, JSON.stringify({ ids: [], conversations: [] }, null, 2));
    }
  } catch (error) {
    console.error('[Storage] Error initializing storage:', error.message);
  }
}

/**
 * Loads the feed from disk
 * @returns {Promise<Array>} Feed items
 */
async function loadFeed() {
  try {
    const data = await fs.readFile(FEED_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Storage] Error loading feed:', error.message);
    return [];
  }
}

/**
 * Loads the seen IDs from disk
 * @returns {Promise<Object>} Seen data with ids and conversations arrays
 */
async function loadSeen() {
  try {
    const data = await fs.readFile(SEEN_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Storage] Error loading seen IDs:', error.message);
    return { ids: [], conversations: [] };
  }
}

/**
 * Saves the feed to disk (keeps last 100 items)
 * @param {Array} feed - Feed items
 */
async function saveFeed(feed) {
  try {
    // Sort by timestamp descending and keep last 100
    const sorted = feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const trimmed = sorted.slice(0, 100);
    await fs.writeFile(FEED_FILE, JSON.stringify(trimmed, null, 2));
  } catch (error) {
    console.error('[Storage] Error saving feed:', error.message);
  }
}

/**
 * Saves the seen IDs to disk
 * @param {Object} seen - Seen data with ids and conversations
 */
async function saveSeen(seen) {
  try {
    // Keep only last 500 IDs to prevent file from growing too large
    const trimmed = {
      ids: seen.ids.slice(-500),
      conversations: seen.conversations.slice(-500)
    };
    await fs.writeFile(SEEN_FILE, JSON.stringify(trimmed, null, 2));
  } catch (error) {
    console.error('[Storage] Error saving seen IDs:', error.message);
  }
}

/**
 * Filters out items that have already been seen
 * @param {Array} items - New items to check
 * @param {Set} seenIds - Set of IDs we've already seen
 * @returns {Array} Filtered new items
 */
function filterNewItems(items, seenIds) {
  return items.filter(item => !seenIds.has(item.id));
}

module.exports = {
  initStorage,
  loadFeed,
  loadSeen,
  saveFeed,
  saveSeen,
  filterNewItems
};
