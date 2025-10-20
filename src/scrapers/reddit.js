const axios = require('axios');

/**
 * Scrapes Reddit posts using Apify (Reddit blocks GitHub Actions IPs)
 * @returns {Promise<Array>} Array of normalized post objects
 */
async function scrapeReddit() {
  const apifyToken = process.env.APIFY_TOKEN;

  if (!apifyToken) {
    console.log('[Reddit] Skipping Reddit scrape (no APIFY_TOKEN configured)');
    return [];
  }

  try {
    console.log('[Reddit] Starting Apify Reddit scraper...');
    
    // Start Apify Reddit scraper - scrape r/FactoryAi subreddit
    const runResponse = await axios.post(
      'https://api.apify.com/v2/acts/oAuCIx3ItNrs2okjQ/runs',
      {
        startUrls: [{ url: 'https://www.reddit.com/r/FactoryAi/' }],
        maxItems: 25,
        skipComments: true,
        sort: 'new'
      },
      {
        params: { token: apifyToken },
        headers: { 'Content-Type': 'application/json' }
      }
    );

    const runId = runResponse.data.data.id;
    console.log(`[Reddit] Apify run started: ${runId}`);

    // Poll for completion (max 2 minutes)
    let runStatus = 'RUNNING';
    let datasetId = null;
    let attempts = 0;
    const maxAttempts = 24; // 24 * 5s = 2 minutes

    while (runStatus === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      const statusResponse = await axios.get(
        `https://api.apify.com/v2/acts/oAuCIx3ItNrs2okjQ/runs/${runId}`,
        { params: { token: apifyToken } }
      );

      runStatus = statusResponse.data.data.status;
      datasetId = statusResponse.data.data.defaultDatasetId;
      console.log(`[Reddit] Run status: ${runStatus} (attempt ${attempts}/${maxAttempts})`);
    }

    if (runStatus !== 'SUCCEEDED') {
      console.error(`[Reddit] Apify run did not succeed: ${runStatus}`);
      return [];
    }

    if (!datasetId) {
      console.error('[Reddit] No dataset ID returned from Apify');
      return [];
    }

    // Get results from default dataset
    const datasetResponse = await axios.get(
      `https://api.apify.com/v2/datasets/${datasetId}/items`,
      { params: { token: apifyToken } }
    );

    const posts = datasetResponse.data
      .filter(post => post && post.id && post.title && post.dataType === 'post') // Only posts with titles
      .map(post => ({
        id: `reddit_${post.parsedId || post.id}`,
        source: 'reddit',
        author: post.username || post.author || 'unknown',
        content: post.title + (post.body ? `\n\n${post.body.substring(0, 500)}` : ''),
        url: post.url || post.link,
        timestamp: post.createdAt, // Already in ISO format from Apify
        metadata: {
          score: post.upVotes || post.score || 0,
          num_comments: post.numberOfComments || 0,
          subreddit: post.parsedCommunityName || post.communityName
        }
      }));

    console.log(`[Reddit] Successfully fetched ${posts.length} posts from Apify`);
    return posts;

  } catch (error) {
    console.error('[Reddit] Error with Apify scraper:', error.message);
    return [];
  }
}

module.exports = { scrapeReddit };
