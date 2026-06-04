import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";
import type {
	UserSettings,
	UserSettingsPatch,
} from "../main/settings/settings.types";

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
	},
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld("electron", electronAPI);
		contextBridge.exposeInMainWorld("api", api);
	} catch (error) {
		console.error(error);
	}
} else {
	// @ts-expect-error (define in dts)
	window.electron = electronAPI;
	// @ts-expect-error (define in dts)
	window.api = api;
}
