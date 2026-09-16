# Contributing

Thanks for helping improve Meta Ads Analyzer.

## Development setup

```bash
git clone https://github.com/Synero/meta-ads-analyzer.git
cd meta-ads-analyzer
npm test
```

No npm install is required for the current zero-dependency CLI.

## Tests

`npm test` runs the offline suite in `test/`. It boots a local HTTP server that impersonates the Graph API, so it needs no access token and makes no outbound request. Never make the suite depend on real credentials or live Meta data.

- `test/unit.test.js` — URL building, config resolution, error envelopes, masking.
- `test/cli.test.js` — the real CLI binary, spawned as a child process, against the fake server.
- `test/fixtures/` — sanitized response shapes. Add fixtures instead of live calls.

New behavior needs a test. A change that cannot be asserted offline should be explained in the pull request.

## Pull request checklist

Before opening a PR:

- Run `npm test` and `npm run check`.
- Do not commit real Meta access tokens, account IDs, exports, screenshots, or client data.
- Keep the CLI read-only unless a maintainer explicitly accepts a write-capable feature proposal.
- Prefer JSON output that is easy for AI agents and shell scripts to parse.
- Document new fields or commands in both `README.md` and `SKILL.md`.

## Good first contributions

- Add more date preset examples.
- Improve error classification for Meta API responses.
- Normalize `actions` into easier-to-query fields.
- Add account-level summaries.
- Add examples for Hermes, OpenClaw, Claude Code, Cursor, and Codex workflows.
