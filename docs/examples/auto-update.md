# Auto-Update

This is an optional recipe. The starter includes `electron-updater` as a dependency, but it does not force an update flow on every app.

Auto-update depends on distribution and client infrastructure, so it should be wired only when the app has a chosen release channel.

## Provider Choices

Common update sources:

- GitHub Releases
- private update server
- S3 or compatible object storage
- enterprise software deployment tools
- disabled updates for controlled or air-gapped environments

## Suggested Architecture

```text
main update service
  -> electron-updater
  -> typed update IPC events
  -> renderer update banner/dialog
  -> user chooses download/install behavior
```

The main process should own update checks and installation. The renderer should only display state and user actions.

## What To Decide Per App

- update provider
- code signing strategy
- prerelease versus stable channels
- manual versus automatic download
- forced versus optional install
- proxy and enterprise network behavior
- rollback and failed update handling

## Starter Boundary

The core starter should document the pattern and keep packaging ready. It should not assume a publishing provider or silently install updates.

## References

- electron-updater: https://www.electron.build/auto-update
- electron-builder publishing: https://www.electron.build/publish
