# Auto-Update

This is an optional recipe. The starter includes `electron-updater` as a dependency, but it does not wire runtime update checks, update IPC, renderer update UI, or install/restart behavior by default.

GitHub Releases distribution does not require auto-update. You can attach installers and packages to GitHub Releases and let users download them manually. Auto-update is a separate product decision.

## When To Add Auto-Update

Add auto-update only when the app has a chosen release channel and an intentional update policy.

Good reasons:

- users should receive new versions without manually downloading installers
- the app has a stable release feed and signing strategy
- support needs users on recent versions
- enterprise policy allows app-managed updates

Reasons to skip it:

- updates are handled by Intune, SCCM, Jamf, winget, Homebrew, or another managed channel
- the app is air-gapped or controlled by an administrator
- the product needs manual rollout approval
- signing/notarization is not ready

## Provider Choices

Common update sources:

- GitHub Releases
- generic HTTPS server
- S3/R2 or compatible object storage
- private update server
- enterprise software deployment tools
- disabled updates for controlled environments

## Suggested Architecture

```text
main update service
  -> electron-updater
  -> typed update IPC events
  -> renderer update banner/dialog
  -> user chooses download/install behavior
```

The main process should own update checks, downloads, and installation. The renderer should only display update state and user actions.

## What To Decide Per App

- update provider
- code signing strategy
- stable versus prerelease channels
- manual versus automatic download
- forced versus optional install
- proxy and enterprise network behavior
- rollback and failed update handling
- whether update metadata is public or private

## Starter Boundary

Core starter packaging includes build scripts and baseline `electron-builder` configuration. It does not silently check for updates or install new versions.

If a client app chooses auto-update, add it as an app-specific feature with explicit UX and tests.

## References

- electron-updater: https://www.electron.build/auto-update
- electron-builder publishing: https://www.electron.build/publish
- GitHub Releases distribution recipe: [GitHub Releases Distribution](distribution-github-releases.md)
