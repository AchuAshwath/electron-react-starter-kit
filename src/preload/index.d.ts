import { ElectronAPI } from "@electron-toolkit/preload";
import type {
	UserSettings,
	UserSettingsPatch,
} from "../main/settings/settings.types.ts";

declare global {
	interface Window {
		electron: ElectronAPI;
		api: {
			/** Fetch the Electron app version from the main process */
			getAppVersion: () => Promise<string>;
			/** Fetch system info (platform, arch, versions) from the main process */
			getSystemInfo: () => Promise<{
				platform: string;
				arch: string;
				nodeVersion: string;
				chromeVersion: string;
				electronVersion: string;
			}>;

			settings: {
				get: () => Promise<UserSettings>;
				update: (patch: UserSettingsPatch) => Promise<UserSettings>;
				reset: () => Promise<UserSettings>;
			};
		};
	}
}
