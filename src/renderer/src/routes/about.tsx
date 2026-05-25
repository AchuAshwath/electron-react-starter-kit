import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	component: AboutRoute,
});

function AboutRoute(): React.JSX.Element {
	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-10">
			<div className="flex flex-col gap-2">
				<p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
					Template route
				</p>
				<h1 className="text-2xl font-semibold">About this starter kit</h1>
			</div>

			<p className="text-muted-foreground">
				This page confirms TanStack Router is wired into the Electron renderer
				and gives the template a second typed route.
			</p>
		</div>
	);
}
