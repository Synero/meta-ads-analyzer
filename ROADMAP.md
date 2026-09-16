# Roadmap

## v0.2.0 — Maintenance pass (current release)

- [x] Offline test suite covering request building, version pinning, errors, timeouts, and masking.
- [x] CI on GitHub Actions across Node 18, 20, and 22.
- [x] Graph API default bumped to v26.0 and documented with deprecation dates.
- [x] Per-call and per-environment API version pinning.
- [x] `META_API_BASE_URL` for proxies and local runs.
- [x] Keep the maintenance backlog visible instead of implied (this file).

## v0.3 — Better analysis primitives

- [ ] Normalize common `actions` into top-level fields: leads, messaging conversations, purchases.
- [ ] Add account summary command.
- [ ] Add campaign filters: active only, paused only, by objective.
- [ ] Add optional CSV export.
- [ ] Add safer date preset validation against Meta's documented presets.
- [ ] Extend the fixtures with more real-world response shapes (zero-delivery campaigns, restricted accounts).

## v0.4 — Agent workflow examples

- [ ] Example prompts for campaign audits.
- [ ] Hermes skill installation notes.
- [ ] OpenClaw workflow example.
- [ ] Codex maintenance workflow: issue triage, PR review, release checks.
- [ ] Scheduled check that warns when the pinned Graph API version nears deprecation.

## Non-goals for now

- Campaign mutation: create/edit/pause/delete.
- Dashboard UI.
- Storing credentials.
