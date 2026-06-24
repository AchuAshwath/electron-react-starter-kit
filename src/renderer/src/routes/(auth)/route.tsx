import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)")({
	component: AuthLayout,
});

function AuthLayout(): React.JSX.Element {
	return (
		<main className="min-h-svh bg-background">
			<Outlet />
		</main>
	);
}
