const axios = require('axios');

/**
 * Scrapes mentions of @FactoryAI from Twitter using Apify
 * @returns {Promise<Array>} Array of normalized tweet objects
 */
async function scrapeTwitter() {
  const apifyToken = process.env.APIFY_TOKEN;

  if (!apifyToken) {
    console.log('[Twitter] Skipping Twitter scrape (no APIFY_TOKEN configured)');
    return [];
  }

  try {
    console.log('[Twitter] Starting Apify Twitter scraper...');

    // Start the Apify actor run
    // Using the Twitter Scraper actor which is more reliable
    const runResponse = await axios.post(
      'https://api.apify.com/v2/acts/61RPP7dywgiy0JPD0/runs',
      {
        searchMode: 'live',
        searchTerms: ['@FactoryAI'],
        maxItems: 20,
        addUserInfo: true
      },
      {
        headers: {
          'Authorization': `Bearer ${apifyToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const runId = runResponse.data.data.id;
    console.log(`[Twitter] Apify run started: ${runId}`);

    // Poll for results (wait up to 2 minutes)
    let tweets = [];
    let attempts = 0;
    const maxAttempts = 24; // 24 * 5 seconds = 120 seconds max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      // Check run status
      const statusResponse = await axios.get(
        `https://api.apify.com/v2/actor-runs/${runId}`,
        {
          headers: { 'Authorization': `Bearer ${apifyToken}` }
        }
      );

      const status = statusResponse.data.data.status;
      console.log(`[Twitter] Run status: ${status} (attempt ${attempts}/${maxAttempts})`);

      if (status === 'SUCCEEDED') {
        // Get the dataset results
        const datasetId = statusResponse.data.data.defaultDatasetId;
        const dataResponse = await axios.get(
          `https://api.apify.com/v2/datasets/${datasetId}/items`,
          {
            headers: { 'Authorization': `Bearer ${apifyToken}` }
          }
        );

        // Log first tweet to debug structure
        if (dataResponse.data.length > 0) {
          console.log('[Twitter] Sample tweet structure:', JSON.stringify(dataResponse.data[0], null, 2));
        }

        // Filter out demo data
        const realTweets = dataResponse.data.filter(tweet => !tweet.demo);
        
        if (realTweets.length === 0 && dataResponse.data.length > 0) {
          console.log('[Twitter] Warning: Only demo data returned. Check your Apify credits at https://console.apify.com/billing');
        }

        tweets = realTweets.map(tweet => {
          // Extract username from URL since author field is not included
          const tweetId = tweet.id;
          let username = 'unknown';
          
          if (tweet.twitterUrl || tweet.url) {
            const urlMatch = (tweet.twitterUrl || tweet.url).match(/twitter\.com\/([^\/]+)\//);
            if (urlMatch) {
              username = urlMatch[1];
            }
          }
          
          return {
            id: `twitter_${tweetId}`,
            source: 'twitter',
            author: username,
            content: tweet.text,
            url: tweet.url,
            timestamp: new Date(tweet.createdAt).toISOString(),
            metadata: {
              conversation_id: tweetId, // Use tweet ID as conversation proxy
              likes: tweet.likeCount || 0,
              retweets: tweet.retweetCount || 0,
              replies: tweet.replyCount || 0,
              quotes: tweet.quoteCount || 0
            }
          };
        });

        console.log(`[Twitter] Successfully fetched ${tweets.length} tweets from Apify`);
        break;
      } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        console.error(`[Twitter] Apify run failed with status: ${status}`);
        break;
      }
    }

    if (attempts >= maxAttempts && tweets.length === 0) {
      console.log('[Twitter] Apify run timed out waiting for results');
    }

    return tweets;

  } catch (error) {
    console.error('[Twitter] Error with Apify scraper:', error.message);
    if (error.response) {
      console.error('[Twitter] Apify API error:', error.response.data);
    }
    return [];
  }
}

/**
 * Filters tweets to remove team members and deduplicate threads
 * @param {Array} tweets - Raw tweets
 * @param {Set} seenConversationIds - Set of conversation IDs we've already seen
 * @returns {Array} Filtered tweets
 */
function filterTweets(tweets, seenConversationIds = new Set()) {
  const teamUsernames = (process.env.TEAM_TWITTER_USERNAMES || '')
    .split(',')
    .map(u => u.trim().toLowerCase());

  return tweets.filter(tweet => {
    // Skip if from team member
    if (teamUsernames.includes(tweet.author.toLowerCase())) {
      return false;
    }

    // Skip if we've already seen this conversation
    const conversationId = tweet.metadata?.conversation_id;
    if (conversationId && seenConversationIds.has(conversationId)) {
      return false;
    }

    // Add to seen conversations
    if (conversationId) {
      seenConversationIds.add(conversationId);
    }

    return true;
  });
}

module.exports = { scrapeTwitter, filterTweets };
