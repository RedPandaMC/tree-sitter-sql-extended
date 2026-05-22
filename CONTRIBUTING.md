# Contributing to tree-sitter-sql-extended

## Getting Started

Clone the repository and install dependencies.

```
git clone https://github.com/redpandamc/tree-sitter-sql-extended.git
cd tree-sitter-sql-extended
npm install
```

`npm install` will generate the parser from `grammar.js` and compile the Node.js binding.

## Development Workflow

### 1. Edit grammar files

Grammar source lives in `grammar/`. The entry point is `grammar.js` at the repo root.
Dialect-specific extensions live in `grammar/dialects/databricks/` (and will move to
top-level dialect directories as the multi-grammar architecture is completed — see `agents.md`).

### 2. Regenerate the parser

```bash
npm run generate
```

This uses a content hash to skip generation when grammar files haven't changed, saving ~60s
on repeated runs. To force regeneration regardless:

```bash
npm run generate:force
```

### 3. Run the tests

```bash
npm run test:corpus    # tree-sitter corpus tests (test/corpus/*.txt)
npm run test:keywords  # verify keyword/highlights.scm sync
npm run test:node      # Node.js binding test
npm test               # all three in sequence
```

### 4. Debug a parse

```bash
echo "SELECT * FROM t WHERE id = 1" | npm run parse --
npm run parse -- path/to/file.sql
```

### 5. Format test corpus

```bash
make format
```

### Corpus test format

Each file in `test/corpus/` is a suite of named test cases:

```
================================================================================
Select with WHERE
================================================================================

SELECT id, name FROM users WHERE active = true

--------------------------------------------------------------------------------

(program
  (statement
    (select
      (keyword_select)
      ...)))
```

Add new test cases to the relevant file, or create a new file for a new feature area.
Run `make format` before committing to normalise spacing.

## Adding a New SQL Statement

1. Find the right file in `grammar/statements/` (e.g. `create.js` for a new CREATE variant).
2. Add the rule definition.
3. Wire it into the relevant dispatch list in `grammar/statements/index.js`
   (e.g. `_ddl_statement`, `_drop_statement`).
4. If the statement uses new keywords, add them to `grammar/keywords.js` using `make_keyword()`.
5. Add the keyword to `queries/highlights.scm` as a `@keyword` capture.
6. Run `npm run generate && npm test` — the keyword sync check will fail if step 5 is missing.
7. Add corpus tests in `test/corpus/`.

## Adding a New SQL Dialect

See `agents.md` for the full dialect architecture. The short version:

1. Create `<dialect>/grammar.js` using tree-sitter's `grammar(parent, overrides)` pattern.
2. The parent is `grammar.js` (ANSI SQL base) or another dialect (e.g. Databricks extends Spark).
3. Add dialect-specific rule files in `<dialect>/grammar/`.
4. Register the new grammar in `tree-sitter.json` under the `grammars` array.
5. Add corpus tests in `<dialect>/test/corpus/`.
6. Add a CI step to generate and test the new grammar.

## Commit Messages

Follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>([optional scope]): <description>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `build`

Breaking AST changes must use `!` and a `BREAKING CHANGE` footer:

```
refactor(ast)!: rename foo_node to bar_node

BREAKING CHANGE: The `(foo_node)` node has been renamed to `(bar_node)`
```

## Releasing a New Version

```bash
bash scripts/bump-version.sh <version>   # bumps package.json, tree-sitter.json, Cargo.toml, pyproject.toml, CMakeLists.txt
npm run release                           # generates CHANGELOG entry and commits
git push
```

Once the PR is merged, tag the release from main:

```bash
git pull origin main
git tag v<version>
git push --tags
```

Pushing the tag triggers CI to build artifacts and publish to npm, crates.io, and PyPI.

## Github Pages (local docs preview)

```bash
cd docs/
bundle install
bundle exec jekyll serve
```

Open [localhost:4000](http://localhost:4000).
