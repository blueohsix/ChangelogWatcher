# Changelog Watcher

Monitor AI product changelogs and get Slack notifications when updates are released.

Currently monitors:
- **Claude Code** - Anthropic's CLI tool
- **Claude Blog** - Anthropic's blog at claude.com/blog
- **Gemini** - Google's AI assistant
- **ChatGPT** - OpenAI's AI assistant

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/ixopay/ChangelogWatcher.git
cd ChangelogWatcher
npm install
```

### 2. Configure Slack

```bash
cp .env.example .env
# Edit .env with your webhook URL
```

The webhook should be a [Slack Workflow Builder](https://slack.com/help/articles/360041352714-Create-more-advanced-workflows-using-webhooks) trigger that accepts `source`, `version`, `changes`, and `test` fields.

### 3. Run

```bash
npm run check              # Check all sources
npm run check:claude-code  # Check Claude Code only
npm run check:dry          # Dry run (no notifications, still saves state)
npm run check:test         # Send to test channel (skips state save)
npm run test               # Run tests
```

## Automated Scheduling

### GitHub Actions (Recommended)

The included workflow runs daily at 07:30 CST. Add `SLACK_WEBHOOK_URL` as a repository secret under **Settings > Secrets and variables > Actions**.

Manual triggers are available from the **Actions** tab with **test** and **dry-run** options.

### Other Options

- **Cron**: `0 * * * * cd /path/to/ChangelogWatcher && npm run check`
- **Any scheduler**: Just run `npm run check`

## Development

See [CLAUDE.md](CLAUDE.md) for architecture details, parser types, how the check flow works, and instructions for adding new sources.

## License

MIT
