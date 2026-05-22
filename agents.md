# tree-sitter-sql-extended — Architecture Guide

## What this repo is

A tree-sitter SQL parser forked from DerekStride/tree-sitter-sql. The upstream ships a
"permissive" SQL grammar that mixes PostgreSQL, Hive/Spark, MySQL, and MariaDB syntax into one
compiled parser. This fork extends it further with Databricks/Unity Catalog support.

The goal of the architecture work in progress is to replace the single mixed grammar with a
hierarchy of independently compiled dialect grammars using tree-sitter's `grammar(base, overrides)`
extension pattern.

---

## Grammar hierarchy (target architecture)

```
grammar.js                ← ANSI SQL base (clean, no dialect-specific rules)
  ├── spark/grammar.js    ← grammar(base, spark_rules)
  │     └── databricks/grammar.js  ← grammar(spark, databricks_rules)
  ├── postgres/grammar.js ← grammar(base, postgres_rules)
  └── mysql/grammar.js    ← grammar(base, mysql_rules)
```

Each dialect compiles to its own `<dialect>/src/parser.c` independently. Changing Databricks rules
only requires regenerating `databricks/src/parser.c` — the base and Postgres parsers are
unaffected.

**Current state**: the base grammar still contains mixed dialect rules inherited from upstream.
Migration is in progress dialect by dialect.

---

## Current directory layout

```
grammar.js                      # Entry point — spreads all rule groups
grammar/
  keywords.js                   # 500+ case-insensitive keyword regexes
  types.js                      # SQL type system (INT, VARCHAR, ARRAY, custom, etc.)
  expressions.js                # Binary/unary expressions, CASE, window functions
  helpers.js                    # make_keyword(), comma_list(), paren_list(), optional_parenthesis()
  transactions.js               # BEGIN/COMMIT/ROLLBACK
  column-lists.js               # Column definitions and constraints
  statements/
    index.js                    # Composes all statement rules; dispatch lists (_ddl_statement etc.)
    create.js                   # CREATE TABLE/VIEW/INDEX/TYPE/ROLE/SEQUENCE/EXTENSION/POLICY/TRIGGER
    alter.js                    # ALTER TABLE/VIEW/TYPE/POLICY/SEQUENCE/ROLE/INDEX/DATABASE
    drop.js                     # DROP TABLE/VIEW/INDEX/TYPE/SCHEMA/SEQUENCE/EXTENSION/FUNCTION
    select.js                   # SELECT, CTEs, window functions, joins, set operations
    insert.js                   # INSERT INTO ... VALUES / SELECT
    update.js                   # UPDATE ... SET ... WHERE
    delete.js                   # DELETE FROM
    merge.js                    # MERGE INTO ... USING ... WHEN MATCHED
    copy.js                     # PostgreSQL COPY FROM/TO
    optimize.js                 # VACUUM (PG), ANALYZE/COMPUTE STATS (Hive/Impala), OPTIMIZE (Athena)
    show.js                     # SHOW TABLES/SCHEMAS/COLUMNS
    set.js                      # SET variable = value
    refresh.js                  # REFRESH MATERIALIZED VIEW
    truncate.js                 # TRUNCATE TABLE
    rename.js                   # RENAME TABLE/COLUMN
    compound.js                 # IF/WHILE/FOR blocks
    comment.js                  # COMMENT ON ...
    create-function.js          # CREATE FUNCTION (with PG dollar-quoted body support)
    create-procedure.js         # CREATE PROCEDURE
  dialects/
    databricks/                 # Databricks/Unity Catalog extensions (active)
      index.js                  # Spreads all Databricks rule sub-modules
      vacuum.js, optimize.js, restore.js, grant.js, drop.js
      describe.js, show.js, cache.js, resource.js, call.js, create.js
    postgres/, mysql/, snowflake/, ...  # Stubs (empty) — to be replaced by dialect grammars
src/
  parser.c                      # Generated C parser (do not edit manually)
  scanner.c                     # External scanner for dollar-quoted strings
queries/
  highlights.scm                # Syntax highlighting (tree-sitter query language)
  indents.scm                   # Indentation rules
test/corpus/                    # Corpus-based tests (44 .txt files)
scripts/
  generate.js                   # Hash-cached wrapper around tree-sitter generate
  test-keywords.sh              # Validates keyword/highlights.scm sync
  bump-version.sh               # Bumps version in all 5 manifest files
bindings/                       # Node/Python/Rust/Go/Swift language bindings
.github/workflows/
  ci.yml                        # Build + test on macOS/Ubuntu/Windows
```

---

## How grammar composition works

`grammar.js` uses spread operators to compose rule groups:

```javascript
rules: {
  program: $ => ...,
  ...keyword_rules,
  ...type_rules,
  ...expression_rules,
  ...statement_rules,   // ← includes all of grammar/statements/
}
```

`grammar/statements/index.js` follows the same pattern. It spreads 17 core statement modules plus
the Databricks dialect rules, then **overrides** the dispatch lists at the end:

```javascript
// Spreads come first (define all rule names)
...create_rules,
...databricks_rules,   // ← only active dialect currently

// Overrides come last (extend dispatch lists to include dialect rules)
_ddl_statement: $ => choice(
  $._create_statement,
  ...
  $.restore_table_statement,   // ← Databricks
  $.grant_statement,           // ← Databricks
),
```

The override pattern is necessary because `choice()` must list every valid alternative explicitly.
When the multi-grammar migration is complete, dialect overrides move into each dialect's
`grammar(base, overrides)` and `statements/index.js` will only contain ANSI SQL dispatch lists.

---

## What dialect rules are currently mixed into core

| File | Mixed-in dialect rules |
|------|----------------------|
| `statements/copy.js` | 100% PostgreSQL `COPY FROM/TO` |
| `statements/optimize.js` | PG `VACUUM`, Hive `COMPUTE STATISTICS`, Athena `OPTIMIZE REWRITE`, MariaDB `OPTIMIZE TABLE` |
| `statements/create.js` | PG `CREATE EXTENSION`, `CREATE POLICY`; Hive/Spark `CLUSTERED BY`, `STORED AS`, `TBLPROPERTIES`, `ROW FORMAT`, `LOCATION` |
| `statements/alter.js` | PG `ALTER POLICY`, `ALTER TYPE` (composite attrs), RLS enable/disable; MySQL `CHANGE COLUMN`, `MODIFY COLUMN`, column `FIRST`/`AFTER` |
| `statements/drop.js` | PG `DROP EXTENSION` |
| `statements/create-function.js` | PG dollar-quoted function bodies, PG function options (`LANGUAGE`, `VOLATILE`, `STRICT`, `SECURITY DEFINER`, etc.) |

These will move into their respective dialect override grammars as migration proceeds.

---

## How to add a new SQL statement (to current base grammar)

1. **Find the file**: look in `grammar/statements/` — pick the file matching the statement type
   (e.g. `create.js` for `CREATE STREAMING TABLE`).

2. **Define the rule**:
   ```javascript
   create_streaming_table: $ => seq(
     $.keyword_create, $.keyword_streaming, $.keyword_table,
     $.object_reference,
     // ...
   ),
   ```

3. **Wire into the dispatch list** in `grammar/statements/index.js`:
   ```javascript
   _ddl_statement: $ => choice(
     $._create_statement,
     // ...
     $.create_streaming_table,  // ← add here
   ),
   ```

4. **New keywords**: add to `grammar/keywords.js` using `make_keyword()`:
   ```javascript
   keyword_streaming: _ => make_keyword("streaming"),
   ```

5. **Highlight**: add to `queries/highlights.scm`:
   ```scheme
   (keyword_streaming) @keyword
   ```

6. **Test**: `npm run generate && npm run test:corpus` — the keyword sync check in
   `test:keywords` will fail if step 5 is missing.

7. **Corpus test**: add a test case to the relevant file in `test/corpus/`.

---

## How to add a new dialect (target architecture)

1. **Create the dialect directory**:
   ```
   <dialect>/
     grammar.js          # The dialect grammar file
     grammar/            # Dialect-specific rule files
     src/                # Generated parser (created by tree-sitter generate)
     queries/highlights.scm  # Dialect-specific highlight additions
     test/corpus/        # Dialect-specific corpus tests
   ```

2. **Write `<dialect>/grammar.js`** using `grammar(parent, overrides)`:
   ```javascript
   import base from '../grammar.js'; // or '../spark/grammar.js' for Databricks

   export default grammar(base, {
     name: 'my_dialect_sql',

     conflicts: ($, original) => [
       ...original($),
       // add dialect-specific conflicts here
     ],

     rules: {
       // Override dispatch lists to include new statements
       _ddl_statement: ($, original) => choice(
         original($),        // inherits all base DDL
         $.my_new_statement,
       ),

       // Define new rules
       my_new_statement: $ => seq(
         $.keyword_my, $.keyword_statement, $.object_reference,
       ),
     },
   });
   ```

3. **Register in `tree-sitter.json`**:
   ```json
   { "name": "my_dialect_sql", "scope": "source.my_dialect.sql", "path": "my_dialect" }
   ```

4. **Generate the parser**:
   ```bash
   node scripts/generate.js my_dialect/grammar.js
   ```

5. **Add CI step** in `.github/workflows/ci.yml`:
   ```yaml
   - run: tree-sitter generate my_dialect/grammar.js
   ```

---

## Corpus test format

```
================================================================================
Test case name
================================================================================

SQL INPUT HERE

--------------------------------------------------------------------------------

(program
  (statement
    (select
      (keyword_select)
      (select_expression ...))))
```

- Section separator: `=` repeated 80 times (name above, SQL below)
- Output separator: `-` repeated 80 times
- Run `make format` to normalise spacing before committing

---

## Hash-based grammar caching

`scripts/generate.js` hashes all files in `grammar/` plus the grammar entry point. If the hash
matches `.grammar-cache/<grammar>.hash`, it skips `tree-sitter generate`. Use
`npm run generate:force` to bypass the cache. The `.grammar-cache/` directory is gitignored.

---

## Keyword sync requirement

Every keyword reachable in a parse tree (present in `src/node-types.json`) must appear as a
`@keyword` capture in `queries/highlights.scm`. The check runs automatically via
`npm run test:keywords`. If it fails:

1. Add the missing keyword to `queries/highlights.scm`: `(keyword_foo) @keyword`
2. Or if the keyword is intentionally not highlighted, re-examine whether it needs to exist

Unreachable keywords (defined in `grammar/keywords.js` but not referenced by any rule) are
excluded from the check — tree-sitter rejects query captures for unreachable node types.
