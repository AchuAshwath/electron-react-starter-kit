# Distribution Hardening

This is an optional checklist. Apply it when preparing a real app for distribution.

The starter already includes secure runtime defaults. Distribution hardening covers the release pipeline and packaged application posture.

## Checklist

- Code sign releases for the target platforms.
- Notarize macOS builds when distributing outside local development.
- Review Electron fuses before production release.
- Keep Electron and security-sensitive dependencies current.
- Confirm CSP still matches bundled runtime needs.
- Review whether production should continue using `file://` or a custom protocol.
- Confirm auto-update behavior is intentional or disabled.
- Confirm logs do not capture secrets, file contents, tokens, or sensitive paths.
- Confirm app identifiers, icons, names, and publisher metadata are client-specific.

## Electron Fuses

Electron fuses can disable runtime features that production apps do not need. They should be reviewed near release time because fuse choices can affect debugging, loading behavior, and future maintenance.

## Custom Protocol

A custom protocol can replace direct `file://` renderer loading in some apps. Evaluate it after packaging is stable and only when the app benefits from protocol-level control.

## Dependency Policy

Define how updates are reviewed:

- Electron security releases
- Vite/electron-vite updates
- React and TanStack updates
- validation and storage libraries
- packaging and signing tools

## References

- Electron security: https://www.electronjs.org/docs/latest/tutorial/security
- Electron fuses: https://www.electronjs.org/docs/latest/tutorial/fuses
- electron-builder code signing: https://www.electron.build/code-signing
