import { type ErrorComponentProps, Link } from "@tanstack/react-router";
import { AlertTriangleIcon, HomeIcon, LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "./ui/button";

type RouteErrorViewProps = ErrorComponentProps & {
	title?: string;
	description?: string;
	retryLabel?: string;
};

function RouteErrorView({
	description = "The app hit an unexpected problem. Try again, or return home if the issue keeps happening.",
	error,
	reset,
	retryLabel = "Try again",
	title = "Something went wrong",
}: RouteErrorViewProps): React.JSX.Element {
	const canShowDetails = import.meta.env.DEV;
	const [showDetails, setShowDetails] = useState(canShowDetails);
	const errorMessage = getErrorMessage(error);

	return (
		<main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
			<section className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-sm">
				<div className="flex items-start gap-3">
					<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
						<AlertTriangleIcon aria-hidden="true" className="size-5" />
					</div>
					<div className="min-w-0 flex-1">
						<h1 className="text-lg font-semibold tracking-tight">{title}</h1>
						<p className="mt-2 text-sm leading-6 text-muted-foreground">
							{description}
						</p>
					</div>
				</div>

				<div className="mt-6 flex flex-wrap gap-2">
					<Button type="button" onClick={reset}>
						{retryLabel}
					</Button>
					<Link to="/" className={buttonVariants({ variant: "outline" })}>
						<HomeIcon aria-hidden="true" />
						Home
					</Link>
					{canShowDetails ? (
						<Button
							type="button"
							variant="ghost"
							onClick={() => setShowDetails((isVisible) => !isVisible)}
						>
							{showDetails ? "Hide details" : "Show details"}
						</Button>
					) : null}
				</div>

				{canShowDetails && showDetails ? (
					<pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
						<code>{errorMessage}</code>
					</pre>
				) : null}
			</section>
		</main>
	);
}

function AppRouteErrorView(props: ErrorComponentProps): React.JSX.Element {
	return (
		<RouteErrorView
			{...props}
			title="Could not load this workspace"
			description="One of the protected app routes failed while loading. Retry the route, or return home to recover."
		/>
	);
}

function AuthRouteErrorView(props: ErrorComponentProps): React.JSX.Element {
	return (
		<RouteErrorView
			{...props}
			title="Could not load authentication"
			description="The app could not complete the authentication check. Try again before continuing."
		/>
	);
}

function RouteNotFoundView(): React.JSX.Element {
	return (
		<main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
			<section className="w-full max-w-md rounded-xl border border-border bg-background p-6 text-center shadow-sm">
				<p className="text-sm font-medium text-muted-foreground">404</p>
				<h1 className="mt-2 text-2xl font-semibold tracking-tight">
					Page not found
				</h1>
				<p className="mt-2 text-sm leading-6 text-muted-foreground">
					This route does not exist in the starter. Return home and choose an
					available view.
				</p>
				<Link
					to="/"
					className={buttonVariants({ variant: "default", className: "mt-6" })}
				>
					<HomeIcon aria-hidden="true" />
					Go home
				</Link>
			</section>
		</main>
	);
}

function RoutePendingView({
	label = "Loading...",
}: {
	label?: string;
}): React.JSX.Element {
	return (
		<main className="flex min-h-svh items-center justify-center bg-muted/40 p-6">
			<div
				role="status"
				aria-live="polite"
				className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm"
			>
				<LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />
				<span>{label}</span>
			</div>
		</main>
	);
}

function AppRoutePendingView(): React.JSX.Element {
	return <RoutePendingView label="Checking app session..." />;
}

function AuthRoutePendingView(): React.JSX.Element {
	return <RoutePendingView label="Checking authentication..." />;
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	if (typeof error === "string" && error.length > 0) {
		return error;
	}

	return "Unknown error";
}

export {
	AppRouteErrorView,
	AppRoutePendingView,
	AuthRouteErrorView,
	AuthRoutePendingView,
	getErrorMessage,
	RouteErrorView,
	RouteNotFoundView,
	RoutePendingView,
};
