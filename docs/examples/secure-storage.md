# Secure Storage Spec

This is a planned core spec. The starter should provide a main-process secure-storage abstraction so real auth providers can persist sensitive material without coupling provider code directly to Electron `safeStorage`.

## Goal

Make auth 90 percent wired for real providers by separating safe UI session metadata from persisted provider secrets.

`AuthSession` is safe renderer metadata. `SecureStorage` is main-process-only storage for secrets that must survive app restart.

## What Belongs In Secure Storage

Use secure storage for:

- OAuth refresh tokens
- encrypted provider cache blobs such as MSAL cache
- activation secrets or license credentials
- API keys entered by a user or administrator
- device-bound credentials

Do not use secure storage for:

- `AuthSession` display metadata
- current username/display name
- OAuth public client IDs
- theme, window bounds, notification preferences
- non-secret config

## Planned Interface

```ts
type SecureStorage = {
	isAvailable: () => boolean;
	get: (key: SecureStorageKey) => Promise<string | null>;
	set: (key: SecureStorageKey, value: string) => Promise<void>;
	delete: (key: SecureStorageKey) => Promise<void>;
	has: (key: SecureStorageKey) => Promise<boolean>;
};

type SecureStorageKey = `auth:${string}:${string}` | `app:${string}`;
```

Keys should be namespaced. Provider code should not share token keys across providers.

## Electron safeStorage Adapter

The first implementation can use Electron `safeStorage`:

```text
set(key, value)
  -> safeStorage.encryptString(value)
  -> persist encrypted bytes in app-owned storage

get(key)
  -> read encrypted bytes
  -> safeStorage.decryptString(bytes)
  -> return plaintext only inside main process
```

`safeStorage` encrypts and decrypts strings, but it does not choose a persistence backend. The adapter still needs app-owned storage for encrypted values.

## Failure Behavior

- If encryption is unavailable, provider restore should fail closed and require sign-in again.
- Corrupt payloads should be deleted or ignored after logging a safe warning.
- Secret values must never be logged.
- Renderer should receive only generic auth errors.

## Auth Provider Usage

A real provider can use secure storage like this:

```text
signIn()
  -> complete provider-specific flow
  -> store refresh token/provider cache through SecureStorage
  -> return safe AuthSession

restoreSession()
  -> read provider secret/cache from SecureStorage
  -> refresh or validate provider session
  -> return safe AuthSession or null

signOut()
  -> revoke provider session if needed
  -> delete provider secrets
  -> clear in-memory session
```

`DevAuthProvider` should not use secure storage because it has no real secret to persist.

## Test Requirements

- encrypt/decrypt happy path
- missing key returns null
- delete removes stored value
- unavailable encryption fails safely
- corrupt payload handling
- no secret values in logs or thrown renderer errors
