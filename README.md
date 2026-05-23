# electron-react-starter-kit

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [Biome](https://biomejs.dev/)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

# 🗺️ Master Template Check-off List

## 📦 Phase 1: Repository Foundation & Code Quality
- [x] Install Biome: `npm install --save-dev --save-exact @biomejs/biome`
- [x] Configure `biome.json` at root with overrides allowing Node.js globals in `main` and `preload` folders
- [x] Add universal `lint` and `format` execution commands to root `package.json` scripts
- [ ] Install Git Hook orchestration tools: `npm install --save-dev husky lint-staged`
- [ ] Initialize Husky configuration files: `npx husky init`
- [ ] Direct the `.husky/pre-commit` hook file script to trigger `npx lint-staged`
- [ ] Append `lint-staged` blocks targeting `*.{js,ts,jsx,tsx}` files to run `biome check --write --no-errors-on-unmatched` inside root `package.json`

## 🚏 Phase 2: Core Electron & Cross-Process Airlock
- [ ] Install runtime storage manager: `npm install electron-store`
- [ ] Create a generic, empty settings store module file inside `src/main/store.ts`
- [ ] Wire up baseline local read/write listener blocks (`ipcMain.handle`) inside `src/main/index.ts`
- [ ] Securely expose data transmission hooks through `contextBridge.exposeInMainWorld` inside `src/preload/index.ts`
- [ ] Declare explicit TypeScript typing scopes for `window.api` inside `src/preload/index.d.ts` to ensure frontend auto-completion

## 🎨 Phase 3: Layout, Styling, & UI Kit (Renderer)
- [ ] Install Tailwind dependencies: `npm install -D tailwindcss postcss autoprefixer`
- [ ] Initialize global stylesheet trackers: `npx tailwindcss init -p`
- [ ] Validate that `tailwind.config.js` scans all components and paths within `src/renderer/`
- [ ] Initialize component foundation layer: `npx shadcn@latest init`
- [ ] Verify that directory path aliases (`@/*`) route cleanly to `src/renderer/src/*` inside `vite.config.ts` and `tsconfig.json`

## 🚦 Phase 4: Modern Navigation & Async State Engine
- [ ] Install TanStack ecosystem packages: `npm install @tanstack/react-router @tanstack/react-query`
- [ ] Install development automation tooling: `npm install -D @tanstack/router-plugin`
- [ ] Inject the `TanStackRouterVite` setup into your `src/renderer/vite.config.ts` plugins array
- [ ] Establish explicit hash history management (`createHashHistory()`) within `src/renderer/src/main.tsx` to handle `file://` execution rules safely
- [ ] Bind `QueryClientProvider` and `RouterProvider` wrappers around your root component tree
- [ ] Scaffold the base folder system inside `src/renderer/src/routes/` containing:
    - [ ] `__root.tsx` (Houses layout structures and the `<Outlet />` entry node)
    - [ ] `index.tsx` (Placeholder homepage view)
    - [ ] `login.tsx` (Placeholder workspace login layout)

## ⚙️ Phase 5: Build & Compilation Pipeline
- [ ] Execute template test compilation script (`npm run build`) to ensure build assets package cleanly with zero deployment errors
