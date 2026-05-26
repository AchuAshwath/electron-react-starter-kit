import "./assets/globals.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

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

// Create QueryClient once at module level — never inside a component
// so it is not recreated on every render
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Data is fresh for 30s; no background re-fetch during this window
			staleTime: 30 * 1000,
			// Keep unused cached data for 5 minutes before garbage collecting
			gcTime: 5 * 60 * 1000,
			// Retry once on failure (IPC errors are usually transient)
			retry: 1,
		},
	},
});

const root = document.getElementById("root");

if (root) {
	createRoot(root).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} />
			</QueryClientProvider>
		</StrictMode>,
	);
}
