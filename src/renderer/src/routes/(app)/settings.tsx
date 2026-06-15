import { createFileRoute } from "@tanstack/react-router";
import {
	CheckIcon,
	LaptopIcon,
	Maximize2Icon,
	MonitorIcon,
	MoonIcon,
	SunIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
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
	description: string;
	icon: typeof MonitorIcon;
}> = [
	{
		value: "system",
		label: "System",
		description: "Follow the operating system appearance.",
		icon: MonitorIcon,
	},
	{
		value: "light",
		label: "Light",
		description: "Use a bright interface in every session.",
		icon: SunIcon,
	},
	{
		value: "dark",
		label: "Dark",
		description: "Use a low-light interface in every session.",
		icon: MoonIcon,
	},
];

const windowSizePresets: Array<{
	id: string;
	label: string;
	description: string;
	bounds: WindowBounds;
}> = [
	{
		id: "compact",
		label: "Compact",
		description: "Good for quick previews and small displays.",
		bounds: { width: 900, height: 670 },
	},
	{
		id: "standard",
		label: "Standard",
		description: "Balanced desktop default for most apps.",
		bounds: { width: 1100, height: 720 },
	},
	{
		id: "wide",
		label: "Wide",
		description: "More horizontal room for side panels.",
		bounds: { width: 1280, height: 800 },
	},
	{
		id: "workbench",
		label: "Workbench",
		description: "Roomy layout for developer tools and data views.",
		bounds: { width: 1440, height: 900 },
	},
];

function SettingsRoute(): React.JSX.Element {
	const settingsQuery = useSettings();
	const updateSettings = useUpdateSettings();
	const { theme, setTheme, isChangingTheme } = useThemeContext();

	useSettingsUpdatedListener();

	const selectedWindowBounds = settingsQuery.data?.windowBounds;
	const isUpdatingWindowSize = updateSettings.isPending;

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8">
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Tune the starter kit defaults that are already backed by the main
					process settings store.
				</p>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-3">
						<div className="flex flex-col gap-1">
							<CardTitle>Appearance</CardTitle>
							<CardDescription>
								Choose how the renderer should resolve the app theme.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-3">
					{themeOptions.map(({ value, label, description, icon: Icon }) => {
						const isSelected = theme?.preference === value;

						return (
							<Button
								key={value}
								type="button"
								variant="outline"
								className={
									isSelected
										? "min-h-24 justify-start gap-3 whitespace-normal border-foreground/20 bg-muted/70 px-3 py-3 text-left"
										: "min-h-24 justify-start gap-3 whitespace-normal bg-card px-3 py-3 text-left"
								}
								disabled={isChangingTheme}
								aria-pressed={isSelected}
								onClick={() => setTheme(value)}
							>
								<Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
								<span className="flex min-w-0 flex-1 flex-col gap-1 leading-normal">
									<span className="text-sm font-medium leading-none">
										{label}
									</span>
									<span className="break-words text-xs font-normal leading-snug text-muted-foreground">
										{description}
									</span>
								</span>
								{isSelected && (
									<CheckIcon
										className="h-4 w-4 shrink-0 text-muted-foreground"
										aria-hidden="true"
									/>
								)}
							</Button>
						);
					})}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-start justify-between gap-3">
						<div className="flex flex-col gap-1">
							<CardTitle>Window Size</CardTitle>
							<CardDescription>
								Resize this window and remember the latest size.
							</CardDescription>
						</div>
						<Maximize2Icon className="h-4 w-4 text-muted-foreground" />
					</div>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-2">
					{windowSizePresets.map((preset) => {
						const isSelected =
							selectedWindowBounds?.width === preset.bounds.width &&
							selectedWindowBounds.height === preset.bounds.height;

						return (
							<Button
								key={preset.id}
								type="button"
								variant="outline"
								className={
									isSelected
										? "min-h-24 justify-start gap-3 whitespace-normal border-foreground/20 bg-muted/70 px-3 py-3 text-left"
										: "min-h-24 justify-start gap-3 whitespace-normal bg-card px-3 py-3 text-left"
								}
								disabled={settingsQuery.isPending || isUpdatingWindowSize}
								aria-pressed={isSelected}
								onClick={() =>
									updateSettings.mutate({ windowBounds: preset.bounds })
								}
							>
								<LaptopIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
								<span className="flex min-w-0 flex-1 flex-col gap-1 leading-normal">
									<span className="flex flex-wrap items-center gap-2">
										<span className="text-sm font-medium leading-none">
											{preset.label}
										</span>
										<span className="text-xs font-normal leading-none text-muted-foreground">
											{preset.bounds.width} x {preset.bounds.height}
										</span>
									</span>
									<span className="break-words text-xs font-normal leading-snug text-muted-foreground">
										{preset.description}
									</span>
								</span>
								{isSelected && (
									<CheckIcon
										className="h-4 w-4 shrink-0 text-muted-foreground"
										aria-hidden="true"
									/>
								)}
							</Button>
						);
					})}
				</CardContent>
			</Card>
		</div>
	);
}
