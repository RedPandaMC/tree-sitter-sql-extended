#!/usr/bin/env python3
"""
Differential parse: compare tree-sitter AST structure against SQLGlot AST.

For each SQL statement, parses with both engines and reports where the
top-level statement types diverge. A high divergence rate suggests grammar
rules that model the wrong structure.

This is an informational tool — it does not gate PRs. Run it periodically
or nightly to track structural alignment with the SQLGlot reference.

Usage:
  python tools/diff_parse.py --dialect spark [--verbose] [--limit 200]

Options:
  --dialect DIALECT    SQLGlot dialect (spark, databricks, snowflake, ...)
  --verbose            Show individual divergences
  --limit N            Only process first N statements (default: all)
  --threshold FLOAT    Print warning if divergence exceeds threshold (default: 0.15)

Exit code: always 0 (informational only).
"""

import argparse
import re
import sys
import urllib.request
from pathlib import Path

SQLGLOT_BASE = "https://raw.githubusercontent.com/tobymao/sqlglot/main/tests/dialects"
CACHE_DIR = Path("/tmp/ts-sql-parse-rate-cache")

# Mapping from tree-sitter top-level node types → SQLGlot Expression class names.
# Extend this as more grammar rules are added.
NODE_MAP: dict[str, set[str]] = {
    "select":               {"Select"},
    "insert":               {"Insert"},
    "update":               {"Update"},
    "delete":               {"Delete"},
    "merge":                {"Merge"},
    "create_table":         {"Create"},
    "create_view":          {"Create"},
    "create_index":         {"Create"},
    "alter_table":          {"AlterTable", "Alter"},
    "drop_table":           {"Drop"},
    "truncate":             {"TruncateTable"},
    "_vacuum_table":        {"Command"},
    "restore_table_statement": {"Command"},
    "convert_to_delta_statement": {"Command"},
    "fsck_repair_statement": {"Command"},
    "reorg_table_statement": {"Command"},
    "generate_statement":   {"Command"},
    "msck_repair_statement": {"Command"},
    "grant_statement":      {"Grant"},
    "revoke_statement":     {"Revoke"},
    "_spark_analyze":       {"Command", "Analyze"},
    "_delta_optimize":      {"Command", "Optimize"},
}

MIN_SQL_LEN = 10

_SQL_PATTERNS = [
    r'(?:expression|parse_one|transpile|validate_identity)\(\s*"((?:[^"\\]|\\.)+)"',
    r"(?:expression|parse_one|transpile|validate_identity)\(\s*'((?:[^'\\]|\\.)+)'",
    r'\bsql\s*=\s*"((?:[^"\\]|\\.)+)"',
    r"\bsql\s*=\s*'((?:[^'\\]|\\.)+)'",
]

_SQL_KW = re.compile(
    r'\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|MERGE|VACUUM|OPTIMIZE|RESTORE|GRANT|REVOKE|ANALYZE|TRUNCATE|SHOW|DESCRIBE|EXPLAIN)\b',
    re.IGNORECASE,
)


def fetch_or_cached(dialect: str) -> str:
    filename = f"test_{dialect}.py"
    cache_path = CACHE_DIR / filename
    if cache_path.exists():
        return cache_path.read_text()
    url = f"{SQLGLOT_BASE}/{filename}"
    print(f"Fetching {url} …")
    with urllib.request.urlopen(url, timeout=30) as resp:
        content = resp.read().decode("utf-8")
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(content)
    return content


def extract_sql_strings(source: str) -> list[str]:
    seen: set[str] = set()
    results = []
    for pattern in _SQL_PATTERNS:
        for m in re.finditer(pattern, source):
            text = m.group(1).strip().replace("\\n", "\n").replace('\\"', '"')
            if len(text) >= MIN_SQL_LEN and text not in seen and _SQL_KW.search(text):
                seen.add(text)
                results.append(text)
    return results


def ts_top_node(parser, sql: str) -> str:
    tree = parser.parse(sql.encode())
    root = tree.root_node
    for child in root.children:
        if child.type == "statement":
            for grandchild in child.children:
                if not grandchild.type.startswith("keyword_") and grandchild.type != ";":
                    return grandchild.type
    return root.type


def sqlglot_top_class(sql: str, dialect: str) -> str:
    try:
        import sqlglot
        stmts = sqlglot.parse(sql, dialect=dialect, error_level=sqlglot.ErrorLevel.IGNORE)
        if stmts:
            return type(stmts[0]).__name__
    except Exception:
        pass
    return "?"


def main() -> int:
    ap = argparse.ArgumentParser(description="Differential parse: tree-sitter vs SQLGlot")
    ap.add_argument("--dialect", required=True)
    ap.add_argument("--verbose", action="store_true")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--threshold", type=float, default=0.15)
    args = ap.parse_args()

    try:
        import tree_sitter_sql as ts_sql
        from tree_sitter import Language, Parser
    except ImportError:
        print("ERROR: tree-sitter Python bindings not installed.", file=sys.stderr)
        sys.exit(2)

    try:
        import sqlglot  # noqa: F401
    except ImportError:
        print("ERROR: sqlglot not installed. Run: pip install sqlglot", file=sys.stderr)
        sys.exit(2)

    source = fetch_or_cached(args.dialect)
    statements = extract_sql_strings(source)
    if args.limit:
        statements = statements[:args.limit]

    lang = Language(ts_sql.language())
    ts_parser = Parser(lang)

    matched = 0
    diverged = 0
    skipped = 0
    divergences = []

    for sql in statements:
        ts_node = ts_top_node(ts_parser, sql)
        sg_class = sqlglot_top_class(sql, args.dialect)

        if sg_class == "?":
            skipped += 1
            continue

        # Check if ts_node maps to the sqlglot class
        expected = NODE_MAP.get(ts_node, set())
        if sg_class in expected or not expected:
            matched += 1
        else:
            diverged += 1
            divergences.append((ts_node, sg_class, sql))

    total_compared = matched + diverged
    if total_compared == 0:
        print("No comparable statements found.")
        return 0

    rate = diverged / total_compared
    print(f"\n[diff_parse] {args.dialect}: {matched}/{total_compared} matched, {diverged} diverged = {rate:.1%} divergence")
    print(f"  (skipped {skipped} statements SQLGlot could not parse)")

    if divergences and args.verbose:
        print(f"\nTop divergences ({min(len(divergences), 20)} of {len(divergences)}):")
        for ts_node, sg_class, sql in divergences[:20]:
            short = sql[:100].replace("\n", " ")
            print(f"  ts:{ts_node}  sg:{sg_class}  sql: {short}")

    if rate > args.threshold:
        print(f"\nWARN: {rate:.1%} divergence exceeds {args.threshold:.0%} threshold.")
        print("Consider extending NODE_MAP or reviewing the grammar rule structure.")
    else:
        print(f"OK: divergence {rate:.1%} is within the {args.threshold:.0%} threshold.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
