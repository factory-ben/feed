/**
 * Scrapes discussions and issues from a GitHub repository
 * @returns {Promise<Array>} Array of normalized discussion and issue objects
 */
async function scrapeGitHub() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'Factory-AI/factory';
  const [owner, repoName] = repo.split('/');
  
  if (!token) {
    console.error('[GitHub] Missing GITHUB_TOKEN in environment');
    return [];
  }

  if (!owner || !repoName) {
    console.error('[GitHub] Invalid GITHUB_REPO format. Expected "owner/repo", got:', repo);
    return [];
  }

  // Dynamic import for ES Module compatibility
  const { graphql } = await import('@octokit/graphql');

  try {
    const query = `
      query {
        repository(owner: "${owner}", name: "${repoName}") {
          discussions(first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              id
              number
              title
              body
              url
              createdAt
              author {
                login
              }
              category {
                name
              }
            }
          }
          issues(first: 20, orderBy: {field: CREATED_AT, direction: DESC}, states: [OPEN]) {
            nodes {
              id
              number
              title
              body
              url
              createdAt
              author {
                login
              }
              labels(first: 5) {
                nodes {
                  name
                }
              }
            }
          }
        }
      }
    `;

    const graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    });

    const result = await graphqlWithAuth(query);
    
    const discussions = result.repository.discussions.nodes.map(discussion => ({
      id: `github_discussion_${discussion.number}`,
      source: 'github',
      author: discussion.author?.login || 'unknown',
      content: `[Discussion] ${discussion.title}\n\n${(discussion.body || '').substring(0, 500)}`,
      url: discussion.url,
      timestamp: discussion.createdAt,
      metadata: {
        type: 'discussion',
        category: discussion.category.name,
        number: discussion.number
      }
    }));

    const issues = result.repository.issues.nodes.map(issue => ({
      id: `github_issue_${issue.number}`,
      source: 'github',
      author: issue.author?.login || 'unknown',
      content: `[Issue] ${issue.title}\n\n${(issue.body || '').substring(0, 500)}`,
      url: issue.url,
      timestamp: issue.createdAt,
      metadata: {
        type: 'issue',
        labels: issue.labels.nodes.map(label => label.name),
        number: issue.number
      }
    }));

    const allItems = [...discussions, ...issues];
    console.log(`[GitHub] Fetched ${discussions.length} discussions and ${issues.length} issues from ${owner}/${repoName}`);
    return allItems;

  } catch (error) {
    console.error('[GitHub] Error fetching from GitHub:', error.message);
    return [];
  }
}

module.exports = { scrapeGitHub };
