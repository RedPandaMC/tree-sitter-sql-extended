# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.3.11](https://github.com/redpandamc/tree-sitter-sql-extended/releases/tag/v0.3.11) (2026-05-23)

### Features

- Multi-dialect grammar architecture: clean ANSI SQL base with independently compiled dialect extensions for Spark/Hive, Databricks/Unity Catalog, PostgreSQL, and MySQL
- Hash-based grammar caching (`scripts/generate.js`) — skips `tree-sitter generate` when sources are unchanged
- Per-dialect test corpora in `<dialect>/test/corpus/`
- `scripts/bump-version.sh`: single command to sync version across all 5 manifests
- `agents.md`: architecture guide for grammar composition and dialect extension
