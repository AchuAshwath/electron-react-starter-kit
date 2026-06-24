import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ThemeSwitcher } from "../../components/theme-switcher";
import { buttonVariants } from "../../components/ui/button";
import { cn } from "../../lib/utils";

export const Route = createFileRoute("/(app)")({
	component: AppLayout,
});

function AppLayout(): React.JSX.Element {
	return (
		<>
			<header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
				<div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
					<nav className="flex items-center gap-1">
						<Link
							to="/"
							className={cn(
								buttonVariants({ variant: "ghost", size: "sm" }),
								"text-muted-foreground hover:text-foreground [&.active]:bg-muted [&.active]:font-medium [&.active]:text-foreground",
							)}
						>
							Home
						</Link>
						<Link
							to="/settings"
							className={cn(
								buttonVariants({ variant: "ghost", size: "sm" }),
								"text-muted-foreground hover:text-foreground [&.active]:bg-muted [&.active]:font-medium [&.active]:text-foreground",
							)}
						>
							Settings
						</Link>
					</nav>
					<div className="flex items-center gap-2">
						<Link
							to="/login"
							className={cn(
								buttonVariants({ variant: "outline", size: "sm" }),
								"text-muted-foreground hover:text-foreground",
							)}
						>
							Login
						</Link>
						<ThemeSwitcher />
					</div>
				</div>
			</header>
			<Outlet />
		</>
	);
}
