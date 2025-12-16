#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const FEED_PATH = path.join(__dirname, '../docs/data/feed.json');
const CONFIG_PATH = path.join(__dirname, '../docs/config.json');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Initialize Supabase (optional)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

// Load feed data
async function loadFeed() {
  try {
    const data = await fs.readFile(FEED_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`${colors.red}Error loading feed:${colors.reset}`, error.message);
    return [];
  }
}

// Save feed data
async function saveFeed(feed) {
  try {
    await fs.writeFile(FEED_PATH, JSON.stringify(feed, null, 2));
    return true;
  } catch (error) {
    console.error(`${colors.red}Error saving feed:${colors.reset}`, error.message);
    return false;
  }
}

// Format timestamp
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// Format source icon
function getSourceIcon(source) {
  const icons = {
    twitter: '🐦',
    reddit: '🔴',
    github: '🔧'
  };
  return icons[source] || '📄';
}

// Get category color
function getCategoryColor(category) {
  const colors_map = {
    mention: colors.cyan,
    bug: colors.red,
    love: colors.magenta,
    question: colors.yellow,
    other: colors.gray
  };
  return colors_map[category || 'other'] || colors.gray;
}

// Truncate text
function truncate(text, maxLength) {
  if (!text) return '';
  text = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// List posts command
async function listPosts(options = {}) {
  const feed = await loadFeed();
  
  let filtered = feed;

  // Apply filters
  if (options.source) {
    filtered = filtered.filter(item => item.source === options.source);
  }
  
  if (options.category) {
    filtered = filtered.filter(item => (item.category || 'other') === options.category);
  }

  if (options.author) {
    filtered = filtered.filter(item => 
      item.author.toLowerCase().includes(options.author.toLowerCase())
    );
  }

  if (options.search) {
    const query = options.search.toLowerCase();
    filtered = filtered.filter(item =>
      item.content.toLowerCase().includes(query) ||
      (item.content || '').toLowerCase().includes(query)
    );
  }

  // Apply limit
  const limit = options.limit || 20;
  filtered = filtered.slice(0, limit);

  if (filtered.length === 0) {
    console.log(`${colors.gray}No posts found${colors.reset}`);
    return;
  }

  // Display posts
  console.log(`\n${colors.bright}Found ${filtered.length} posts${colors.reset}\n`);
  
  filtered.forEach((item, index) => {
    const icon = getSourceIcon(item.source);
    const categoryColor = getCategoryColor(item.category);
    const category = (item.category || 'other').toUpperCase();
    const time = formatTime(item.timestamp);
    const content = truncate(item.content, options.verbose ? 500 : 100);
    
    console.log(
      `${colors.dim}${index + 1}.${colors.reset} ${icon} ` +
      `${colors.bright}@${item.author}${colors.reset} ` +
      `${categoryColor}[${category}]${colors.reset} ` +
      `${colors.gray}${time}${colors.reset}`
    );
    console.log(`   ${content}`);
    
    if (options.verbose) {
      console.log(`   ${colors.blue}${item.url}${colors.reset}`);
      if (item.metadata?.likes || item.metadata?.stars) {
        const likes = item.metadata.likes || item.metadata.stars || 0;
        const retweets = item.metadata.retweets || 0;
        const replies = item.metadata.replies || 0;
        console.log(`   ${colors.gray}❤️ ${likes}  🔁 ${retweets}  💬 ${replies}${colors.reset}`);
      }
    }
    console.log('');
  });

  // Stats footer
  console.log(`${colors.dim}─────────────────────────────────────────────────${colors.reset}`);
  console.log(`${colors.gray}Showing ${filtered.length} of ${feed.length} total posts${colors.reset}\n`);
}

// Show stats command
async function showStats() {
  const feed = await loadFeed();
  
  if (feed.length === 0) {
    console.log(`${colors.gray}No posts in feed${colors.reset}`);
    return;
  }

  // Calculate stats
  const bySource = {};
  const byCategory = {};
  const byAuthor = {};
  
  feed.forEach(item => {
    bySource[item.source] = (bySource[item.source] || 0) + 1;
    const cat = item.category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    byAuthor[item.author] = (byAuthor[item.author] || 0) + 1;
  });

  const topAuthors = Object.entries(byAuthor)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log(`\n${colors.bright}Feed Statistics${colors.reset}\n`);
  console.log(`${colors.gray}Total Posts:${colors.reset} ${colors.bright}${feed.length}${colors.reset}`);
  
  console.log(`\n${colors.bright}By Source:${colors.reset}`);
  Object.entries(bySource).forEach(([source, count]) => {
    const icon = getSourceIcon(source);
    const percentage = ((count / feed.length) * 100).toFixed(1);
    console.log(`  ${icon} ${source.padEnd(10)} ${colors.green}${count}${colors.reset} (${percentage}%)`);
  });

  console.log(`\n${colors.bright}By Category:${colors.reset}`);
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const catColor = getCategoryColor(category);
      const percentage = ((count / feed.length) * 100).toFixed(1);
      console.log(`  ${catColor}${category.padEnd(10)}${colors.reset} ${colors.green}${count}${colors.reset} (${percentage}%)`);
    });

  console.log(`\n${colors.bright}Top Authors:${colors.reset}`);
  topAuthors.forEach(([author, count], index) => {
    console.log(`  ${colors.dim}${index + 1}.${colors.reset} ${colors.cyan}@${author}${colors.reset} ${colors.green}${count}${colors.reset}`);
  });

  console.log('');
}

// View single post command
async function viewPost(id) {
  const feed = await loadFeed();
  const post = feed.find(item => item.id === id || item.id.endsWith(id));

  if (!post) {
    console.log(`${colors.red}Post not found: ${id}${colors.reset}`);
    return;
  }

  const icon = getSourceIcon(post.source);
  const categoryColor = getCategoryColor(post.category);
  const category = (post.category || 'other').toUpperCase();
  const time = new Date(post.timestamp).toLocaleString();

  console.log(`\n${colors.bright}Post Details${colors.reset}\n`);
  console.log(`${colors.gray}ID:${colors.reset}        ${post.id}`);
  console.log(`${colors.gray}Source:${colors.reset}    ${icon} ${post.source}`);
  console.log(`${colors.gray}Author:${colors.reset}    ${colors.cyan}@${post.author}${colors.reset}`);
  console.log(`${colors.gray}Category:${colors.reset}  ${categoryColor}${category}${colors.reset}`);
  console.log(`${colors.gray}Time:${colors.reset}      ${time}`);
  console.log(`${colors.gray}URL:${colors.reset}       ${colors.blue}${post.url}${colors.reset}`);
  
  if (post.metadata) {
    console.log(`\n${colors.bright}Engagement:${colors.reset}`);
    if (post.metadata.likes !== undefined) console.log(`  ❤️  Likes:    ${post.metadata.likes}`);
    if (post.metadata.retweets !== undefined) console.log(`  🔁 Retweets: ${post.metadata.retweets}`);
    if (post.metadata.replies !== undefined) console.log(`  💬 Replies:  ${post.metadata.replies}`);
    if (post.metadata.stars !== undefined) console.log(`  ⭐ Stars:    ${post.metadata.stars}`);
  }

  console.log(`\n${colors.bright}Content:${colors.reset}`);
  console.log(`  ${post.content}\n`);
}

// Search posts command
async function searchPosts(query) {
  return listPosts({ search: query, limit: 50, verbose: true });
}

// Show help
function showHelp() {
  console.log(`
${colors.bright}Factory Feed CLI${colors.reset}

${colors.bright}Usage:${colors.reset}
  feed <command> [options]

${colors.bright}Commands:${colors.reset}
  ${colors.cyan}list${colors.reset}                List recent posts (default)
  ${colors.cyan}stats${colors.reset}               Show feed statistics
  ${colors.cyan}view <id>${colors.reset}           View single post details
  ${colors.cyan}search <query>${colors.reset}      Search posts
  ${colors.cyan}help${colors.reset}                Show this help

${colors.bright}List Options:${colors.reset}
  --source <name>        Filter by source (twitter|reddit|github)
  --category <name>      Filter by category (mention|bug|love|question|other)
  --author <name>        Filter by author username
  --limit <number>       Limit results (default: 20)
  -v, --verbose          Show detailed output

${colors.bright}Examples:${colors.reset}
  feed list
  feed list --source twitter --limit 10
  feed list --category love -v
  feed list --author bentossell
  feed search "bug"
  feed view twitter_2000539163565973531
  feed stats

${colors.bright}Environment:${colors.reset}
  SUPABASE_URL          Supabase project URL
  SUPABASE_ANON_KEY     Supabase anonymous key
`);
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  const options = {};
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-v' || arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--source' && args[i + 1]) {
      options.source = args[++i];
    } else if (arg === '--category' && args[i + 1]) {
      options.category = args[++i];
    } else if (arg === '--author' && args[i + 1]) {
      options.author = args[++i];
    } else if (arg === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[++i]);
    } else if (!arg.startsWith('--')) {
      options.arg = arg;
    }
  }

  return { command, options };
}

// Main
async function main() {
  const { command, options } = parseArgs();

  try {
    switch (command) {
      case 'list':
        await listPosts(options);
        break;
      
      case 'stats':
        await showStats();
        break;
      
      case 'view':
        if (!options.arg) {
          console.log(`${colors.red}Error: Post ID required${colors.reset}`);
          console.log(`Usage: feed view <id>`);
          process.exit(1);
        }
        await viewPost(options.arg);
        break;
      
      case 'search':
        if (!options.arg) {
          console.log(`${colors.red}Error: Search query required${colors.reset}`);
          console.log(`Usage: feed search <query>`);
          process.exit(1);
        }
        await searchPosts(options.arg);
        break;
      
      default:
        console.log(`${colors.red}Unknown command: ${command}${colors.reset}`);
        console.log(`Run 'feed help' for usage information`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { loadFeed, listPosts, showStats, viewPost, searchPosts };
