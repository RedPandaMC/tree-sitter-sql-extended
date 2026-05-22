#!/usr/bin/env python3
"""
SQLGlot corpus parse-rate tool.

Downloads SQLGlot's dialect test files and measures what percentage of SQL
statements in them our tree-sitter grammar can parse without ERROR nodes.

Usage:
  python tools/parse_rate.py --dialect spark [--threshold 0.80] [--verbose]

Options:
  --dialect DIALECT     SQLGlot dialect name (spark, databricks, hive, ...)
  --threshold FLOAT     Minimum pass-rate to exit 0 (default 0.80)
  --verbose             Print each failing statement
  --no-download         Use cached file in /tmp if available (skip HTTP)

The tool fetches:
  https://raw.githubusercontent.com/tobymao/sqlglot/main/tests/dialects/test_{dialect}.py

It extracts SQL strings using heuristic regex patterns and then parses each
with the tree-sitter Python bindings for this grammar.

KPI reference (from research doc):
  Experimental: ≥80% SQLGlot parse-rate
  Stable:       ≥95% SQLGlot parse-rate
"""

import argparse
import re
import sys
import urllib.request
from pathlib import Path

SQLGLOT_BASE = "https://raw.githubusercontent.com/tobymao/sqlglot/main/tests/dialects"
CACHE_DIR = Path("/tmp/ts-sql-parse-rate-cache")

# Patterns that extract SQL string literals from test files.
# Ordered from most to least specific.
_SQL_PATTERNS = [
    # expression("SELECT ...", dialect=...) or parse_one("...", dialect=...)
    r'(?:expression|parse_one|transpile|validate_identity)\(\s*"((?:[^"\\]|\\.)+)"',
    r"(?:expression|parse_one|transpile|validate_identity)\(\s*'((?:[^'\\]|\\.)+)'",
    # sql = "..." assignment
    r'\bsql\s*=\s*"((?:[^"\\]|\\.)+)"',
    r"\bsql\s*=\s*'((?:[^'\\]|\\.)+)'",
    # Triple-quoted SQL blocks (grab everything inside)
    r'"""([\s\S]+?)"""',
    r"'''([\s\S]+?)'''",
]

# Minimum token length: strings shorter than this are noise (column names etc.)
MIN_SQL_LEN = 10


def fetch_test_file(dialect: str, no_download: bool) -> str:
    filename = f"test_{dialect}.py"
    cache_path = CACHE_DIR / filename

    if no_download and cache_path.exists():
        return cache_path.read_text()

    url = f"{SQLGLOT_BASE}/{filename}"
    print(f"Fetching {url} …")
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            content = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        print(f"ERROR: HTTP {e.code} — dialect test file not found: {url}", file=sys.stderr)
        print("Available dialects: spark, databricks, hive, snowflake, bigquery, duckdb, tsql, mysql, postgres, redshift, trino, clickhouse")
        sys.exit(2)
    except Exception as e:
        print(f"ERROR: Failed to download {url}: {e}", file=sys.stderr)
        sys.exit(2)

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(content)
    return content


def extract_sql_strings(source: str) -> list[str]:
    candidates: set[str] = set()
    for pattern in _SQL_PATTERNS:
        for m in re.finditer(pattern, source, re.MULTILINE):
            text = m.group(1).strip()
            # Unescape simple backslash sequences
            text = text.replace("\\n", "\n").replace("\\t", "\t").replace('\\"', '"').replace("\\'", "'")
            if len(text) >= MIN_SQL_LEN:
                candidates.add(text)

    # Filter to strings that look like SQL (contain a SQL keyword)
    sql_keywords = re.compile(
        r'\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|MERGE|VACUUM|OPTIMIZE|RESTORE|GRANT|REVOKE|ANALYZE|TRUNCATE|SHOW|DESCRIBE|EXPLAIN)\b',
        re.IGNORECASE,
    )
    return [s for s in sorted(candidates) if sql_keywords.search(s)]


def load_parser():
    try:
        import tree_sitter_sql as ts_sql
        from tree_sitter import Language, Parser
    except ImportError:
        print("ERROR: tree-sitter Python bindings not installed.", file=sys.stderr)
        print("Run: pip install tree-sitter && pip install -e .", file=sys.stderr)
        sys.exit(2)

    lang = Language(ts_sql.language())
    parser = Parser(lang)
    return parser


def has_error(parser, sql: str) -> bool:
    tree = parser.parse(sql.encode())
    # Walk root for ERROR or MISSING nodes
    cursor = tree.walk()
    reached_root = False
    while True:
        node = cursor.node
        if node.type in ("ERROR", "MISSING"):
            return True
        if cursor.goto_first_child():
            continue
        if cursor.goto_next_sibling():
            continue
        # Backtrack
        while True:
            if not cursor.goto_parent():
                reached_root = True
                break
            if cursor.goto_next_sibling():
                break
        if reached_root:
            break
    return False


def main() -> int:
    parser_arg = argparse.ArgumentParser(description="SQLGlot corpus parse-rate")
    parser_arg.add_argument("--dialect", required=True)
    parser_arg.add_argument("--threshold", type=float, default=0.80)
    parser_arg.add_argument("--verbose", action="store_true")
    parser_arg.add_argument("--no-download", action="store_true")
    args = parser_arg.parse_args()

    source = fetch_test_file(args.dialect, args.no_download)
    statements = extract_sql_strings(source)

    if not statements:
        print(f"WARNING: No SQL strings extracted from test_{args.dialect}.py")
        print("The regex patterns may need tuning for this dialect's test file format.")
        return 0

    print(f"Extracted {len(statements)} SQL statements from test_{args.dialect}.py")

    ts_parser = load_parser()

    passed = 0
    failed = []
    for sql in statements:
        if has_error(ts_parser, sql):
            failed.append(sql)
        else:
            passed += 1

    total = len(statements)
    rate = passed / total
    threshold_pct = int(args.threshold * 100)
    status = "✓" if rate >= args.threshold else "✗"

    print(f"\n[parse_rate] {args.dialect}: {passed}/{total} = {rate:.1%}  {status}  (threshold: {threshold_pct}%)")

    if failed and args.verbose:
        print(f"\n{len(failed)} failures:")
        for sql in failed[:20]:
            short = sql[:120].replace("\n", " ")
            print(f"  FAILED: {short}")
        if len(failed) > 20:
            print(f"  ... and {len(failed) - 20} more")

    if rate < args.threshold:
        print(f"\nFAILED: {rate:.1%} is below the {threshold_pct}% threshold.")
        if not args.verbose and failed:
            print("Run with --verbose to see failing statements.")
        return 1

    print("OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
