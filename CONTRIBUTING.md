# Contributing to Social Feed Aggregator

Thank you for your interest in contributing! This project is open source and we welcome improvements from the community.

## Ways to Contribute

- 🐛 **Bug fixes** - Found a bug? Submit a PR with a fix
- ✨ **New features** - Add new scrapers, improve UI, enhance functionality
- 📚 **Documentation** - Improve README, add examples, fix typos
- 🎨 **UI/UX improvements** - Better design, accessibility, mobile experience
- ⚡ **Performance** - Optimize scrapers, reduce load times
- 🧪 **Tests** - Add test coverage (we currently have none!)

## Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/your-username/social-feed-aggregator.git
   cd social-feed-aggregator
   ```
3. **Set up your environment:**
   ```bash
   cp .env.example .env
   # Add your API keys to .env
   pnpm install
   ```
4. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Local Development

```bash
# Run the local server
pnpm start

# Test the scraper
pnpm run scrape

# Check the output
cat docs/data/feed.json
```

### Code Style

- Follow the existing code style in the project
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing Your Changes

Before submitting:

1. **Test locally** - Run `pnpm start` and verify everything works
2. **Test scraping** - Run `pnpm run scrape` and check output
3. **Check for secrets** - Run `git diff` and ensure no API keys are included
4. **Verify the frontend** - Open http://localhost:3000 and test the UI

## Submitting a Pull Request

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Brief description of your changes"
   ```

2. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request:**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template with:
     - What changed
     - Why it's needed
     - How to test it

4. **Respond to feedback:**
   - Address any review comments
   - Push updates to your branch (PR will auto-update)

## Project Structure

```
├── src/
│   ├── scrapers/        # Individual scrapers for each platform
│   │   ├── github.js    # GitHub discussions/issues scraper
│   │   ├── reddit.js    # Reddit scraper
│   │   └── twitter.js   # Twitter scraper (via Apify)
│   ├── index.js         # Express server for local dev
│   ├── scraper-cli.js   # CLI entry point for GitHub Actions
│   ├── storage.js       # Data persistence logic
│   └── slack.js         # Slack integration (optional)
├── docs/                # GitHub Pages static site
│   ├── index.html       # Main frontend (token-gated)
│   ├── config.json      # Default feed configuration
│   └── data/
│       └── feed.json    # Generated feed data (auto-updated)
├── .github/
│   └── workflows/
│       └── scrape-feeds.yml  # GitHub Actions scraper workflow
└── data/                # Local development cache
```

## Adding a New Scraper

Want to add a new social platform? Here's how:

1. **Create the scraper:**
   ```javascript
   // src/scrapers/newsource.js
   async function scrapeNewSource() {
     const items = [];
     // Your scraping logic here
     
     return items.map(item => ({
       id: `newsource_${item.id}`,
       source: 'newsource',
       author: item.author,
       content: item.text,
       url: item.link,
       timestamp: item.date,
       metadata: { /* source-specific data */ }
     }));
   }
   
   module.exports = { scrapeNewSource };
   ```

2. **Add to scraper-cli.js:**
   ```javascript
   const { scrapeNewSource } = require('./scrapers/newsource');
   
   const results = await Promise.allSettled([
     scrapeReddit(),
     scrapeGitHub(),
     scrapeTwitter(),
     scrapeNewSource()  // Add here
   ]);
   ```

3. **Update the frontend** (docs/index.html):
   - Add source name to `sourceNames`
   - Add icon to `sourceIcons`
   - Add filter button
   - Add rendering logic

## Common Issues

### "Missing API Token"
- Check your `.env` file has all required tokens
- Make sure `.env` is in the root directory
- Verify token names match `.env.example`

### "Cannot find module"
- Run `pnpm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)

### "GitHub Actions Failing"
- Verify all secrets are set in GitHub Settings
- Check the Actions logs for specific errors
- Remember: secret names can't start with `GITHUB_`

## Security Guidelines

⚠️ **Never commit:**
- API keys or tokens
- `.env` file
- Personal data in `data/*.json`

✅ **Always:**
- Use environment variables for secrets
- Add sensitive files to `.gitignore`
- Review `git diff` before committing
- Use `git diff --cached` before pushing

## Need Help?

- 📖 Check the [README](README.md) for setup instructions
- 🤖 Review [AGENTS.md](AGENTS.md) for AI agent guidelines
- 🐛 Open an [issue](https://github.com/bentossell/ccc-new/issues) to ask questions
- 💬 Tag @bentossell in your PR for review

## Code of Conduct

Be respectful and constructive. We're all here to learn and build together.

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

---

**Thank you for contributing!** 🎉
