import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileUpload } from "./file-upload";

describe("FileUpload", () => {
	it("shows the selected file and notifies consumers", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		const file = new File(["hello"], "notes.txt", { type: "text/plain" });

		const { container } = render(<FileUpload onValueChange={onValueChange} />);
		const input = getFileInput(container);

		await user.upload(input, file);

		expect(screen.getByText("notes.txt")).toBeInTheDocument();
		expect(screen.getByText("5 B")).toBeInTheDocument();
		expect(onValueChange).toHaveBeenCalledWith([file]);
	});

	it("shows a validation message when a file is too large", async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();
		const file = new File(["hello"], "notes.txt", { type: "text/plain" });

		const { container } = render(
			<FileUpload maxSize={4} onValueChange={onValueChange} />,
		);
		const input = getFileInput(container);

		await user.upload(input, file);

		await waitFor(() => {
			expect(
				screen.getByText("notes.txt is larger than 4 B."),
			).toBeInTheDocument();
		});
		expect(onValueChange).not.toHaveBeenCalled();
	});
});

function getFileInput(container: HTMLElement): HTMLInputElement {
	const input = container.querySelector<HTMLInputElement>('input[type="file"]');

	if (!input) {
		throw new Error("Expected file input to be rendered.");
	}

	return input;
}
