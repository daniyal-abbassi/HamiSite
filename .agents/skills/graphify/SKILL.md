---
name: graphify
description: Knowledge graph navigation, query, and relationship analysis for the HAMI codebase using graphify. Use when analyzing architecture, finding connection paths between symbols or files, understanding god nodes, or updating the graph after changes.
---

# Graphify: Codebase Knowledge Graph Navigation

This project has an AST-generated knowledge graph at `graphify-out/` with god nodes, community hubs, and cross-file relationships.

## Rules & Workflow
- For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists.
- Use `graphify path "<A>" "<B>"` for relationships between two symbols or files.
- Use `graphify explain "<concept>"` for focused concepts.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, fast, no API cost).
- Read `graphify-out/GRAPH_REPORT.md` for broad architecture reviews.

