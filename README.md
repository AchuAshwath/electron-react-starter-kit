# electron-react-starter-kit

An Electron starter template with React, TypeScript, Biome, and Git hooks.

## Features

- Electron main, preload, and renderer process split
- React 19 + TypeScript renderer
- electron-vite for fast local dev and builds
- Biome for formatting, linting, and import organization
- Husky pre-commit, pre-push, and commit-message hooks
- lint-staged for staged-file checks
- commitlint for Conventional Commits
- GitHub Actions CI for repo-wide validation
- Electron Builder scripts for desktop packaging

## Tech Stack

- Electron
- React
- TypeScript
- Vite / electron-vite
- Biome
- Husky
- lint-staged
- commitlint
- electron-builder

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm format:check
pnpm typecheck
pnpm ci
```

## Git Workflow

- `pre-commit`: runs `lint-staged` on staged files
- `commit-msg`: enforces Conventional Commits
- `pre-push`: runs lint, format checks, and typecheck
- CI repeats the same checks on push and pull request

Example commit:

```bash
git commit -m "feat: add app shell"
```

## Roadmap

Features move between these sections as PRs land and releases ship.

### Release 0.1

- [x] Electron + React + TypeScript starter
- [x] Biome linting and formatting
- [x] Husky and lint-staged guardrails
- [x] Commitlint and Conventional Commits
- [x] CI checks for lint, format, typecheck, and build

### Release 0.2

- [x] UI baseline with shadcn/ui and core layout shell
- [x] Component library integration and theming
- [x] Basic UI polish and placeholders

### Release 0.3

- [ ] TanStack Router setup with app shell and routes
- [ ] Route-level layouts and navigation structure

### Release 0.4

- [ ] TanStack Query setup with IPC-backed fetchers
- [ ] Renderer data patterns and loading states

### Release 0.5

- [ ] Secure storage via electron-store + safe storage
- [ ] Session/bootstrap flow and auth guard patterns
- [ ] Preload API typing enhancements

### Release 1.0

- [ ] Production-ready packaging flow
- [ ] Template documentation finalized
- [ ] Stable starter template release

## Development Notes

This repo is actively being developed as a starter template. Roadmap items may shift between releases as PRs land.
