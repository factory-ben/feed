const axios = require('axios');

/**
 * Posts a message to Slack via webhook
 * @param {Object} item - Feed item to post
 */
async function postToSlack(item, options = {}) {
  const { channel } = options;
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('[Slack] Skipping Slack post (no webhook configured)');
    return;
  }

  try {
    const emoji = {
      twitter: ':bird:',
      reddit: ':reddit:',
      github: ':github:'
    };

    const sourceLabel = {
      twitter: 'Twitter/X',
      reddit: 'Reddit',
      github: 'GitHub Discussions'
    };

    // Format the message
    const message = {
      text: `New ${sourceLabel[item.source]} post from ${item.author}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji[item.source] || ''} *New ${sourceLabel[item.source]} mention*`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Author:*\n${item.author}`
            },
            {
              type: 'mrkdwn',
              text: `*Source:*\n${sourceLabel[item.source]}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${item.content.substring(0, 500)}${item.content.length > 500 ? '...' : ''}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<${item.url}|View post>`
          }
        }
      ]
    };

    if (channel) {
      message.channel = channel;
    }

    await axios.post(webhookUrl, message);
    console.log(`[Slack] Posted ${item.source} item: ${item.id}${channel ? ` (channel: ${channel})` : ''}`);

  } catch (error) {
    console.error('[Slack] Error posting to webhook:', error.message);
  }
}

/**
 * Posts multiple items to Slack with a delay between each
 * @param {Array} items - Feed items to post
 */
async function postBatchToSlack(items, options = {}) {
  if (items.length === 0) {
    return;
  }

  console.log(`[Slack] Posting ${items.length} new items`);

  for (const item of items) {
    await postToSlack(item, options);
    // Add a small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

module.exports = { postToSlack, postBatchToSlack };
