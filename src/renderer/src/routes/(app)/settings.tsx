import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/settings")({
	component: SettingsRoute,
});

function SettingsRoute(): React.JSX.Element {
	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-10">
			<div className="flex flex-col gap-2">
				<p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
					Preferences
				</p>
				<h1 className="text-2xl font-semibold">Settings</h1>
			</div>

			<p className="text-muted-foreground">
				Theme and window size preferences will move here in the next polish
				step.
			</p>
		</div>
	);
}
