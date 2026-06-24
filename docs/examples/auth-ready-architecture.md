# Auth-Ready Architecture

This is an optional recipe. The starter does not currently ship real auth, token storage, route guards, or a provider integration.

The recommended architecture is provider-neutral: the app talks to an auth service interface, and provider-specific code lives behind an adapter.

## Mental Model

```text
React login UI
  -> auth hook/query
  -> window.api.auth
  -> main auth IPC
  -> AuthProvider adapter
  -> identity provider
  -> secure secret storage
```

The renderer should know who is signed in. It should not own raw tokens.

## Core Concepts

- Identity provider: Microsoft Entra ID, Auth0, Okta, Cognito, Google, or a custom provider.
- Protocol: usually OpenID Connect on top of OAuth 2.0.
- Desktop flow: authorization code with PKCE through the system browser or another native-app-safe browser flow.
- Session: safe user/account metadata for UI and route guards.
- Token: credential for calling APIs. Keep it in the main process.
- Secret storage: OS-backed secure storage for sensitive material.

## Future Provider Interface Concept

This is a planned shape, not an implemented API:

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
- `window.api.auth` methods through preload
- renderer auth queries and hooks
- `(auth)` route group for login
- protected `(app)` layout guard
- safe secret storage before storing sensitive auth material

## References

- OAuth 2.0 for native apps, RFC 8252: https://www.rfc-editor.org/rfc/rfc8252
- Microsoft identity platform: https://learn.microsoft.com/en-us/entra/identity-platform/
- MSAL Node: https://learn.microsoft.com/en-us/entra/msal/javascript/node/
- Electron safeStorage: https://www.electronjs.org/docs/latest/api/safe-storage
