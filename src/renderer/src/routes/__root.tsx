import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
	RouteErrorView,
	RouteNotFoundView,
	RoutePendingView,
} from "../components/route-fallbacks";

type RouterContext = {
	queryClient: QueryClient;
};

function RootLayout() {
	return (
		<>
			<Outlet />
			<TanStackRouterDevtools />
			<ReactQueryDevtools initialIsOpen={false} />
		</>
	);
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
	errorComponent: RouteErrorView,
	notFoundComponent: RouteNotFoundView,
	pendingComponent: RoutePendingView,
});
