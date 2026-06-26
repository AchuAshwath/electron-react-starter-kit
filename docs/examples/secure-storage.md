# Secure Storage Notes

The core secure storage module is implemented in `src/main/secure-storage/secure-storage.ts` and documented in [Secure Storage](../secure-storage.md). This recipe explains how real providers can use or replace that foundation.

## Goal

Make auth mostly wired for real providers by separating safe UI session metadata from persisted provider secrets.

`AuthSession` is safe renderer metadata. `SecureStorage` is main-process-only storage for secrets or credential metadata that must survive app restart.

## What Belongs In Secure Storage

Use secure storage for:

- OAuth refresh tokens
- encrypted provider cache blobs such as MSAL cache
- activation secrets or license credentials
- API keys entered by a user or administrator
- device-bound credentials

Do not use secure storage for:

- `AuthSession` display metadata
- OAuth public client IDs
- theme, window bounds, notification preferences
- non-secret config

## Implemented Adapter

The starter implementation uses Electron `safeStorage`:

```text
set(key, value)
  -> safeStorage.encryptString(value)
  -> persist encrypted bytes in app-owned electron-store storage

get(key)
  -> read encrypted bytes
  -> safeStorage.decryptString(bytes)
  -> return plaintext only inside main process
```

`safeStorage` encrypts and decrypts strings, but it does not choose a persistence backend. The starter persists encrypted values in a dedicated `electron-store` file.

## Failure Behavior

- If encryption is unavailable, provider sign-in or credential persistence should fail safely.
- Missing or corrupt payloads should resolve to `null` and require sign-in again.
- Secret values must never be logged.
- Renderer should receive only generic auth errors.

## Provider Usage

A real provider can use secure storage like this:

```text
signIn()
  -> complete provider-specific flow
  -> store refresh token/provider cache through AuthCredentialStore or provider SDK storage
  -> return safe AuthSession

refreshSession()
  -> read provider secret/cache in main
  -> refresh or validate provider session
  -> return safe AuthSession or null

signOut()
  -> revoke provider session if needed
  -> delete provider secrets
  -> clear in-memory session
```

Provider SDKs may bring their own secure storage. For example, an MSAL-based provider may use an MSAL cache plugin instead of this generic store. That is acceptable as long as secrets stay in the main process and renderer contracts remain stable.
