# Factory Feed CLI

A command-line interface for browsing and searching your Factory Feed directly from the terminal.

## Installation

### Local Development
```bash
npm install
npm run feed help
```

### Global Installation (Optional)
```bash
npm link
feed help
```

## Usage

### List Recent Posts
```bash
# Show 20 most recent posts
npm run feed list

# Show 10 posts
npm run feed list -- --limit 10

# Verbose output with URLs and engagement
npm run feed list -- -v
```

### Filter Posts

**By Source:**
```bash
npm run feed list -- --source twitter
npm run feed list -- --source reddit
npm run feed list -- --source github
```

**By Category:**
```bash
npm run feed list -- --category love
npm run feed list -- --category bug
npm run feed list -- --category mention
npm run feed list -- --category question
```

**By Author:**
```bash
npm run feed list -- --author bentossell
npm run feed list -- --author "jason" --limit 5
```

**Combine Filters:**
```bash
npm run feed list -- --source twitter --category love --limit 5 -v
```

### Search Posts
```bash
npm run feed search "supabase"
npm run feed search "bug report"
```

### View Single Post
```bash
npm run feed view twitter_2000539163565973531
npm run feed view 2000539163565973531  # ID suffix also works
```

### Show Statistics
```bash
npm run feed stats
```

Shows:
- Total posts count
- Posts by source (Twitter, Reddit, GitHub)
- Posts by category (mention, bug, love, question, other)
- Top 10 authors

## Commands Reference

| Command | Description |
|---------|-------------|
| `feed list` | List recent posts (default) |
| `feed stats` | Show feed statistics |
| `feed view <id>` | View single post details |
| `feed search <query>` | Search posts |
| `feed help` | Show help |

## Options

| Option | Description |
|--------|-------------|
| `--source <name>` | Filter by source (twitter\|reddit\|github) |
| `--category <name>` | Filter by category (mention\|bug\|love\|question\|other) |
| `--author <name>` | Filter by author username |
| `--limit <number>` | Limit results (default: 20) |
| `-v, --verbose` | Show detailed output |

## Examples

```bash
# Show recent Twitter mentions
npm run feed list -- --source twitter --category mention --limit 5

# Find bug reports
npm run feed list -- --category bug -v

# Search for specific topics
npm run feed search "authentication"
npm run feed search "@supabase"

# Get detailed stats
npm run feed stats

# View a specific post
npm run feed view twitter_2000539163565973531
```

## Output

The CLI uses colored output for better readability:
- 🐦 Twitter posts in blue
- 🔴 Reddit posts in red  
- 🔧 GitHub posts
- Categories color-coded (mentions in cyan, bugs in red, love in magenta, questions in yellow)

## Environment Variables

Optional Supabase integration (for future features):
```bash
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

## Data Source

The CLI reads from `docs/data/feed.json` which is updated by the scraper:
```bash
npm run scrape  # Update feed data
npm run feed list  # View updated feed
```

## Development

The CLI source is in `src/feed-cli.js`. To modify:

1. Edit `src/feed-cli.js`
2. Test changes: `node src/feed-cli.js list`
3. Add new commands by following existing patterns

## Tips

- Use `--limit` to control output size for large feeds
- Use `-v` for detailed post information including engagement metrics
- Search includes both post content and author names
- Post IDs are stable across feed refreshes (safe to bookmark)

## Future Features

- Archive posts from CLI
- Mark posts as read
- Export filtered results
- Real-time feed updates
- Interactive mode with arrow key navigation
