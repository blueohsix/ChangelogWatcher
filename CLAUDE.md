# Claude Code Context

This is a simple changelog monitoring tool that checks for updates to AI product changelogs and sends Slack notifications.

## Project Structure

```
src/
├── index.ts        # CLI entry point - parses args, orchestrates checks
├── config.ts       # Source definitions and webhook config
├── changelog.ts    # Core logic: fetch, parse, compare
├── slack.ts        # Slack webhook notification
├── hash-store.ts   # File-based state persistence
└── logger.ts       # Console logging with colors
tests/
└── *.test.ts       # Unit and integration tests (Vitest)
```

## Key Commands

```bash
npm run check              # Check all sources
npm run check:claude-code  # Check Claude Code only
npm run check:claude-blog  # Check Claude Blog only
npm run check:gemini       # Check Gemini only
npm run check:chatgpt      # Check ChatGPT only
npm run check:dry          # Dry run (no notifications)
npm run check:test         # Send to test channel
npm run typecheck          # TypeScript type checking
npm run test               # Run tests once
npm run test:watch         # Watch mode testing
npm run test:coverage      # Generate coverage reports
```

## How It Works

1. Fetches changelog content (directly for markdown sources, via Wayback Machine CDX API → snapshot for wayback sources)
2. Extracts identifier: semver (Claude Code), date entry title+date (Gemini/ChatGPT), or blog post title (Claude Blog)
3. Compares with stored state in `.data/*.json`
4. If changed: saves new state, then sends Slack notification
   - `--dry-run`: saves state but skips notification
   - `--test`: sends notification (with `"test":"yes"`) but skips state save
5. Triggers Wayback Machine to save fresh snapshots for wayback sources

## Parser Types

- `markdown`: Direct fetch, extracts semver from headers (Claude Code)
- `wayback`: Wayback Machine archive, extracts date (Gemini, ChatGPT) or blog posts (Claude Blog)

## Sources

- **Claude Code** (`claude-code`): Monitors Claude Code's CHANGELOG.md via direct fetch
- **Claude Blog** (`claude-blog`): Monitors https://claude.com/blog via Wayback Machine, detects new blog posts by title
- **Gemini** (`gemini`): Monitors Gemini release notes via Wayback Machine
- **ChatGPT** (`chatgpt`): Monitors ChatGPT release notes via Wayback Machine

## Environment Variables

A single Slack webhook URL is used for all sources (Slack handles routing internally):
- `SLACK_WEBHOOK_URL`

## Adding a New Source

1. Add the id to `SourceId` type in `src/config.ts`
2. Add entry to `SOURCES` record in `src/config.ts`
3. Add the id to `VALID_TARGETS` in `src/index.ts`
4. Optionally add an npm script in `package.json` (e.g. `check:newsource`)
5. No webhook changes needed — the single `SLACK_WEBHOOK_URL` handles all sources

## Design Principles

- No frameworks - plain TypeScript
- Minimal dependencies (dotenv, semver)
- File-based state (no database)
- Single responsibility per file
