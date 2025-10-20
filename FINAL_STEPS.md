# Final Deployment Steps

## ✅ Completed

- Repository created: https://github.com/factory-ben/factory-feed-viewer
- Code pushed to main branch
- All source files are in the repository

## 🔧 Manual Steps Required (5 minutes)

### 1. Add GitHub Actions Workflow

The workflow file exists locally at `.github/workflows/scrape-feeds.yml` but can't be pushed due to token permissions.

**Add it manually:**

1. Go to: https://github.com/factory-ben/factory-feed-viewer
2. Click "Add file" > "Create new file"
3. Name it: `.github/workflows/scrape-feeds.yml`
4. Copy content from your local file:
   ```bash
   cat /Users/bentossell/repos/ccc/.github/workflows/scrape-feeds.yml
   ```
5. Paste into GitHub editor
6. Commit with message: "Add GitHub Actions workflow"

### 2. Add GitHub Secrets

Go to: https://github.com/factory-ben/factory-feed-viewer/settings/secrets/actions

Click "New repository secret" for each:

- `GITHUB_PAT`: GitHub personal access token with repo scope
- `APIFY_TOKEN`: Apify API token for Twitter scraping
- `TEAM_TWITTER_USERNAMES`: Comma-separated usernames to filter (e.g., `FactoryAI`)

### 3. Update Access Token Hash

Generate your personal password hash:

```bash
echo -n "your_chosen_password" | shasum -a 256
```

Then edit the file on GitHub:
1. Go to https://github.com/factory-ben/factory-feed-viewer/blob/main/public/index.html
2. Click the pencil icon to edit
3. Find line 924: `const ACCESS_TOKEN_HASH = '...'`
4. Replace with your generated hash
5. Commit: "Update access token hash"

### 4. Enable GitHub Pages

1. Go to: https://github.com/factory-ben/factory-feed-viewer/settings/pages
2. Under "Source": Select "Deploy from a branch"
3. Branch: `main`
4. Folder: `/public`
5. Click "Save"

### 5. Trigger First Workflow Run

1. Go to: https://github.com/factory-ben/factory-feed-viewer/actions
2. Click "Scrape Feeds" workflow
3. Click "Run workflow" dropdown
4. Click green "Run workflow" button
5. Wait 1-2 minutes for completion
6. Verify `public/data/feed.json` was created

### 6. Access Your Site

Visit: **https://factory-ben.github.io/factory-feed-viewer/**

Enter the password you used to generate the hash in step 3.

---

## Quick Start Commands

```bash
# View local workflow file
cat /Users/bentossell/repos/ccc/.github/workflows/scrape-feeds.yml

# View your API keys (never commit this file)
cat /path/to/your/local/.env

# Generate access token hash
echo -n "your_password" | shasum -a 256

# View repository
open https://github.com/factory-ben/factory-feed-viewer
```

## Troubleshooting

- **Workflow fails**: Check that all 3 secrets are set correctly
- **Feed doesn't load**: Check that workflow ran successfully and created feed.json
- **Can't access**: Verify password hash matches what you generated

## Summary

Your repository is ready at: https://github.com/factory-ben/factory-feed-viewer

Just complete the 6 manual steps above (takes about 5 minutes) and you'll have a fully functional, private, mobile-friendly social feed aggregator!
