export type ThemePreference = "system" | "light" | "dark";

export type WindowBounds = {
	width: number;
	height: number;
};

export type UserSettings = {
	theme: ThemePreference;
	windowBounds: WindowBounds;
	startup: {
		openDevTools: boolean;
	};
};

export const defaultSettings = {
	theme: "system",
	windowBounds: {
		width: 900,
		height: 670,
	},
	startup: {
		openDevTools: false,
	},
};
