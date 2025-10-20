# Factory Feed Viewer

A personal social media feed aggregator for tracking Factory AI mentions across Twitter, Reddit, and GitHub. Runs on GitHub Pages with automated scraping via GitHub Actions.

## Features

- 🔐 **Token-gated access** - Private viewing with SHA-256 token authentication
- 🤖 **Automated scraping** - GitHub Actions runs every 10 minutes
- 📱 **Mobile-friendly** - Responsive design, works on phone/tablet
- ⚙️ **Configurable** - Edit feed sources via settings UI
- ⌨️ **Keyboard shortcuts** - Vim-style navigation (J/K), quick actions
- 🎨 **Dark mode** - Toggle light/dark themes
- 📊 **Multi-view** - List or column layout
- 🏷️ **Filtering** - By source, time range, and hidden users
- 📦 **Archiving** - Archive/restore posts, bulk actions
- 🔍 **Command palette** - Quick access to all actions (Cmd/Ctrl+K)

## Architecture

**Frontend**: Static HTML/CSS/JS served by GitHub Pages  
**Backend**: Node.js scrapers run via GitHub Actions  
**Data**: Static JSON file updated by Actions  
**Access**: SHA-256 hashed token stored in localStorage

## Setup

### Prerequisites

- Node.js 18+
- GitHub account
- GitHub CLI (`gh`) installed
- API tokens:
  - **GitHub Personal Access Token** (for GitHub GraphQL API)
  - **Apify API Token** (for Twitter scraping)

### Local Development

1. **Clone and install**:
   ```bash
   git clone <your-repo-url>
   cd factory-feed-viewer
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API tokens
   ```

3. **Run locally**:
   ```bash
   npm start
   # Visit http://localhost:3000
   ```

4. **Test scraper**:
   ```bash
   node src/scraper-cli.js
   # Outputs to public/data/feed.json
   ```

### GitHub Pages Deployment

1. **Create private repository**:
   ```bash
   gh repo create factory-feed-viewer --private --source=. --remote=origin --push
   ```

2. **Add GitHub Secrets** (Settings > Secrets and variables > Actions):
   - `GITHUB_PAT`: Your GitHub Personal Access Token
   - `APIFY_TOKEN`: Your Apify API token
   - `TEAM_TWITTER_USERNAMES`: Usernames to filter (e.g., `FactoryAI`)

3. **Enable GitHub Pages**:
   - Go to Settings > Pages
   - Source: Deploy from branch `main`
   - Folder: `/public`
   - Save

4. **Generate access token**:
   ```bash
   echo -n "your_password" | shasum -a 256
   # Copy the hash and update ACCESS_TOKEN_HASH in public/index.html
   ```

5. **Trigger first scrape**:
   - Go to Actions tab
   - Run "Scrape Feeds" workflow manually
   - Verify `public/data/feed.json` is created

6. **Access site**:
   - Visit your GitHub Pages URL: `https://<username>.github.io/factory-feed-viewer/`
   - Enter your access token
   - Feed should load!

## Configuration

### Feed Sources

Edit via Settings UI (⚙️ icon) or modify `public/config.json`:

```json
{
  "twitter": {
    "searchTerms": ["factoryai", "anthropic"],
    "excludeUsernames": ["FactoryAI"]
  },
  "reddit": {
    "urls": [
      "https://www.reddit.com/search/?q=factoryai&type=link&sort=new"
    ]
  },
  "github": {
    "usernames": ["anthropics", "vercel", "openai"],
    "topics": ["ai", "llm"]
  }
}
```

### Scraping Frequency

Edit `.github/workflows/scrape-feeds.yml`:

```yaml
schedule:
  - cron: '*/10 * * * *'  # Every 10 minutes
  # Change to '*/30 * * * *' for every 30 minutes (recommended for free tier)
```

### Access Token

To change the access password:

```bash
echo -n "new_password" | shasum -a 256
```

Update `ACCESS_TOKEN_HASH` in `public/index.html` with the new hash.

## Usage

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `J` | Next item |
| `K` | Previous item |
| `Shift+J` | Next selected item |
| `Shift+K` | Previous selected item |
| `Enter` | Select/deselect current item |
| `A` | Archive selected |
| `Shift+A` | Archive all visible |
| `Cmd/Ctrl+A` | Select all visible |
| `S` | Send selected to Slack |
| `H` | Toggle archived posts |
| `Esc` | Clear selection |
| `Cmd/Ctrl+K` | Open command palette |

### Mouse Actions

- **Click card**: Select/deselect
- **Cmd/Ctrl+Click**: Open URL in new tab
- **Click source filter**: Toggle source visibility
- **Click time filter**: Filter by time range

## API Rate Limits

| Service | Limit | Notes |
|---------|-------|-------|
| GitHub | 5,000 req/hr | Authenticated GraphQL |
| Reddit | ~60 req/min | Public feeds |
| Twitter | Via Apify | Check usage dashboard |
| GitHub Actions | 2,000 min/month | Free tier |

## Security

- ✅ `.env` is gitignored
- ✅ All secrets in GitHub Secrets
- ✅ Access token is SHA-256 hashed
- ✅ Private repository
- ✅ No API keys in code or commits

See `AGENTS.md` for detailed security practices.

## Maintenance

**Weekly**: Check Actions tab for successful runs  
**Monthly**: Update dependencies (`npm update`)  
**As needed**: Rotate tokens if compromised

## Troubleshooting

### Feed not updating?
- Check Actions tab for errors
- Verify GitHub Secrets are set correctly
- Clear browser cache

### Can't access site?
- Verify access token hash matches
- Check GitHub Pages is enabled
- Try incognito/private browsing mode

### Scraper failing?
- Check API tokens are valid
- Verify rate limits not exceeded
- Review Actions logs for errors

## Contributing

This is a personal project, but suggestions welcome via issues.

## License

ISC
