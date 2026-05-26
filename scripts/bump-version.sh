#!/bin/bash
# Bump version across all manifests in one shot.
# Usage: bash scripts/bump-version.sh <version>
# Example: bash scripts/bump-version.sh 0.4.0

VERSION=$1
if [[ -z "$VERSION" ]]; then
  echo "Usage: bash scripts/bump-version.sh <version>"
  exit 1
fi

# package.json and tree-sitter.json (root + all dialects)
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" package.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" tree-sitter.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" spark/tree-sitter.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" databricks/tree-sitter.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" postgres/tree-sitter.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" mysql/tree-sitter.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" snowflake/tree-sitter.json

# Cargo.toml (first occurrence — the [package] version)
sed -i "0,/^version = .*/s/^version = .*/version = \"$VERSION\"/" Cargo.toml

# pyproject.toml
sed -i "s/^version = .*/version = \"$VERSION\"/" pyproject.toml

# CMakeLists.txt
sed -i "s/set(PROJECT_VERSION [^)]*)/set(PROJECT_VERSION $VERSION)/" CMakeLists.txt

echo "Bumped all manifests to $VERSION"
echo ""
echo "Verify with:"
echo "  grep -n 'version' package.json tree-sitter.json Cargo.toml pyproject.toml CMakeLists.txt"
