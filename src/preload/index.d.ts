import type {
	OpenFileDialogInput,
	OpenFileDialogResult,
	SaveFileDialogInput,
	SaveFileDialogResult,
} from "../main/dialog/dialog.types.ts";
import type {
	NotificationPermissionState,
	ShowNotificationInput,
	ShowNotificationResult,
} from "../main/notifications/notifications.types.ts";
import type {
	UserSettings,
	UserSettingsPatch,
} from "../main/settings/settings.types.ts";
import type { ThemeState } from "../main/theme/theme.types.ts";

declare global {
	interface Window {
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
				onUpdated: (callback: (settings: UserSettings) => void) => () => void;
			};

			theme: {
				get: () => Promise<ThemeState>;
				setPreference: (theme: UserSettings["theme"]) => Promise<ThemeState>;
				onUpdated: (callback: (theme: ThemeState) => void) => () => void;
			};

			dialog: {
				openFile: (
					input?: OpenFileDialogInput,
				) => Promise<OpenFileDialogResult>;
				saveFile: (
					input?: SaveFileDialogInput,
				) => Promise<SaveFileDialogResult>;
			};

			notifications: {
				getPermission: () => Promise<NotificationPermissionState>;
				requestPermission: () => Promise<NotificationPermissionState>;
				setDesktopEnabled: (
					desktopEnabled: boolean,
				) => Promise<NotificationPermissionState>;
				show: (input: ShowNotificationInput) => Promise<ShowNotificationResult>;
			};

			files: {
				getPathForFile: (file: File) => string;
			};
		};
	}
}
