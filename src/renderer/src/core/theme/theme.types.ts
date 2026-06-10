export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export type ThemeState = {
	preference: ThemePreference;
	resolvedTheme: ResolvedTheme;
	systemPrefersDark: boolean;
};
