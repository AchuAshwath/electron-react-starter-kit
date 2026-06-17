import { contextBridge, ipcRenderer } from "electron";
import { dialogIpcChannels } from "../main/dialog/dialog.channels";
import type {
	OpenFileDialogInput,
	OpenFileDialogResult,
	SaveFileDialogInput,
	SaveFileDialogResult,
} from "../main/dialog/dialog.types";
import { settingsUpdatedChannel } from "../main/settings/settings.channels";
import type {
	UserSettings,
	UserSettingsPatch,
} from "../main/settings/settings.types";
import type { ThemeState } from "../main/theme/theme.types";

// Custom APIs for renderer — each function maps to an ipcMain.handle channel
const api = {
	/** Fetch the Electron app version from the main process */
	getAppVersion: (): Promise<string> => ipcRenderer.invoke("get-app-version"),
	/** Fetch system info (platform, arch, versions) from the main process */
	getSystemInfo: (): Promise<{
		platform: string;
		arch: string;
		nodeVersion: string;
		chromeVersion: string;
		electronVersion: string;
	}> => ipcRenderer.invoke("get-system-info"),

	settings: {
		get: (): Promise<UserSettings> => ipcRenderer.invoke("settings:get"),
		update: (patch: UserSettingsPatch): Promise<UserSettings> =>
			ipcRenderer.invoke("settings:update", patch),
		reset: (): Promise<UserSettings> => ipcRenderer.invoke("settings:reset"),
		onUpdated: (callback: (settings: UserSettings) => void): (() => void) => {
			const listener = (
				_: Electron.IpcRendererEvent,
				settings: UserSettings,
			) => {
				callback(settings);
			};

			ipcRenderer.on(settingsUpdatedChannel, listener);

			return () => {
				ipcRenderer.removeListener(settingsUpdatedChannel, listener);
			};
		},
	},

	theme: {
		get: (): Promise<ThemeState> => ipcRenderer.invoke("theme:get"),
		setPreference: (theme: UserSettings["theme"]): Promise<ThemeState> =>
			ipcRenderer.invoke("theme:set-preference", theme),
		onUpdated: (callback: (theme: ThemeState) => void): (() => void) => {
			const listener = (_: Electron.IpcRendererEvent, theme: ThemeState) => {
				callback(theme);
			};

			ipcRenderer.on("theme:updated", listener);

			return () => {
				ipcRenderer.removeListener("theme:updated", listener);
			};
		},
	},

	dialog: {
		openFile: (input?: OpenFileDialogInput): Promise<OpenFileDialogResult> =>
			ipcRenderer.invoke(dialogIpcChannels.openFile, input),
		saveFile: (input?: SaveFileDialogInput): Promise<SaveFileDialogResult> =>
			ipcRenderer.invoke(dialogIpcChannels.saveFile, input),
	},
};

if (!process.contextIsolated) {
	throw new Error("contextIsolation must be enabled for the preload API.");
}

try {
	contextBridge.exposeInMainWorld("api", api);
} catch (error) {
	console.error(error);
}
