import { z } from "zod";

export const themePreferenceSchema = z.enum(["system", "light", "dark"]);

export const windowBoundsSchema = z.object({
	width: z.number().int().min(320),
	height: z.number().int().min(240),
});

export const startupSettingsSchema = z.object({
	openDevTools: z.boolean(),
});

export const notificationSettingsSchema = z.object({
	desktopEnabled: z.boolean(),
});

export const userSettingsSchema = z.object({
	theme: themePreferenceSchema,
	windowBounds: windowBoundsSchema,
	startup: startupSettingsSchema,
	notifications: notificationSettingsSchema,
});

export const userSettingsPatchSchema = z.object({
	theme: themePreferenceSchema.optional(),
	windowBounds: windowBoundsSchema.partial().optional(),
	startup: startupSettingsSchema.partial().optional(),
	notifications: notificationSettingsSchema.partial().optional(),
});

export type ThemePreference = z.infer<typeof themePreferenceSchema>;
export type WindowBounds = z.infer<typeof windowBoundsSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type UserSettingsPatch = z.infer<typeof userSettingsPatchSchema>;

export const defaultSettings: UserSettings = {
	theme: "system",
	windowBounds: {
		width: 900,
		height: 670,
	},
	startup: {
		openDevTools: false,
	},
	notifications: {
		desktopEnabled: false,
	},
};
