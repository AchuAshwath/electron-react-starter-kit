# Auth-Ready Architecture

This is an optional recipe. The starter core ships a provider-neutral auth contract and a development auth provider, but it does not ship real OAuth provider integration, token storage, or client-specific identity policy.

The recommended architecture is provider-neutral: the app talks to an auth service interface, the starter uses a development auth adapter by default, and provider-specific code lives behind a replaceable adapter.

## Mental Model

```text
React login UI
  -> auth hook/query
  -> window.api.auth
  -> main auth IPC
  -> AuthProvider adapter
  -> development auth provider or real identity provider
  -> secure secret storage when real tokens/secrets are persisted
```

The renderer should know who is signed in. It should not own raw tokens.

## Core Concepts

- Starter provider: development auth provider that creates an in-memory session from the current OS user.
- Production identity provider: Microsoft Entra ID, Auth0, Okta, Cognito, Google, activation-code, OS/domain gate, or a custom backend.
- Protocol: usually OpenID Connect on top of OAuth 2.0.
- Desktop flow: authorization code with PKCE through the system browser or another native-app-safe browser flow.
- Session: safe user/account metadata for UI and route guards.
- Token: credential for calling APIs. Keep it in the main process.
- Secret storage: OS-backed secure storage for sensitive material.

## Future Provider Interface Concept

The core starter API intentionally stays provider-neutral:

```ts
type AuthSession = {
	accountId: string;
	name?: string;
	username?: string;
	tenantId?: string;
	expiresAt?: string;
};

type AuthProvider = {
	getSession: () => Promise<AuthSession | null>;
	signIn: () => Promise<AuthSession>;
	signOut: () => Promise<void>;
	getAccessToken: (scope?: string) => Promise<string>;
};
```

## Provider Recipe Examples

Provider-specific auth should live in docs and client apps, not in starter core. Useful recipes include:

- Microsoft Entra/MSAL with OAuth 2.0 authorization code + PKCE
- Google OAuth for apps that intentionally choose Google identity
- Auth0/Okta/Cognito for hosted identity
- activation-code auth for licensed desktop apps
- custom backend auth for first-party APIs
- OS/domain/device gate for managed internal tools

## Microsoft Entra Example

For a Microsoft 365 client app, use Microsoft Entra ID with MSAL and OAuth 2.0 authorization code with PKCE.

Typical configuration:

- client ID from an Entra app registration
- tenant ID or `organizations`
- redirect URI appropriate for a desktop app
- scopes such as `openid`, `profile`, `email`, `offline_access`, and an app/API scope

Desktop apps are public clients. Do not put a client secret in the Electron app.

## Starter Bridge

A future implementation should add:

- `src/main/auth` service and provider interface
- development auth provider as the starter default
- `window.api.auth` methods through preload
- renderer auth queries and hooks
- `(auth)` route group for login
- protected `(app)` layout guard
- the shipped secure storage foundation before storing sensitive auth material for real providers

## References

- OAuth 2.0 for native apps, RFC 8252: https://www.rfc-editor.org/rfc/rfc8252
- Microsoft identity platform: https://learn.microsoft.com/en-us/entra/identity-platform/
- MSAL Node: https://learn.microsoft.com/en-us/entra/msal/javascript/node/
- Electron safeStorage: https://www.electronjs.org/docs/latest/api/safe-storage
