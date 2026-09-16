# Changelog

## 0.2.0 — Maintenance pass

- Default Graph API version bumped from `v23.0` to `v26.0` (released 2026-07-29), with the version table and deprecation dates documented in the README.
- API version can now be pinned per environment (`META_API_VERSION`) or per call (`--apiVersion=v25.0`).
- Offline test suite (22 tests) that boots a local fake Graph API server: request building, version pinning, error classification, timeouts, malformed responses, account masking, and token handling. No credentials, no network.
- Configuration is resolved at call time instead of module load, so long-running agents and tests can change environment variables between requests.
- `META_API_BASE_URL` allows pointing the CLI at a proxy or a local server.
- CLI internals are exported for testing and embedding; the CLI still runs as a standalone binary.
- Ad account IDs are masked (`act_***6789`) in error output.
- CI now runs the real suite across Node 18, 20, and 22.

## 0.1.0 — Initial public OSS baseline

- Standalone Meta Ads CLI with zero runtime dependencies.
- Shell wrapper for AI agents and scripts.
- Campaign listing and campaign-level insights.
- Public README, skill instructions, security policy, contribution guide, and roadmap.
