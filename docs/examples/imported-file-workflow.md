# Imported File Workflow

This is an optional recipe. The starter currently includes native file selection and drag/drop path handling, but it does not persist imported files.

Use this workflow only for apps that need durable file state after the initial selection.

## When To Use

Use imported-file persistence when an app must:

- reopen files after restart
- survive moved or deleted source files
- process files in background jobs
- upload files later
- keep app-owned copies for audit or repeatability

Do not add this workflow when a route only needs temporary file selection.

## Suggested Flow

```text
User selects file
  -> main process validates selection
  -> app copies file into app-owned storage
  -> app stores metadata
  -> renderer shows imported-file records
  -> app verifies file availability before processing
```

App-owned storage should live under an Electron app path such as `app.getPath("userData")`.

## Metadata Concept

This is a recipe shape, not an implemented schema:

```ts
type ImportedFile = {
	id: string;
	originalName: string;
	storedName: string;
	mimeType?: string;
	sizeBytes: number;
	createdAt: string;
	checksum?: string;
	status: "available" | "missing" | "processing" | "failed";
};
```

## Rules

- Keep durable file operations in the main process.
- Do not persist raw browser `File` objects.
- Store metadata separately from user preferences.
- Decide per app whether to copy files, keep references, upload immediately, or delete after processing.
- Show missing-file recovery UI when durable records point to unavailable files.

## Testing

Test path validation, copy failures, missing files, duplicate imports, and cleanup behavior. Use temporary directories in tests.
