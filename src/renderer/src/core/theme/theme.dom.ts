import type { ResolvedTheme, ThemeState } from "./theme.types";

const themePreferences = new Set(["system", "light", "dark"]);
const resolvedThemes = new Set(["light", "dark"]);

export function readInitialThemeState(): ThemeState | undefined {
	const params = new URLSearchParams(window.location.search);
	const preference = params.get("themePreference");
	const resolvedTheme = params.get("resolvedTheme");
	const systemPrefersDark = params.get("systemPrefersDark");

	if (!themePreferences.has(preference ?? "")) {
		return undefined;
	}

	if (!resolvedThemes.has(resolvedTheme ?? "")) {
		return undefined;
	}

	return {
		preference: preference as ThemeState["preference"],
		resolvedTheme: resolvedTheme as ResolvedTheme,
		systemPrefersDark: systemPrefersDark === "true",
	};
}

export function disableThemeTransitions(): () => void {
	document
		.querySelectorAll("[data-disable-theme-transitions]")
		.forEach((element) => {
			element.remove();
		});

	const style = document.createElement("style");
	style.dataset.disableThemeTransitions = "true";

	style.appendChild(
		document.createTextNode("*,*::before,*::after{transition:none!important}"),
	);

	document.head.appendChild(style);

	return () => {
		window.getComputedStyle(document.body);
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				style.remove();
			});
		});
	};
}

export function applyThemeClass(theme: ResolvedTheme): void {
	const restoreTransitions = disableThemeTransitions();
	const root = document.documentElement;

	root.classList.remove("light", "dark");
	root.classList.add(theme);
	root.style.colorScheme = theme;

	restoreTransitions();
}
