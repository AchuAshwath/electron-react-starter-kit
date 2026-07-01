# Auth-Ready Architecture

This is an optional recipe for understanding how the auth pieces fit together. This branch ships Microsoft 365 auth as the installed provider, but the renderer-facing architecture remains provider-shaped so a client app can replace the provider later.

The recommended architecture is provider-neutral at the app boundary: the renderer talks to auth hooks, preload exposes `window.api.auth`, main owns the provider lifecycle, and provider-specific code lives behind an adapter.

## Mental Model

```text
React login UI
  -> auth hook/query
  -> window.api.auth
  -> main auth IPC
  -> AuthProvider adapter
  -> MicrosoftAuthProvider or replacement provider
  -> secure storage/provider SDK cache
```

The renderer should know who is signed in. It should not own raw tokens.

## Core Concepts

- Installed provider: `MicrosoftAuthProvider`, which uses MSAL and Microsoft 365 identity.
- Production identity alternatives: Auth0, Okta, Cognito, Google, activation-code, OS/domain gate, or a custom backend.
- Protocol: usually OpenID Connect on top of OAuth 2.0.
- Desktop flow: authorization code with PKCE through the system browser or another native-app-safe browser flow.
- Session: safe user/account metadata for UI and route guards.
- Token: credential for calling APIs. Keep it in the main process.
- Secret storage: OS-backed secure storage or provider SDK storage for sensitive material.

## Implemented Provider Interface

```ts
type AuthSignInRequest = {
	strategy: "microsoft";
};

type AuthSession = {
	user: {
		id: string;
		name: string;
		displayName: string;
		email?: string;
		username?: string;
		tenantId?: string;
		provider: "microsoft";
		providerLabel: "Microsoft 365";
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

Other providers can extend the sign-in request shape and keep `AuthSession` limited to renderer-safe metadata. Tokens, refresh tokens, provider cache blobs, and activation secrets stay in the main process.

## Provider Recipe Examples

Provider-specific auth should live in docs and client apps unless the product chooses to ship it directly. Start with the [Auth Provider Recipes](auth-provider-recipes.md) index, then choose the provider shape that matches the app:

- Microsoft Entra/MSAL with OAuth 2.0 authorization code + PKCE
- Google OAuth for apps that intentionally choose Google identity
- Auth0/Okta/Cognito for hosted identity
- activation-code auth for licensed desktop apps
- custom backend auth for first-party APIs
- OS/domain gate for managed internal tools

## Microsoft Entra Setup

For a Microsoft 365 client app, use Microsoft Entra ID with MSAL and OAuth 2.0 authorization code with PKCE.

Typical configuration:

- client ID from an Entra app registration
- tenant ID or `organizations`
- redirect URI appropriate for the desktop flow
- scopes such as `openid`, `profile`, `email`, `offline_access`, and an app/API scope

Desktop apps are public clients. Do not put a client secret in the Electron app.

## Starter Bridge

The app already provides the reusable bridge:

- `src/main/auth` service and provider interface
- `MicrosoftAuthProvider` as the installed provider
- `window.api.auth` methods through preload
- renderer auth queries and hooks
- `(auth)` route group for login/signup
- protected `(app)` layout guard
- secure storage foundation for provider token/cache metadata

Client apps should replace the main-process provider and provider-specific config while keeping the renderer API, route guards, and Settings logout/profile behavior stable.

## References

- OAuth 2.0 for native apps, RFC 8252: https://www.rfc-editor.org/rfc/rfc8252
- Microsoft identity platform: https://learn.microsoft.com/en-us/entra/identity-platform/
- MSAL Node: https://learn.microsoft.com/en-us/entra/msal/javascript/node/
- Electron safeStorage: https://www.electronjs.org/docs/latest/api/safe-storage
