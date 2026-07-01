import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadEnvFile } from "./env-file";

function createTempEnvFile(content: string): string {
	const directory = mkdtempSync(join(tmpdir(), "env-file-test-"));
	const path = join(directory, ".env");
	writeFileSync(path, content, "utf8");

	return path;
}

describe("loadEnvFile", () => {
	it("loads key-value pairs into the provided target", () => {
		const path = createTempEnvFile(
			"APP_LOG_LEVEL=debug\nMICROSOFT_AUTH_SCOPES=openid profile",
		);
		const target: NodeJS.ProcessEnv = {};

		try {
			loadEnvFile(path, target);
		} finally {
			rmSync(join(path, ".."), { recursive: true, force: true });
		}

		expect(target.APP_LOG_LEVEL).toBe("debug");
		expect(target.MICROSOFT_AUTH_SCOPES).toBe("openid profile");
	});

	it("does not override existing target values", () => {
		const path = createTempEnvFile("APP_LOG_LEVEL=debug");
		const target: NodeJS.ProcessEnv = { APP_LOG_LEVEL: "warn" };

		try {
			loadEnvFile(path, target);
		} finally {
			rmSync(join(path, ".."), { recursive: true, force: true });
		}

		expect(target.APP_LOG_LEVEL).toBe("warn");
	});

	it("ignores comments, blank lines, and malformed lines", () => {
		const path = createTempEnvFile(
			"# comment\n\nmissing-separator\nAPP_LOG_LEVEL=info",
		);
		const target: NodeJS.ProcessEnv = {};

		try {
			loadEnvFile(path, target);
		} finally {
			rmSync(join(path, ".."), { recursive: true, force: true });
		}

		expect(target).toEqual({ APP_LOG_LEVEL: "info" });
	});

	it("unwraps quoted values", () => {
		const path = createTempEnvFile(
			"VITE_APP_NAME=\"IDL Automation\"\nVITE_SUPPORT_URL='https://example.com'",
		);
		const target: NodeJS.ProcessEnv = {};

		try {
			loadEnvFile(path, target);
		} finally {
			rmSync(join(path, ".."), { recursive: true, force: true });
		}

		expect(target.VITE_APP_NAME).toBe("IDL Automation");
		expect(target.VITE_SUPPORT_URL).toBe("https://example.com");
	});

	it("does nothing when the file is missing", () => {
		const target: NodeJS.ProcessEnv = {};

		loadEnvFile("missing.env", target);

		expect(target).toEqual({});
	});
});
