import { createFileRoute } from "@tanstack/react-router";
import {
	BellOffIcon,
	BellRingIcon,
	CheckIcon,
	LaptopIcon,
	type LucideIcon,
	Maximize2Icon,
	MonitorIcon,
	MoonIcon,
	SunIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
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
import { cn } from "../../lib/utils";

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
		try {
			const permission = await setDesktopNotifications.mutateAsync(enabled);

			if (!permission.supported) {
				toast.error("Desktop notifications are not supported here.");
				return;
			}

			toast.success(
				enabled
					? "Desktop notifications enabled"
					: "Desktop notifications disabled",
			);
		} catch {
			toast.error("Could not update notification preference.");
		}
	}

	async function sendTestNotification(): Promise<void> {
		try {
			const result = await showNotification.mutateAsync({
				title: "Notifications are ready",
				body: "This starter kit can send native desktop notifications from the main process.",
			});

			if (result.shown) {
				toast.success("Test notification sent");
				return;
			}

			toast.message("Test notification skipped", {
				description:
					result.reason === "disabled"
						? "Enable desktop notifications first."
						: "This platform does not support native notifications.",
			});
		} catch {
			toast.error("Could not send test notification.");
		}
	}

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Tune the starter kit defaults that are already backed by the main
					process settings store.
				</p>
			</div>

			<SettingsSection
				title="Appearance"
				description="Choose how the renderer should resolve the app theme."
			>
				<OptionGrid columns="sm:grid-cols-3" label="Appearance">
					{themeOptions.map(({ value, label, helper, icon: Icon }) => {
						const isSelected = theme?.preference === value;

						return (
							<OptionButton
								key={value}
								icon={Icon}
								label={label}
								helper={helper}
								selected={isSelected}
								disabled={isChangingTheme}
								onClick={() => setTheme(value)}
							/>
						);
					})}
				</OptionGrid>
			</SettingsSection>

			<SettingsSection
				title="Window Size"
				description="Resize this window and remember the latest size."
				action={<Maximize2Icon className="h-4 w-4 text-muted-foreground" />}
			>
				<OptionGrid columns="sm:grid-cols-2" label="Window size">
					{windowSizePresets.map((preset) => {
						const isSelected = selectedWindowSizeId === preset.id;

						return (
							<OptionButton
								key={preset.id}
								icon={LaptopIcon}
								label={preset.label}
								helper={`${preset.bounds.width} x ${preset.bounds.height} - ${preset.helper}`}
								selected={isSelected}
								disabled={settingsQuery.isPending || isUpdatingWindowSize}
								onClick={() =>
									updateSettings.mutate({ windowBounds: preset.bounds })
								}
							/>
						);
					})}
				</OptionGrid>
			</SettingsSection>

			<SettingsSection
				title="Notifications"
				description="Control whether the app may send native desktop notifications."
				action={<BellRingIcon className="h-4 w-4 text-muted-foreground" />}
			>
				<OptionGrid columns="sm:grid-cols-2" label="Notifications">
					<OptionButton
						icon={BellRingIcon}
						label="Enabled"
						helper={
							notificationsSupported
								? "Allow desktop alerts"
								: "Unavailable here"
						}
						selected={desktopNotificationsEnabled}
						disabled={!notificationsSupported || isUpdatingNotifications}
						onClick={() => void setNotificationsEnabled(true)}
					/>
					<OptionButton
						icon={BellOffIcon}
						label="Disabled"
						helper="In-app feedback only"
						selected={!desktopNotificationsEnabled}
						disabled={isUpdatingNotifications}
						onClick={() => void setNotificationsEnabled(false)}
					/>
				</OptionGrid>
				<div className="flex justify-start">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={
							!desktopNotificationsEnabled ||
							!notificationsSupported ||
							isUpdatingNotifications
						}
						onClick={() => void sendTestNotification()}
					>
						Send test
					</Button>
				</div>
			</SettingsSection>
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

function SettingsSection({
	title,
	description,
	action,
	children,
}: {
	title: string;
	description: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}): React.JSX.Element {
	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<h2 className="text-base font-medium leading-snug">{title}</h2>
					<p className="text-sm text-muted-foreground">{description}</p>
				</div>
				{action}
			</div>
			{children}
		</section>
	);
}

function OptionGrid({
	children,
	columns,
	label,
}: {
	children: React.ReactNode;
	columns: string;
	label: string;
}): React.JSX.Element {
	return (
		<fieldset className={cn("grid gap-2", columns)}>
			<legend className="sr-only">{label}</legend>
			{children}
		</fieldset>
	);
}

function OptionButton({
	icon: Icon,
	label,
	helper,
	selected,
	disabled,
	onClick,
}: {
	icon: LucideIcon;
	label: string;
	helper: string;
	selected: boolean;
	disabled?: boolean;
	onClick: () => void;
}): React.JSX.Element {
	return (
		<Button
			type="button"
			variant="outline"
			size="lg"
			className={cn(
				"group min-h-14 justify-start gap-2.5 whitespace-normal border-border bg-background px-3 py-2 text-left shadow-none hover:border-border hover:bg-muted/50",
				selected
					? "border-primary/60 bg-primary/5 text-foreground ring-1 ring-primary/20 hover:border-primary/60 hover:bg-primary/5"
					: "text-muted-foreground hover:text-foreground",
			)}
			disabled={disabled}
			aria-pressed={selected}
			onClick={onClick}
		>
			<Icon
				aria-hidden="true"
				data-icon="inline-start"
				className={cn(
					"text-muted-foreground group-hover:text-foreground",
					selected && "text-primary group-hover:text-primary",
				)}
			/>
			<span className="flex min-w-0 flex-1 flex-col gap-1">
				<span className="flex min-w-0 items-start justify-between gap-3">
					<span className="truncate text-sm font-medium leading-none">
						{label}
					</span>
				</span>
				<span className="truncate text-xs font-normal leading-none text-muted-foreground">
					{helper}
				</span>
			</span>
			{selected ? (
				<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
					<CheckIcon aria-hidden="true" className="size-3" />
				</span>
			) : null}
		</Button>
	);
}
