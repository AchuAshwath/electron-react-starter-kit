import type { ThemePreference } from "../settings/settings.types";

export type ResolvedTheme = "light" | "dark";

export type ThemeState = {
	preference: ThemePreference;
	resolvedTheme: ResolvedTheme;
	systemPrefersDark: boolean;
};
