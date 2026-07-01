import { existsSync, readFileSync } from "node:fs";

export function loadEnvFile(
	path = ".env",
	target: NodeJS.ProcessEnv = process.env,
): void {
	if (!existsSync(path)) {
		return;
	}

	const content = readFileSync(path, "utf8");

	for (const line of content.split(/\r?\n/)) {
		const parsed = parseEnvLine(line);
		if (!parsed || target[parsed.key] !== undefined) {
			continue;
		}

		target[parsed.key] = parsed.value;
	}
}

function parseEnvLine(line: string): { key: string; value: string } | null {
	const trimmedLine = line.trim();
	if (!trimmedLine || trimmedLine.startsWith("#")) {
		return null;
	}

	const separatorIndex = trimmedLine.indexOf("=");
	if (separatorIndex <= 0) {
		return null;
	}

	const key = trimmedLine.slice(0, separatorIndex).trim();
	const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

	if (!key) {
		return null;
	}

	return {
		key,
		value: unwrapQuotedValue(rawValue),
	};
}

function unwrapQuotedValue(value: string): string {
	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1);
	}

	return value;
}
