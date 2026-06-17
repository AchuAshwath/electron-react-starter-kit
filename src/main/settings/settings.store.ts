import Store from "electron-store";
import {
	defaultSettings,
	type UserSettings,
	type UserSettingsPatch,
	userSettingsSchema,
} from "./settings.types";

type settingStoreSchema = {
	settings: UserSettings;
};

const store = new Store<settingStoreSchema>({
	defaults: {
		settings: defaultSettings,
	},
	name: "settings",
});

export function getSettings(): UserSettings {
	const settings = store.get("settings");
	const parsedSettings = userSettingsSchema.safeParse(settings);

	if (parsedSettings.success) {
		return parsedSettings.data;
	}

	store.set("settings", defaultSettings);

	return defaultSettings;
}

export function updateSettings(patch: UserSettingsPatch): UserSettings {
	const currentSettings = getSettings();

	const nextSettings: UserSettings = {
		...currentSettings,
		...patch,
		startup: {
			...currentSettings.startup,
			...patch.startup,
		},
		notifications: {
			...currentSettings.notifications,
			...patch.notifications,
		},
		windowBounds: {
			...currentSettings.windowBounds,
			...patch.windowBounds,
		},
	};

	store.set("settings", nextSettings);

	return nextSettings;
}

export function resetSettings(): UserSettings {
	store.set("settings", defaultSettings);

	return getSettings();
}
