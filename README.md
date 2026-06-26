<div align="center">
  <img src="src/renderer/src/assets/electron.svg" alt="Electron React Starter Kit" width="112" height="112" />

  # electron-react-starter-kit

  A secure, typed, and production-minded Electron + React starter for building cross-platform desktop apps.

  [![CI Status](https://img.shields.io/github/actions/workflow/status/AchuAshwath/electron-react-starter-kit/ci.yml?branch=main&style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/AchuAshwath/electron-react-starter-kit/actions)
  [![License](https://img.shields.io/github/license/AchuAshwath/electron-react-starter-kit?style=for-the-badge)](LICENSE)
  [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=for-the-badge&logo=git&logoColor=white)](https://conventionalcommits.org)
  [![Code Style: Biome](https://img.shields.io/badge/Code%20Style-Biome-E36D4B?style=for-the-badge&logo=biome&logoColor=white)](https://biomejs.dev)

  <br />

  <a href="https://github.com/new?template_name=electron-react-starter-kit&template_owner=AchuAshwath">Use Template</a>
  &middot;
  <a href="#quick-start">Quick Start</a>
  &middot;
  <a href="docs/README.md">Docs</a>
  &middot;
  <a href="docs/roadmap.md">Roadmap</a>
  &middot;
  <a href="docs/examples/auth-ready-architecture.md">Auth Recipe</a>
</div>

---

## Overview

`electron-react-starter-kit` is a desktop application template for teams that want the Electron security and platform plumbing handled before product work begins.

It ships a preload-first architecture, typed IPC, provider-neutral auth, secure credential storage, TanStack Router and Query, route error boundaries, persisted settings, desktop-aware theming, native file dialogs, notifications, logging, tests, and packaging scripts. Use it from GitHub with the **Use this template** button, then adapt the app-specific pieces for your client or product. The README is the polished front door; the implementation manual lives in [`docs/`](docs/README.md).

## Built With

Discover the core stack driving this starter template:

| Technology | Badge | Purpose |
| :--- | :--- | :--- |
| **Electron** | ![Electron](https://img.shields.io/badge/Electron-v39-47848F?style=flat-square&logo=electron&logoColor=white) | Cross-platform desktop runtime |
| **React** | ![React](https://img.shields.io/badge/React-v19-20232A?style=flat-square&logo=react&logoColor=61DAFB) | Component-driven renderer UI |
| **TypeScript** | ![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6?style=flat-square&logo=typescript&logoColor=white) | Static typing across main, preload, and renderer code |
| **Vite / electron-vite** | ![Vite](https://img.shields.io/badge/Vite-v7-646CFF?style=flat-square&logo=vite&logoColor=white) | Fast development server and production bundling |
| **TanStack Router** | ![TanStack Router](https://img.shields.io/badge/TanStack%20Router-v1-FF4154?style=flat-square&logo=reactrouter&logoColor=white) | Type-safe file-based routing and layouts |
| **TanStack Query** | ![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-FF4154?style=flat-square&logo=reactquery&logoColor=white) | Async state, caching, and IPC-backed queries |
| **Tailwind CSS** | ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | Utility-first styling foundation |
| **shadcn/ui** | ![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-components-000000?style=flat-square) | Accessible component primitives styled with Tailwind CSS |
| **electron-store** | ![electron-store](https://img.shields.io/badge/electron--store-settings-47848F?style=flat-square&logo=electron&logoColor=white) | Main-process persistence for normal user preferences |
| **electron-log** | ![electron-log](https://img.shields.io/badge/electron--log-observability-47848F?style=flat-square&logo=electron&logoColor=white) | Main-process diagnostics and production log files |
| **Zod** | ![Zod](https://img.shields.io/badge/Zod-validation-3068B7?style=flat-square) | Runtime validation for IPC payloads and settings contracts |
| **Vitest** | ![Vitest](https://img.shields.io/badge/Vitest-tests-6E9F18?style=flat-square&logo=vitest&logoColor=white) | Unit, hook, and component tests |
| **Biome** | ![Biome](https://img.shields.io/badge/Biome-v2-E36D4B?style=flat-square&logo=biome&logoColor=white) | Formatting, linting, and import organization |

## Feature Highlights

**Secure Electron foundation**

- Secure `BrowserWindow` defaults with context isolation, sandboxing, and disabled renderer Node.js integration.
- Restrictive CSP, blocked navigation, filtered external URLs, and default-deny permission prompts.
- Trusted IPC sender validation before main-process handlers run.

**Typed app architecture**

- Preload-only `window.api` surface for renderer access to Electron capabilities.
- Typed IPC registrar with Zod input validation and renderer-safe error messages.
- TanStack Router file routes with `(auth)` and guarded `(app)` layout groups.
- Root, auth, and app route error/pending/not-found fallbacks.
- TanStack Query factories and hooks for IPC-backed renderer state.
- Provider-neutral auth session contract backed by a replaceable development auth provider.
- Main-process secure storage for durable provider credential metadata.

**Desktop platform features**

- Main-process settings persistence with `electron-store`.
- Desktop-aware theme switching through Electron `nativeTheme`.
- Native open/save dialogs, drag/drop path resolution, and reusable file upload UI.
- Native notification preference, support checks, and focus-aware delivery.
- Safe window bounds restore with off-screen fallback and debounced persistence.

**Production workflow**

- Scoped main-process logging and sanitized Electron event logging.
- Vitest, Testing Library, jsdom, coverage, Biome, Husky, and commitlint.
- electron-builder scripts for Windows, macOS, and Linux packages.

## Quick Start

### Prerequisites

- Node.js 22 or newer
- pnpm 10 or newer

### Create From The Template

On GitHub, click **Use this template** to create a new repository with this starter as the base.

Direct template link:

[Create a repository from this template](https://github.com/new?template_name=electron-react-starter-kit&template_owner=AchuAshwath)

After creating your repository:

```bash
git clone https://github.com/<your-org>/<your-new-repo>.git
cd <your-new-repo>
pnpm install
pnpm dev
```

### Clone This Repository Directly

Use this path only when contributing to the starter itself:

```bash
git clone https://github.com/AchuAshwath/electron-react-starter-kit.git
cd electron-react-starter-kit
pnpm install
pnpm dev
```

### Common Scripts

```bash
pnpm dev           # Start the Electron app in development mode
pnpm build         # Typecheck and build production bundles
pnpm test          # Run unit and component tests
pnpm lint          # Run Biome checks
pnpm format:check  # Verify formatting
pnpm ci            # Run the full local verification chain
```

## Documentation

Core docs describe features that are already wired into the starter:

- [Documentation index](docs/README.md) for the full reading order.
- [TanStack Router](docs/tanstack-router.md), [Error Boundaries](docs/error-boundaries.md), [Auth Routing](docs/auth-routing.md), [Auth Session Contract](docs/auth-session-contract.md), [Secure Storage](docs/secure-storage.md), [TanStack Query](docs/tanstack-query.md), and [UI Foundation](docs/ui-foundation.md) for renderer app architecture.
- [System Info](docs/system-info.md) for the smallest complete IPC + Query example.
- [Typed IPC](docs/typed-ipc.md) and [Electron Security](docs/electron-security.md) for the main/preload/renderer boundary.
- [Settings](docs/settings.md), [Theme](docs/theme.md), [File Dialogs and Upload](docs/file-dialogs-and-upload.md), [Notifications](docs/notifications.md), and [Window State](docs/window-state.md) for shipped platform features.
- [Logging](docs/logging.md), [Testing](docs/testing.md), and [Packaging](docs/packaging.md) for production workflow.

Optional recipes live in [`docs/examples/`](docs/examples/). They are intentionally not installed behavior because they depend on app, client, provider, backend, or deployment decisions:

- [Auth-ready architecture](docs/examples/auth-ready-architecture.md)
- [Imported file workflow](docs/examples/imported-file-workflow.md)
- [Auto-update](docs/examples/auto-update.md)
- [Distribution hardening](docs/examples/distribution-hardening.md)

## Project Structure

```text
.
|-- build/                   # Platform icons, entitlements, and build resources
|-- docs/                    # Core starter guides
|   `-- examples/            # Optional recipes and implementation specs
|-- resources/               # Runtime app assets
|-- src/
|   |-- main/                # Electron lifecycle, IPC handlers, platform services
|   |-- preload/             # Typed contextBridge API exposed to the renderer
|   `-- renderer/            # React app, routes, hooks, query factories, UI
|-- electron-builder.yml     # Packaging configuration
|-- electron.vite.config.ts  # Main, preload, and renderer build configuration
`-- vitest.config.ts         # Test configuration
```

## Roadmap

The roadmap is split into core starter work and optional recipes.

Core infrastructure next:

- Typed environment/configuration guidance.
- Reliability polish around crash recovery, abnormal exits, and support diagnostics.
- More provider lifecycle examples built on the shipped auth contract.

Optional recipes next:

- Optional provider recipes for Microsoft Entra/MSAL, Google, Auth0/Okta, activation-code, or custom backend auth.
- Durable imported-file workflow.
- Auto-update flow.
- Distribution hardening checklist.

See the full [roadmap](docs/roadmap.md).

## Design Principle

Core starter features should be useful to almost every serious Electron app. Provider-specific auth, auto-update publishing, durable file imports, and distribution hardening details are documented as recipes so each client app can make the right deployment and product choices.
