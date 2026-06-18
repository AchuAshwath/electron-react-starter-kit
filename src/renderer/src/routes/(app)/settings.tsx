import { createFileRoute } from "@tanstack/react-router";
import { type LucideIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import {
	useNotificationPermission,
	useSetDesktopNotificationsEnabled,
	useShowNotification,
} from "../../core/notifications/notification.hooks";
import {
	useSettings,
	useSettingsUpdatedListener,
	useUpdateSettings,
} from "../../core/settings/settings.hooks";
import type { ThemePreference } from "../../core/theme/theme.types";
import { useThemeContext } from "../../core/theme/theme-provider";

export const Route = createFileRoute("/(app)/settings")({
	component: SettingsRoute,
});

type WindowBounds = {
	width: number;
	height: number;
};

const themeOptions: Array<{
	value: ThemePreference;
	label: string;
	helper: string;
	icon: LucideIcon;
}> = [
	{
		value: "system",
		label: "System",
		helper: "OS default",
		icon: MonitorIcon,
	},
	{
		value: "light",
		label: "Light",
		helper: "Bright UI",
		icon: SunIcon,
	},
	{
		value: "dark",
		label: "Dark",
		helper: "Low-light UI",
		icon: MoonIcon,
	},
];

const windowSizePresets: Array<{
	id: string;
	label: string;
	helper: string;
	bounds: WindowBounds;
}> = [
	{
		id: "compact",
		label: "Compact",
		helper: "Small displays",
		bounds: { width: 900, height: 670 },
	},
	{
		id: "standard",
		label: "Standard",
		helper: "Default workspace",
		bounds: { width: 1100, height: 720 },
	},
	{
		id: "wide",
		label: "Wide",
		helper: "Side panels",
		bounds: { width: 1280, height: 800 },
	},
	{
		id: "workbench",
		label: "Workbench",
		helper: "Developer tools",
		bounds: { width: 1440, height: 900 },
	},
];

const windowSizeMatchTolerance = 8;

function SettingsRoute(): React.JSX.Element {
	const settingsQuery = useSettings();
	const updateSettings = useUpdateSettings();
	const { theme, setTheme, isChangingTheme } = useThemeContext();
	const notificationPermissionQuery = useNotificationPermission();
	const setDesktopNotifications = useSetDesktopNotificationsEnabled();
	const showNotification = useShowNotification();

	useSettingsUpdatedListener();

	const selectedWindowBounds = settingsQuery.data?.windowBounds;
	const selectedWindowSizeId =
		findMatchingWindowSizePreset(selectedWindowBounds);
	const isUpdatingWindowSize = updateSettings.isPending;
	const notificationPermission = notificationPermissionQuery.data;
	const notificationsSupported = notificationPermission?.supported !== false;
	const desktopNotificationsEnabled =
		notificationPermission?.desktopEnabled === true;
	const isUpdatingNotifications =
		notificationPermissionQuery.isLoading ||
		setDesktopNotifications.isPending ||
		showNotification.isPending;

	async function setNotificationsEnabled(enabled: boolean): Promise<void> {
		let permission: Awaited<
			ReturnType<typeof setDesktopNotifications.mutateAsync>
		>;

		try {
			permission = await setDesktopNotifications.mutateAsync(enabled);
		} catch {
			toast.error("Could not update notification preference.");
			return;
		}

		if (!permission.supported) {
			toast.error("Desktop notifications are not supported here.");
			return;
		}

		if (enabled) {
			try {
				await showNotification.mutateAsync({
					title: "Desktop notifications enabled",
					body: "Native notifications are ready for background updates.",
					showWhenFocused: true,
				});
			} catch {
				// The preference is already saved; the confirmation notification is best-effort.
			}
			return;
		}

		toast.success("Desktop notifications disabled");
	}

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-8">
			<div className="divide-y divide-border rounded-xl border border-border bg-background shadow-sm">
				<SettingsRow
					title="Appearance"
					description="Choose how the renderer resolves the app theme."
				>
					<ThemeSegmentedControl
						disabled={isChangingTheme}
						value={theme?.preference ?? "system"}
						onChange={setTheme}
					/>
				</SettingsRow>

				<SettingsRow
					title="Window size"
					description={
						selectedWindowBounds
							? `${selectedWindowBounds.width} x ${selectedWindowBounds.height}`
							: "Choose the preferred launch size."
					}
				>
					<WindowSizeSelect
						disabled={settingsQuery.isPending || isUpdatingWindowSize}
						value={selectedWindowSizeId}
						onChange={(presetId) => {
							const preset = windowSizePresets.find(
								(option) => option.id === presetId,
							);

							if (preset) {
								updateSettings.mutate({ windowBounds: preset.bounds });
							}
						}}
					/>
				</SettingsRow>

				<SettingsRow
					title="Desktop notifications"
					description={
						notificationsSupported
							? "Use native alerts for background updates."
							: "Unavailable on this system."
					}
				>
					<NotificationPreference
						enabled={desktopNotificationsEnabled}
						isBusy={isUpdatingNotifications}
						isSupported={notificationsSupported}
						onDisable={() => void setNotificationsEnabled(false)}
						onEnable={() => void setNotificationsEnabled(true)}
					/>
				</SettingsRow>
			</div>
		</div>
	);
}

function findMatchingWindowSizePreset(
	windowBounds: WindowBounds | undefined,
): string | undefined {
	if (!windowBounds) {
		return undefined;
	}

	return windowSizePresets.find((preset) => {
		return (
			Math.abs(windowBounds.width - preset.bounds.width) <=
				windowSizeMatchTolerance &&
			Math.abs(windowBounds.height - preset.bounds.height) <=
				windowSizeMatchTolerance
		);
	})?.id;
}

function SettingsRow({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}): React.JSX.Element {
	return (
		<section className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
			<div className="min-w-0">
				<h2 className="text-sm font-medium leading-none">{title}</h2>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
			<div className="flex min-w-0 sm:justify-end">{children}</div>
		</section>
	);
}

function ThemeSegmentedControl({
	disabled,
	onChange,
	value,
}: {
	disabled: boolean;
	onChange: (value: ThemePreference) => void;
	value: ThemePreference;
}): React.JSX.Element {
	return (
		<fieldset className="flex rounded-lg border border-border bg-muted/40 p-0.5">
			<legend className="sr-only">Appearance</legend>
			{themeOptions.map(({ value: optionValue, label, icon: Icon }) => {
				const isSelected = value === optionValue;

				return (
					<Button
						key={optionValue}
						type="button"
						variant={isSelected ? "default" : "ghost"}
						size="sm"
						className="size-9 rounded-md p-0"
						disabled={disabled}
						aria-pressed={isSelected}
						aria-label={label}
						title={label}
						onClick={() => onChange(optionValue)}
					>
						<Icon aria-hidden="true" />
						<span className="sr-only">{label}</span>
					</Button>
				);
			})}
		</fieldset>
	);
}

function WindowSizeSelect({
	disabled,
	onChange,
	value,
}: {
	disabled: boolean;
	onChange: (presetId: string) => void;
	value: string | undefined;
}): React.JSX.Element {
	return (
		<Select
			value={getWindowSizeSelectValue(value)}
			onValueChange={(selectedValue) => {
				const preset = windowSizePresets.find(
					(option) => getWindowSizeSelectValue(option.id) === selectedValue,
				);

				if (preset) {
					onChange(preset.id);
				}
			}}
			disabled={disabled}
		>
			<SelectTrigger className="h-9 w-full min-w-0 sm:w-64">
				<SelectValue placeholder="Choose window size" />
			</SelectTrigger>
			<SelectContent align="end">
				{value ? null : (
					<SelectItem value={getWindowSizeSelectValue(undefined)}>
						Current custom size
					</SelectItem>
				)}
				{windowSizePresets.map((preset) => (
					<SelectItem
						key={preset.id}
						value={getWindowSizeSelectValue(preset.id)}
					>
						{preset.label} - {preset.bounds.width} x {preset.bounds.height}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function getWindowSizeSelectValue(presetId: string | undefined): string {
	const preset = windowSizePresets.find((option) => option.id === presetId);

	if (!preset) {
		return "Current custom size";
	}

	return `${preset.label} - ${preset.bounds.width} x ${preset.bounds.height}`;
}

function NotificationPreference({
	enabled,
	isBusy,
	isSupported,
	onDisable,
	onEnable,
}: {
	enabled: boolean;
	isBusy: boolean;
	isSupported: boolean;
	onDisable: () => void;
	onEnable: () => void;
}): React.JSX.Element {
	return (
		<div className="flex w-full justify-start sm:w-auto sm:justify-end">
			<div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
				<Button
					type="button"
					variant={enabled ? "default" : "ghost"}
					size="sm"
					className="h-8 rounded-md px-3"
					disabled={!isSupported || isBusy}
					aria-pressed={enabled}
					onClick={onEnable}
				>
					On
				</Button>
				<Button
					type="button"
					variant={enabled ? "ghost" : "default"}
					size="sm"
					className="h-8 rounded-md px-3"
					disabled={isBusy}
					aria-pressed={!enabled}
					onClick={onDisable}
				>
					Off
				</Button>
			</div>
		</div>
	);
}
