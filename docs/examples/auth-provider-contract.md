# Auth Provider Contract Notes

The core auth provider contract is implemented in `src/main/auth/auth.types.ts`. This recipe explains how a client app can extend that contract for real providers without rewriting renderer auth routes, hooks, IPC consumers, or Settings logout.

## Implemented Core Contract

```ts
type AuthSignInRequest = {
	strategy: "device";
};

type AuthProvider = {
	id: string;
	getSession: () => Promise<AuthSession | null>;
	signIn: (request: AuthSignInRequest) => Promise<AuthSession>;
	refreshSession: () => Promise<AuthSession | null>;
	signOut: () => Promise<void>;
};
```

The starter default is `DevAuthProvider`. It supports `{ strategy: "device" }`, stores provider credential metadata through secure storage, restores a session when the current OS user still matches the stored credential, refreshes by revalidating that credential, and deletes credential metadata on logout.

## Why This Helps Provider Swaps

Most real providers need the same lifecycle:

```text
signIn()
  -> complete provider-specific verification
  -> persist provider credential/cache in main process
  -> return safe AuthSession metadata

getSession()
  -> return memory first
  -> restore from provider credential/cache if possible

refreshSession()
  -> validate or renew provider credential/cache
  -> return a safe AuthSession or null

signOut()
  -> revoke provider session if needed
  -> delete provider credential/cache
  -> clear memory
```

The renderer should not change for most provider swaps. It should continue to use:

```ts
useAuthSession();
useSignIn();
useRefreshSession();
useSignOut();
```

## Optional Strategy Expansion

A client app may expand `AuthSignInRequest` when it adds a real provider:

```ts
type AuthSignInRequest =
	| { strategy: "device" }
	| { strategy: "credentials"; email: string; password: string }
	| { strategy: "oauth"; provider: "google" | "microsoft" }
	| { strategy: "activation-code"; code: string };
```

When adding strategies:

- update the Zod schema at the IPC boundary
- keep provider errors renderer-safe
- keep secrets in the main process
- avoid putting tokens or provider cache blobs in `AuthSession`
- add provider tests for supported and unsupported strategies

## Provider Swap Rule

A client provider should be able to replace only:

- provider class
- sign-in strategy implementation
- provider-specific secure storage usage
- provider-specific config and docs

These should remain stable:

- `window.api.auth`
- auth IPC channels
- TanStack Query auth hooks
- app route guard
- auth route redirect behavior
- Settings profile/logout session display

## Test Requirements

- provider supports expected strategies
- provider rejects unsupported strategies safely
- IPC validates sign-in input
- IPC logs provider id without logging secrets
- hooks pass sign-in input through preload
- route behavior remains provider-neutral
