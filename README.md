# Pinterest Amazon Deals Automator

A full-stack React and Express application rewritten from the Python automation workflow. Automatically ingests top Amazon deals from RSS feeds (Slickdeals / Amazon), tags affiliate parameters with tracking ID (`bughy29-20`), previews and customizes Pins with Pinterest standards, and publishes them to Pinterest via Pinterest API v5.

## Features

- **Live Deal Feeds**: Ingestion of trending Amazon deals with automated thumbnail parsing and fallback cache.
- **Affiliate Tagging Engine**: Appends Amazon Affiliate tag (`bughy29-20`) to all outgoing product links.
- **Pinterest API v5 Integration**: Directly posts pins with compliant titles (up to 99 chars), descriptions (up to 499 chars), image sources, and target board IDs.
- **Workflow Automation Console**: Recreates the original `main.py` batch execution and GitHub Actions cron runner (`0 10 * * *`) with real-time logs and progress tracking.
- **Pin Studio & Live Preview**: Real-time Pinterest card mockup, quick hashtag generators, and instant single or batch posting.
- **Activity Log**: Full history of posted pins with tracking links and API responses.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite
- **Backend**: Express, Fast-XML-Parser, Vite middleware
- **APIs**: Pinterest API v5, Amazon Affiliate links, RSS Deals feeds
