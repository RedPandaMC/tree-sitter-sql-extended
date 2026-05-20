# tree-sitter-sql-extended

A fork of [DerekStride/tree-sitter-sql](https://github.com/DerekStride/tree-sitter-sql) extended with
Databricks-specific DDL, Apache Spark SQL constructs, and Unity Catalog statements.

Used as the SQL parser backend for [burnt](https://github.com/RedPandaMC/burnt) — a cost compiler and
linter for Spark pipelines.

---

## What's different from upstream

The upstream grammar covers standard SQL (SELECT, INSERT, CREATE TABLE, etc.) and common extensions well.
This fork adds constructs that Databricks and Spark users write every day but that the upstream grammar
does not yet parse:

| Category | Examples |
|----------|---------|
| Delta / DLT | `CREATE STREAMING TABLE`, `CREATE LIVE TABLE`, `OPTIMIZE … ZORDER BY`, `VACUUM RETAIN`, `RESTORE TABLE`, `CONVERT TO DELTA`, `REORG TABLE … APPLY (PURGE)` |
| Spark SELECT | `FOR VERSION AS OF` / `FOR TIMESTAMP AS OF` time travel, `QUALIFY`, `PIVOT` / `UNPIVOT`, `LATERAL VIEW`, `SORT BY` / `CLUSTER BY` / `DISTRIBUTE BY` |
| Unity Catalog | `CREATE/ALTER/DROP CATALOG`, `CREATE/DROP VOLUME`, `CREATE EXTERNAL LOCATION`, `GRANT … ON … TO`, `REVOKE`, `SHOW CATALOGS`, `USE CATALOG`, `SET CATALOG` |
| Iceberg | Partition transforms (`bucket()`, `year()`, `hour()`…), branch/tag DDL, `ALTER TABLE … REPLACE COLUMNS`, `CALL catalog.system.*` |
| Procedural | `BEGIN … END`, `IF … END IF`, `FOR … END FOR`, `WHILE … END WHILE`, `EXECUTE IMMEDIATE` |

See the [grammar extension tracker (issue #1)](https://github.com/RedPandaMC/tree-sitter-sql-extended/issues/1) for the full issue list and implementation status.

---

## Using in Rust

```toml
# Cargo.toml
[dependencies]
tree-sitter-sql-extended = { git = "https://github.com/RedPandaMC/tree-sitter-sql-extended", branch = "main" }
tree-sitter = "0.25"
```

```rust
use tree_sitter_sql_extended::LANGUAGE;

let mut parser = tree_sitter::Parser::new();
parser.set_language(&LANGUAGE.into()).unwrap();

let tree = parser.parse(sql_source, None).unwrap();
// tree is valid even on syntax errors — partial results, not None
```

The parser degrades gracefully: a syntax error in one statement produces an `ERROR` node; the rest of the
file continues to parse normally.

---

## Development

### Prerequisites

```bash
npm install -g tree-sitter-cli
```

### Workflow

```bash
# After editing grammar/grammar.js or grammar/statements/*.js:
tree-sitter generate

# Run all corpus tests
tree-sitter test

# Test a specific file
tree-sitter test --include "select_spark"

# Inspect parse output for a snippet
echo "OPTIMIZE my_table ZORDER BY (id)" | tree-sitter parse /dev/stdin
```

Grammar statements are split across `grammar/statements/*.js`. Adding a new construct usually means:
1. Editing the relevant `*.js` file (or creating a new one for a new statement class)
2. Adding an entry to `grammar/statements/index.js`
3. Running `tree-sitter generate`
4. Adding corpus tests in `test/corpus/<file>.txt`
5. Running `tree-sitter test`

See [CONTRIBUTING.md](CONTRIBUTING.md) for more detail.

---

## Upstream

This fork tracks [`DerekStride/tree-sitter-sql`](https://github.com/DerekStride/tree-sitter-sql). Upstreaming
Databricks-specific extensions is encouraged where the upstream maintainers are interested; extensions that are
too vendor-specific will live here permanently.

---

## References

- [Wikipedia SQL syntax](https://en.wikipedia.org/wiki/SQL_syntax)
- [Databricks SQL reference](https://docs.databricks.com/en/sql/language-manual/index.html)
- [Apache Spark SQL reference](https://spark.apache.org/docs/latest/sql-ref.html)
- [Unity Catalog SQL reference](https://docs.databricks.com/en/data-governance/unity-catalog/index.html)
- [Apache Iceberg Spark procedures](https://iceberg.apache.org/docs/latest/spark-procedures/)
- [PostgreSQL syntax](https://www.postgresql.org/docs/current/sql-commands.html)

### Other SQL tree-sitter grammars

- [DerekStride/tree-sitter-sql](https://github.com/DerekStride/tree-sitter-sql) — upstream
- [takegue/tree-sitter-sql-bigquery](https://github.com/takegue/tree-sitter-sql-bigquery) — BigQuery fork (same pattern as this repo)
- [m-novikov/tree-sitter-sql](https://github.com/m-novikov/tree-sitter-sql)
