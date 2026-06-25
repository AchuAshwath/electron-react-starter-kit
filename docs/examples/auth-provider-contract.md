# Auth Provider Contract Spec

This is a planned core spec. The goal is to make auth provider changes mostly isolated to main-process provider code while keeping renderer routes, hooks, Settings logout/profile, and route guards stable.

## Goal

The starter should fake the shape of a production auth provider without faking security. `DevAuthProvider` remains a development provider, but it should exercise the same contract that OAuth, activation-code, backend, or local-only providers will use later.

## Planned Provider Contract

```ts
type AuthProvider = {
	id: string;
	displayName: string;
	getSession: () => Promise<AuthSession | null>;
	signIn: (input: AuthSignInInput) => Promise<AuthSession>;
	signOut: () => Promise<void>;
	restoreSession?: () => Promise<AuthSession | null>;
};
```

`id` is used for safe logs and session metadata. `displayName` is for docs/admin diagnostics, not for secrets. `restoreSession` is optional because not every provider persists credentials.

## Planned Sign-In Input

```ts
type AuthSignInInput =
	| { strategy: "device" }
	| { strategy: "credentials"; email: string; password: string }
	| { strategy: "oauth"; provider?: string }
	| { strategy: "activation-code"; code: string };
```

The starter should validate this at the IPC boundary with Zod. Providers may support only a subset of strategies and should reject unsupported strategies with a renderer-safe error.

## DevAuthProvider Behavior

For the starter default:

```text
signIn({ strategy: "device" })
  -> read current OS username in main
  -> create safe AuthSession metadata
  -> keep session in memory

signIn(other strategy)
  -> reject with a safe unsupported-strategy error
```

`DevAuthProvider` should not store secrets, tokens, passwords, or fake OAuth data.

## Renderer Contract

Renderer hooks stay generic:

```ts
useAuthSession();
useSignIn();
useSignOut();
```

`useSignIn()` should accept provider-neutral input:

```ts
await signIn.mutateAsync({ strategy: "device" });
```

Login/signup UI can keep email/password fields as scaffold controls, but the only working starter action should call the supported `device` strategy until a real provider is wired.

## Provider Swap Rule

A client provider should be able to replace only:

- provider class
- sign-in strategy implementation
- optional secure-storage usage
- provider-specific docs/config

These should remain stable:

- `window.api.auth`
- auth IPC channels
- TanStack Query auth hooks
- app route guard
- auth route redirect behavior
- Settings logout/profile session display

## Test Requirements

- provider supports expected strategies
- provider rejects unsupported strategies safely
- IPC validates sign-in input
- IPC logs provider id without logging secrets
- hooks pass sign-in input through preload
- route behavior remains provider-neutral
