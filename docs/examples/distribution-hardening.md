# Distribution Hardening

This is an optional checklist for preparing a real app for external distribution. The starter already includes secure runtime defaults; distribution hardening covers release identity, signing, packaged app posture, and operational release policy.

Use this after packaging works and before sending installers to users outside local development.

## Release Identity

Confirm the app no longer uses starter metadata:

- app id and product name
- executable and installer names
- icons and installer artwork
- package author, homepage, and support links
- Linux maintainer/category metadata
- release notes and install instructions

## Signing And Notarization

Code signing is a release trust boundary, not a cosmetic step.

- Sign Windows releases with an Authenticode certificate when distributing broadly.
- Sign and notarize macOS builds for distribution outside local development.
- Keep signing certificates and passwords in CI/local secret storage, not in tracked config.
- Smoke-test signed artifacts after download, not only local unsigned builds.

## Electron Fuses

Electron fuses can disable runtime capabilities a production app does not need. Review them near release time because fuse choices can affect debugging, loading behavior, and future maintenance.

Do not change fuses casually in a feature PR. Treat fuse changes as release-hardening work with packaged-app testing.

## Renderer Loading And Protocol Policy

The starter currently loads the bundled renderer from `file://` in production. A custom protocol can be useful for some apps, but it is not required for every starter user.

Evaluate a custom protocol only when the app benefits from protocol-level control, asset policy, or tighter production loading semantics. Keep the CSP and navigation policy in sync with whichever loading strategy is chosen.

## Update Policy

Confirm update behavior is intentional:

- manual downloads from GitHub Releases or another portal
- app-managed auto-update through `electron-updater`
- enterprise-managed deployment
- disabled updates for controlled environments

Do not ship an app-managed updater until signing, release channels, rollback behavior, and user messaging are defined.

## Data And Log Review

Before release, verify logs and user-visible diagnostics do not capture:

- tokens, passwords, API keys, activation codes, or provider cache blobs
- raw document contents
- full sensitive paths unless explicitly sanitized
- large IPC payloads
- provider responses that may include secrets or personal data

## Dependency Policy

Define how updates are reviewed:

- Electron security releases
- Vite/electron-vite updates
- React and TanStack updates
- validation, storage, and auth libraries
- packaging, signing, and release tools

## Release Checklist

1. Build from a clean checkout or CI runner.
2. Verify package version and release tag match.
3. Sign/notarize where required.
4. Install from the produced artifact on the target platform.
5. Verify app launch, auth/session flow, settings persistence, file dialogs, notifications, and logs.
6. Upload only intentional artifacts to the release channel.
7. Keep release notes clear about signing/notarization and update behavior.

## References

- Electron security: https://www.electronjs.org/docs/latest/tutorial/security
- Electron fuses: https://www.electronjs.org/docs/latest/tutorial/fuses
- electron-builder code signing: https://www.electron.build/code-signing
- GitHub Releases distribution: [GitHub Releases Distribution](distribution-github-releases.md)
