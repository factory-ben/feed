# Social Feed Aggregator

[![Run in Smithery](https://smithery.ai/badge/skills/factory-ben)](https://smithery.ai/skills?ns=factory-ben&utm_source=github&utm_medium=badge)


Built with [Droid](https://factory.ai)

A private social media feed aggregator for tracking mentions across Twitter, Reddit, and GitHub. Runs on GitHub Pages with automated scraping via GitHub Actions.

## Features

- 🔐 Token-gated access with SHA-256 authentication
- 🤖 Automated scraping every 10 minutes
- ⌨️ Vim-style keyboard shortcuts (J/K navigation, Cmd+K palette)
- 🏷️ Smart filtering by source, category, and time range
- 📦 Bulk actions and multi-select
- 🎯 Auto-classified posts (mentions, bugs, love, questions)

## Quick Start

### Local Development

```bash
npm install
cp .env.example .env  # Add your API tokens
npm start             # Visit http://localhost:3000
```

### GitHub Pages Deployment

1. **Add GitHub Secrets** (Settings > Secrets > Actions):
   - `GH_PAT`: GitHub Personal Access Token
   - `GH_REPO`: Repository to track (`owner/repo`)
   - `APIFY_TOKEN`: Apify API token for Twitter

2. **Enable GitHub Pages**: Settings > Pages > Source: `main` branch, `/docs` folder

3. **Generate access token**:
   ```bash
   echo -n "your_password" | shasum -a 256
   # Update ACCESS_TOKEN_HASH in docs/index.html
   ```

## Configuration

Edit feed sources via the Settings UI (⚙️) or modify `docs/config.json` directly.

Adjust scraping frequency in `.github/workflows/scrape-feeds.yml`:
```yaml
schedule:
  - cron: '*/30 * * * *'  # Every 30 minutes (recommended for free tier)
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `J/K` | Navigate down/up |
| `X` | Select item |
| `E` | Archive selected |
| `Enter` | Open item |
| `R` | Refresh feed |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

ISC
