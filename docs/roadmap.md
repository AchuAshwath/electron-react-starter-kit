# Roadmap

The roadmap separates core starter infrastructure from optional recipes. Core items should help almost every serious Electron app. Recipes stay opt-in because they depend on product, client, provider, backend, or deployment choices.

## Roadmap Model

```mermaid
flowchart LR
	Foundation["Core starter foundation"] --> ClientApp["Client app implementation"]
	Foundation --> Recipes["Optional recipes"]
	Recipes --> ClientApp

	Foundation --> Security["Security + IPC + settings + tests"]
	Foundation --> FutureCore["Auth provider contract + secure storage + config + reliability"]
	Recipes --> Auth["Provider recipes"]
	Recipes --> Files["Imported file persistence"]
	Recipes --> Updates["Auto-update"]
	Recipes --> Distribution["Distribution hardening"]
```

## Completed Core Foundation

- Electron runtime security defaults.
- Typed IPC registrar with trusted sender validation and sanitized errors.
- Preload-first renderer API.
- TanStack Router file-based routing.
- TanStack Query factories and hooks.
- Settings persistence through `electron-store`.
- Desktop-aware theme switching.
- Native file dialog and drag/drop demo.
- Native notification preference and delivery flow.
- Window state persistence.
- Main-process logging.
- Vitest and Testing Library setup.
- electron-builder packaging scripts.
- Documentation split between core guides and optional recipes.
- Provider-neutral auth session contract with a development auth provider, typed IPC, renderer hooks, and guarded app routes.

## Core Starter Roadmap

These belong in the starter because most production Electron apps need the pattern.

### Auth provider contract

Generalize the auth provider interface so real provider swaps are mostly isolated to main-process provider code. Planned work is specified in [Auth Provider Contract](examples/auth-provider-contract.md):

- provider metadata such as `id` and `displayName`
- provider-neutral `AuthSignInInput` strategies
- IPC validation for sign-in input
- `DevAuthProvider` support for `{ strategy: "device" }`
- safe unsupported-strategy errors

### Secure storage foundation

Add a main-process secure-storage module for tokens, provider cache, API keys, activation secrets, and refresh material. It should be separate from `electron-store`, backed initially by Electron `safeStorage`, and follow [Secure Storage](examples/secure-storage.md).

### Typed config

Add documented config boundaries for:

- renderer build-time environment values
- main-process runtime configuration
- secrets that must not ship in renderer bundles
- `.env.example` and validation strategy

### Reliability

Add renderer error boundaries, user-friendly fallback UI, crash/reload guidance, and abnormal-exit diagnostics.

## Optional Recipe Roadmap

These should stay in `docs/examples/` unless a specific app chooses to implement them.

- Microsoft Entra/MSAL provider wiring for OAuth 2.0 authorization code with PKCE.
- Google OAuth, Auth0/Okta, activation-code, OS/domain gate, and custom backend auth recipes.
- Durable imported-file workflow for apps that need app-owned file storage.
- Auto-update recipe for apps that choose an update channel and publishing provider.
- Distribution hardening checklist covering code signing, Electron fuses, custom protocol evaluation, and dependency update policy.

## Decision Rule

Ask this before moving a roadmap item into core:

```text
Would almost every serious Electron app want this exact behavior?
```

If yes, it belongs in the core starter. If no, document it as an example or recipe.
