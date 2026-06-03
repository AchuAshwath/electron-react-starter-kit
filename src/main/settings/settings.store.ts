import Store from "electron-store";
import {
	defaultSettings,
	type UserSettings,
	type UserSettingsPatch,
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
	return store.get("settings");
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
