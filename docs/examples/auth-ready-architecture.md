# Auth-Ready Architecture

This is an optional recipe. The starter core ships a provider-neutral auth contract, secure credential metadata storage, guarded routes, renderer hooks, and a development auth provider, but it does not ship real OAuth provider integration, token exchange, or client-specific identity policy.

The recommended architecture is provider-neutral: the renderer talks to the starter auth hooks, preload exposes `window.api.auth`, main owns the provider lifecycle, and provider-specific code lives behind a replaceable adapter.

## Mental Model

```text
React login UI
  -> auth hook/query
  -> window.api.auth
  -> main auth IPC
  -> AuthProvider adapter
  -> DevAuthProvider or real identity provider
  -> secure storage/provider SDK cache when real credentials are persisted
```

The renderer should know who is signed in. It should not own raw tokens.

## Core Concepts

- Starter provider: `DevAuthProvider`, which signs in with the current device account, stores encrypted provider metadata, restores a safe app session when valid, and clears credentials on logout.
- Production identity provider: Microsoft Entra ID, Auth0, Okta, Cognito, Google, activation-code, OS/domain gate, or a custom backend.
- Protocol: usually OpenID Connect on top of OAuth 2.0.
- Desktop flow: authorization code with PKCE through the system browser or another native-app-safe browser flow.
- Session: safe user/account metadata for UI and route guards.
- Token: credential for calling APIs. Keep it in the main process.
- Secret storage: OS-backed secure storage or provider SDK storage for sensitive material.

## Implemented Provider Interface

The core starter API intentionally stays provider-neutral:

```ts
type AuthSignInRequest = {
	strategy: "device";
};

type AuthSession = {
	user: {
		id: string;
		name: string;
		username?: string;
		provider: string;
	};
	issuedAt: string;
	expiresAt?: string;
};

type AuthProvider = {
	id: string;
	getSession: () => Promise<AuthSession | null>;
	signIn: (request: AuthSignInRequest) => Promise<AuthSession>;
	refreshSession: () => Promise<AuthSession | null>;
	signOut: () => Promise<void>;
};
```

Real providers can extend the sign-in request shape and keep `AuthSession` limited to renderer-safe metadata. Tokens, refresh tokens, provider cache blobs, and activation secrets stay in the main process.

## Provider Recipe Examples

Provider-specific auth should live in docs and client apps, not in starter core. Start with the [Auth Provider Recipes](auth-provider-recipes.md) index, then choose the provider shape that matches the app:

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

The starter already provides the reusable bridge:

- `src/main/auth` service and provider interface
- `DevAuthProvider` as the starter default
- `window.api.auth` methods through preload
- renderer auth queries and hooks
- `(auth)` route group for login/signup
- protected `(app)` layout guard
- secure storage foundation for provider credential metadata

Client apps should replace the main-process provider and provider-specific config while keeping the renderer API, route guards, and Settings logout/profile behavior stable.

## References

- OAuth 2.0 for native apps, RFC 8252: https://www.rfc-editor.org/rfc/rfc8252
- Microsoft identity platform: https://learn.microsoft.com/en-us/entra/identity-platform/
- MSAL Node: https://learn.microsoft.com/en-us/entra/msal/javascript/node/
- Electron safeStorage: https://www.electronjs.org/docs/latest/api/safe-storage
