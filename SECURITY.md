# Security Policy

## Supported versions

The `main` branch is currently supported.

## Reporting a vulnerability

Please report security issues privately to the repository maintainer instead of opening a public issue with exploit details.

Include:

- affected command or file;
- what data could be exposed or modified;
- reproduction steps using fake credentials where possible;
- suggested fix, if known.

## Security model

Meta Ads Analyzer is intended to be read-only:

- It reads `META_ACCESS_TOKEN` and `META_ACCOUNT_ID` from environment variables.
- It does not store credentials.
- It does not intentionally print tokens.
- It does not mutate campaigns, ad sets, ads, budgets, or account configuration.

Downstream AI agents should treat campaign/account data as private and avoid posting raw JSON to public logs.
