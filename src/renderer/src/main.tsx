import "./assets/globals.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "./components/ui/tooltip";
import { applyThemeClass, readInitialThemeState } from "./core/theme/theme.dom";
import { themeQueries } from "./core/theme/theme.queries";
import { ThemeProvider } from "./core/theme/theme-provider";
import { queryClient } from "./lib/query-client";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const root = document.getElementById("root");
const initialThemeState = readInitialThemeState();

if (initialThemeState) {
	applyThemeClass(initialThemeState.resolvedTheme);
	queryClient.setQueryData(themeQueries.current().queryKey, initialThemeState);
}

if (root) {
	createRoot(root).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider>
					<TooltipProvider delay={300}>
						<RouterProvider router={router} />
					</TooltipProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</StrictMode>,
	);
}
