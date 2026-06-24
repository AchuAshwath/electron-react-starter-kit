function getSafeRedirectUrl(value: unknown): string | undefined {
	if (typeof value !== "string" || value.trim() === "") {
		return undefined;
	}

	if (!value.startsWith("/") || value.startsWith("//")) {
		return undefined;
	}

	return value;
}

export { getSafeRedirectUrl };
