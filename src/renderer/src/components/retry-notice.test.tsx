import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RetryNotice } from "./retry-notice";

describe("RetryNotice", () => {
	it("renders retry copy and calls the retry action", async () => {
		const user = userEvent.setup();
		const onRetry = vi.fn();

		render(
			<RetryNotice
				title="Could not load settings"
				description="Try loading settings again."
				onRetry={onRetry}
			/>,
		);

		expect(screen.getByText("Could not load settings")).toBeInTheDocument();
		expect(screen.getByText("Try loading settings again.")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Retry" }));

		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it("disables the retry button while retrying", () => {
		render(
			<RetryNotice
				title="Could not load"
				description="Retry later."
				isRetrying
				onRetry={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: "Retrying..." })).toBeDisabled();
	});
});
