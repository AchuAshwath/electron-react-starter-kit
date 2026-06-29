import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
	AuthRouteErrorView,
	AuthRoutePendingView,
} from "../../components/route-fallbacks";

export const Route = createFileRoute("/(auth)")({
	component: AuthLayout,
	errorComponent: AuthRouteErrorView,
	pendingComponent: AuthRoutePendingView,
});

function AuthLayout(): React.JSX.Element {
	return (
		<main className="min-h-svh bg-background">
			<Outlet />
		</main>
	);
}
