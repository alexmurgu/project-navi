# AGENTS.md

## Task Completion Requirements

- All of `bun run format`, `bun run lint` must pass before considering tasks completed.

## Project Snapshot

NAVI is a finance tracker for a single household. The app runs locally and is intended to be run by a single family group. It tracks expenses and income and provides insights into spending patterns.

The app is meant to be used mostly on mobile devices. It is a PWA and can be installed on a mobile device.

The app uses shadcn components with baseui as its design system.

This repository is a WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures (session restarts, reconnects, partial streams).

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there is shared logic that can be extracted to a separate module. Duplicate logic across multiple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.
