import "./assets/globals.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { applyThemeClass, readInitialThemeState } from "./core/theme/theme.dom";
import { themeQueries } from "./core/theme/theme.queries";
import { ThemeProvider } from "./core/theme/theme-provider";
import { queryClient } from "./lib/query-client";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree, context: { queryClient } });

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
						<Toaster />
					</TooltipProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</StrictMode>,
	);
} else {
	renderMissingRootFallback();
}

function renderMissingRootFallback(): void {
	const fallback = document.createElement("main");
	const panel = document.createElement("section");
	const title = document.createElement("h1");
	const description = document.createElement("p");

	fallback.setAttribute("role", "alert");
	fallback.style.minHeight = "100svh";
	fallback.style.display = "grid";
	fallback.style.placeItems = "center";
	fallback.style.padding = "24px";
	fallback.style.fontFamily = "system-ui, sans-serif";
	fallback.style.background = "#fff";
	fallback.style.color = "#171717";

	panel.style.maxWidth = "420px";
	panel.style.border = "1px solid #e5e5e5";
	panel.style.borderRadius = "12px";
	panel.style.padding = "24px";

	title.textContent = "Could not start renderer";
	title.style.margin = "0";
	title.style.fontSize = "18px";

	description.textContent =
		"The app shell is missing its root element. Check the renderer HTML entrypoint.";
	description.style.margin = "8px 0 0";
	description.style.color = "#525252";
	description.style.lineHeight = "1.5";

	panel.append(title, description);
	fallback.append(panel);
	document.body.replaceChildren(fallback);
}
