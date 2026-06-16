import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { applyThemeClass } from "./theme.dom";
import {
	useSetThemePreference,
	useTheme,
	useThemeUpdatedListener,
} from "./theme.hooks";
import type { ThemePreference, ThemeState } from "./theme.types";

type ThemeProviderValue = {
	theme?: ThemeState;
	setTheme: (theme: ThemePreference) => void;
	isChangingTheme: boolean;
};

const ThemeContext = createContext<ThemeProviderValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const themeQuery = useTheme();
	const setThemePreference = useSetThemePreference();

	useThemeUpdatedListener();

	useEffect(() => {
		if (themeQuery.data) {
			applyThemeClass(themeQuery.data.resolvedTheme);
		}
	}, [themeQuery.data]);

	const value = useMemo(
		() => ({
			theme: themeQuery.data,
			setTheme: (themePreference: ThemePreference) => {
				setThemePreference.mutate(themePreference);
			},
			isChangingTheme: setThemePreference.isPending,
		}),
		[setThemePreference, themeQuery.data],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useThemeContext() {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("useThemeContext must be used within ThemeProvider");
	}

	return context;
}
