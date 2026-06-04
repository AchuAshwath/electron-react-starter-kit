import { beforeEach, describe, expect, it } from "vitest";
import { applyThemeClass, readInitialThemeState } from "./theme.dom";

describe("theme DOM helpers", () => {
	beforeEach(() => {
		document.documentElement.className = "";
		document.documentElement.removeAttribute("style");
		window.history.replaceState(null, "", "/");
	});

	it("reads a valid initial theme state from the URL", () => {
		window.history.replaceState(
			null,
			"",
			"/?themePreference=system&resolvedTheme=dark&systemPrefersDark=true",
		);

		expect(readInitialThemeState()).toEqual({
			preference: "system",
			resolvedTheme: "dark",
			systemPrefersDark: true,
		});
	});

	it("ignores invalid initial theme URL data", () => {
		window.history.replaceState(
			null,
			"",
			"/?themePreference=banana&resolvedTheme=dark&systemPrefersDark=true",
		);

		expect(readInitialThemeState()).toBeUndefined();
	});

	it("applies only the resolved theme class", () => {
		document.documentElement.classList.add("light");

		applyThemeClass("dark");

		expect(document.documentElement).not.toHaveClass("light");
		expect(document.documentElement).toHaveClass("dark");
		expect(document.documentElement.style.colorScheme).toBe("dark");
	});
});
