<div align="center">
  <img src="src/renderer/src/assets/electron.svg" alt="Electron React Logo" width="120" height="120" />
  
  # electron-react-starter-kit
  
  An enterprise-grade, high-performance GitHub template for building cross-platform desktop applications using **Electron**, **React 19**, **TypeScript**, and modern **TanStack** state & routing systems.

  [![CI Status](https://img.shields.io/github/actions/workflow/status/AchuAshwath/electron-react-starter-kit/ci.yml?branch=main&style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/AchuAshwath/electron-react-starter-kit/actions)
  [![License](https://img.shields.io/github/license/AchuAshwath/electron-react-starter-kit?style=for-the-badge)](LICENSE)
  [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=for-the-badge&logo=git&logoColor=white)](https://conventionalcommits.org)
  [![Code Style: Biome](https://img.shields.io/badge/Code%20Style-Biome-E36D4B?style=for-the-badge&logo=biome&logoColor=white)](https://biomejs.dev)
</div>

---

## 🚀 Built With

Discover the core stack driving this starter template:

| Technology | Badge | Purpose |
| :--- | :--- | :--- |
| **Electron** | ![Electron](https://img.shields.io/badge/Electron-v39-47848F?style=flat-square&logo=electron&logoColor=white) | Cross-platform desktop runtime framework |
| **React** | ![React](https://img.shields.io/badge/React-v19-20232A?style=flat-square&logo=react&logoColor=61DAFB) | Dynamic and declarative component UI library |
| **TypeScript** | ![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6?style=flat-square&logo=typescript&logoColor=white) | Static typing for enterprise-grade predictability |
| **Vite** | ![Vite](https://img.shields.io/badge/Vite-v7-646CFF?style=flat-square&logo=vite&logoColor=white) | Ultra-fast local dev server and assets build pipeline |
| **TanStack Router** | ![TanStack Router](https://img.shields.io/badge/TanStack%20Router-v1-FF4154?style=flat-square&logo=react&logoColor=white) | Fully type-safe, file-based routing and layout management |
| **TanStack Query** | ![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-FF4154?style=flat-square&logo=react&logoColor=white) | Asynchronous state, loading states, and robust query caching |
| **Tailwind CSS** | ![Tailwind CSS](https://img.shields.io/badge/Tailwind--CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | Utility-first styling with the modern Tailwind v4 compilation |
| **Biome** | ![Biome](https://img.shields.io/badge/Biome-v2-E36D4B?style=flat-square&logo=biome&logoColor=white) | Blazing fast replacement for ESLint, Prettier, and import organization |

---

## ✨ Features Checklist

* ⚡️ **electron-vite Integration**: Fast Hot Module Replacement (HMR) in renderer and hot-reload in main process.
* 🛡️ **Secure Context Bridge**: Securely isolated main and renderer processes using `contextBridge` to mitigate XSS risks.
* 📦 **Modular Query Factories**: Scalable hierarchy of queries and hooks grouped by feature domain (TkDodo pattern).
* 🗂 **File-Based Routing**: Type-safe layout, nested routes, and automated routing tree generation via TanStack Router.
* 🎨 **Modern Theming (Shadcn/ui)**: Clean base system with Tailwind v4 styling, customized dark/light layout, and standard UI blocks.
* 🛠 **Git Guardrails & Hooks**: Automated staging checks (`lint-staged`), Conventional Commits verification (`commitlint`), and git hooks (`Husky`).
* 🤖 **Continuous Integration**: Seamless GitHub Actions workflow verifying formatting, linting, types, and builds.
* 📦 **Desktop Packaging**: Ready-to-go `electron-builder` configuration for building production Windows, macOS, and Linux apps.

---

## 📂 Project Structure

```text
.
├── .github/workflows/ci.yml   # Automatic lint, check, and build verification
├── .husky/                    # Commit-message, pre-commit, and pre-push hooks
├── resources/                 # Static branding assets (app icons)
├── src/
│   ├── main/
│   │   └── index.ts           # Electron main process (lifecycle & IPC handlers)
│   ├── preload/
│   │   ├── index.ts           # Exposes secure contextBridge APIs to the renderer
│   │   └── index.d.ts         # Global window typescript definitions
│   └── renderer/
│       ├── index.html         # Main app HTML window container
│       └── src/
│           ├── main.tsx       # Renderer app entry point
│           ├── env.d.ts       # Global build environmental typings
│           ├── routeTree.gen.ts # Router auto-generated routing tree
│           ├── assets/        # Styles, icons, and theme configuration
│           ├── components/    # Reusable shared components
│           ├── core/
│           │   └── system/    # Domain-specific Query Factory (queries, hooks, types)
│           ├── lib/
│           │   ├── query-client.ts # Configured React Query client configuration
│           │   └── utils.ts   # Style merging utilities
│           └── routes/        # Layout and route components
├── tsconfig.json              # TypeScript workspace compiler settings
├── biome.json                 # Formatting and linting configuration
└── electron-builder.yml       # Production packaging options
```

---

## 🛠 Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) (v22 or newer) and [pnpm](https://pnpm.io/) (v10 or newer) installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AchuAshwath/electron-react-starter-kit.git
   cd electron-react-starter-kit
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start local development:**
   ```bash
   pnpm dev
   ```

---

## 🔄 IPC & Querying Architecture

This starter kit implements the **TkDodo Query Factory pattern** for seamless and type-safe main-to-renderer communication.

```mermaid
sequenceDiagram
    participant Component as React Component
    participant Hook as Domain Hook (useSystemInfo)
    participant Query as Query Factory (systemQueries)
    participant Bridge as Preload contextBridge (window.api)
    participant Main as Main Process (ipcMain.handle)

    Component->>Hook: Invokes hook
    Hook->>Query: Retrieves queryOptions
    Query->>Bridge: Calls api.getSystemInfo()
    Bridge->>Main: ipcRenderer.invoke("get-system-info")
    Main-->>Bridge: Returns system configuration data
    Bridge-->>Query: Propagates promise response
    Query-->>Hook: Updates query status state
    Hook-->>Component: Re-renders with fresh data
```

### Adding a New IPC Route & Query

1. **Expose IPC endpoint in `src/main/index.ts`:**
   ```typescript
   ipcMain.handle("get-custom-data", async (_, args) => {
       return { success: true, data: "Hello World" };
   });
   ```

2. **Add preload bridge in `src/preload/index.ts` & `index.d.ts`:**
   ```typescript
   // index.ts
   const api = {
       getCustomData: () => ipcRenderer.invoke("get-custom-data"),
   };
   
   // index.d.ts
   interface Window {
       api: {
           getCustomData: () => Promise<{ success: boolean; data: string }>;
       };
   }
   ```

3. **Incorporate into Domain Query Factory (`src/renderer/src/core/system/`)**:
   ```typescript
   export const systemQueries = {
       // ...
       customData: () =>
           queryOptions({
               queryKey: [...systemQueries.all(), "custom"],
               queryFn: () => window.api.getCustomData(),
                staleTime: 60 * 1000, // cache fresh for 1 minute
            }),
    };
    ```

---

## User Settings Storage

User preferences are persisted in the Electron main process with `electron-store`. Renderer code does not read or write storage directly; it talks to the typed preload API, which forwards requests to validated IPC handlers.

```mermaid
sequenceDiagram
    participant Component as React Component
    participant Hook as Settings Hook
    participant Query as Query Factory
    participant Bridge as Preload API
    participant Main as Main IPC Handler
    participant Store as electron-store

    Component->>Hook: useSettings()
    Hook->>Query: settingsQueries.current()
    Query->>Bridge: window.api.settings.get()
    Bridge->>Main: ipcRenderer.invoke("settings:get")
    Main->>Store: getSettings()
    Store-->>Main: UserSettings
    Main-->>Bridge: UserSettings
    Bridge-->>Query: UserSettings
    Query-->>Hook: cached settings
    Hook-->>Component: render settings state
```

Settings updates are validated with Zod at the IPC boundary before they reach persistence:

```typescript
ipcMain.handle(settingsIpcChannels.update, (_, patch: unknown) => {
    const parsedPatch = userSettingsPatchSchema.parse(patch);

    return updateSettings(parsedPatch);
});
```

Normal user preferences such as theme choice, window bounds, and startup options belong in `electron-store`. Sensitive values such as access tokens, refresh tokens, API keys, and passwords should live in a separate secret-storage module backed by Electron `safeStorage`.

---

## Theme Switching

Theme switching follows the same IPC and Query Factory architecture as settings, with Electron's `nativeTheme` acting as the desktop-aware source for resolving system preference.

```mermaid
sequenceDiagram
    participant Switcher as ThemeSwitcher
    participant Provider as ThemeProvider
    participant Query as Theme Query
    participant Bridge as Preload API
    participant Main as Theme IPC Handler
    participant Native as Electron nativeTheme
    participant Store as electron-store

    Switcher->>Provider: setTheme("dark")
    Provider->>Query: mutate preference
    Query->>Bridge: window.api.theme.setPreference("dark")
    Bridge->>Main: ipcRenderer.invoke("theme:set-preference")
    Main->>Store: persist settings.theme
    Main->>Native: nativeTheme.themeSource = "dark"
    Main-->>Bridge: ThemeState
    Bridge-->>Provider: cached ThemeState
    Provider->>Provider: apply .dark to documentElement
```

The renderer does not duplicate persisted theme state in `localStorage`. The main process reads `settings.theme`, asks Electron to resolve the final light or dark mode, and sends a typed `ThemeState` through preload:

```typescript
type ThemeState = {
    preference: "system" | "light" | "dark";
    resolvedTheme: "light" | "dark";
    systemPrefersDark: boolean;
};
```

To reduce first-paint flicker, the main process passes the initial theme state into the renderer URL before the window loads. The renderer seeds React Query from that value and applies the shadcn-compatible `light` or `dark` class before React renders. Runtime OS theme changes are delivered through `window.api.theme.onUpdated`, which returns an unsubscribe callback for React effects.

Theme tests live beside the files they cover: main-process service tests cover `nativeTheme` integration, query tests cover preload calls, and provider/component tests cover root class application and user interaction.

---

## 📜 Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `pnpm dev` | `electron-vite dev` | Starts development server with HMR and Hot Reload |
| `pnpm build` | `npm run typecheck && electron-vite build` | Compiles processes and tests type safety |
| `pnpm lint` | `biome check .` | Runs high-speed linting and analysis checks |
| `pnpm format` | `biome format --write .` | Formats all workspace source files |
| `pnpm typecheck` | `typecheck:node && typecheck:web` | Validates TypeScript compliance across all processes |
| `pnpm test` | `vitest run` | Runs the unit test suite once |
| `pnpm test:watch` | `vitest` | Starts Vitest in watch mode for local development |
| `pnpm test:coverage` | `vitest run --coverage` | Runs unit tests and writes a V8 coverage report |
| `pnpm ci` | `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build` | Local verification mimicking full CI run |

---

## Testing Convention

Tests live beside the source files they cover using the `*.test.ts` or `*.test.tsx` suffix. This keeps behavior, implementation, and regression coverage easy to review together as each feature grows.

```text
src/renderer/src/lib/utils.ts
src/renderer/src/lib/utils.test.ts

src/renderer/src/core/system/system.queries.ts
src/renderer/src/core/system/system.queries.test.ts

src/renderer/src/core/system/system.hooks.ts
src/renderer/src/core/system/system.hooks.test.tsx
```

For TkDodo-style Query Factories, test the query key hierarchy and the preload bridge call beside the query file. Hook and component tests should use Testing Library with a fresh `QueryClient` per test from `src/renderer/src/test/render.tsx`.

---

## 📅 Roadmap

- [x] Electron + React 19 + TypeScript base split
- [x] Biome rapid code styling lint & format setup
- [x] Fully integrated Husky, lint-staged, and commitlint commit guardrails
- [x] GitHub Actions CI automated pipeline setup
- [x] Responsive layout shell using shadcn/ui components
- [x] File-based routing via TanStack Router
- [x] TkDodo modular Query Factory pattern with TanStack Query
- [x] Establish Vitest + Testing Library unit test suite
- [x] Implement typed electron-store user settings persistence
- [x] Add theme switcher with persisted light/dark/system preference
- [ ] Add SafeStorage-backed secret persistence
- [ ] Unified desktop application updater integration and configuration
