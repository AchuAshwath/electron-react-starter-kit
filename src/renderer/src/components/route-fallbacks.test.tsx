import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	getErrorMessage,
	RouteErrorView,
	RouteNotFoundView,
	RoutePendingView,
} from "./route-fallbacks";

vi.mock("@tanstack/react-router", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@tanstack/react-router")>();

	return {
		...actual,
		Link: ({
			children,
			to,
			...props
		}: {
			children: React.ReactNode;
			to: string;
		}) => (
			<a href={to} {...props}>
				{children}
			</a>
		),
	};
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("route fallback views", () => {
	it("renders an error recovery view with details and reset action", async () => {
		const user = userEvent.setup();
		const reset = vi.fn();

		render(<RouteErrorView error={new Error("Kaboom")} reset={reset} />);

		expect(
			screen.getByRole("heading", { name: "Something went wrong" }),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
		expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
			"href",
			"/",
		);
		expect(screen.getByText("Kaboom")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Try again" }));

		expect(reset).toHaveBeenCalledTimes(1);
	});

	it("allows error details to be hidden in development", async () => {
		const user = userEvent.setup();

		render(
			<RouteErrorView error={new Error("No route data")} reset={vi.fn()} />,
		);

		await user.click(screen.getByRole("button", { name: "Hide details" }));

		expect(screen.queryByText("No route data")).not.toBeInTheDocument();
	});

	it("does not expose error details in production", () => {
		vi.stubEnv("DEV", false);

		render(
			<RouteErrorView
				error={new Error("C:/Users/example/secret-token.txt")}
				reset={vi.fn()}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: "Show details" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("C:/Users/example/secret-token.txt"),
		).not.toBeInTheDocument();
	});

	it("renders a starter not found page", () => {
		render(<RouteNotFoundView />);

		expect(
			screen.getByRole("heading", { name: "Page not found" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute(
			"href",
			"/",
		);
	});

	it("renders an accessible pending state", () => {
		render(<RoutePendingView label="Checking route..." />);

		expect(screen.getByRole("status")).toHaveTextContent("Checking route...");
	});

	it("normalizes unknown error values", () => {
		expect(getErrorMessage(new Error("Broken"))).toBe("Broken");
		expect(getErrorMessage("String failure")).toBe("String failure");
		expect(getErrorMessage(null)).toBe("Unknown error");
	});
});
