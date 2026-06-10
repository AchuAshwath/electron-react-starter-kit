import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeSwitcher } from "../components/theme-switcher";

function RootLayout() {
	return (
		<>
			<header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
				<div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
					<nav className="flex items-center gap-1">
						<Link
							to="/"
							className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-muted [&.active]:font-medium [&.active]:text-foreground"
						>
							Home
						</Link>
						<Link
							to="/about"
							className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-muted [&.active]:font-medium [&.active]:text-foreground"
						>
							About
						</Link>
					</nav>
					<ThemeSwitcher />
				</div>
			</header>
			<Outlet />
			<TanStackRouterDevtools />
			<ReactQueryDevtools initialIsOpen={false} />
		</>
	);
}

export const Route = createRootRoute({ component: RootLayout });
