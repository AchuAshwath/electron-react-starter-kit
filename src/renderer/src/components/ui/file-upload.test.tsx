import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

	it("passes dropped files to the native file callback", () => {
		const onFilesSelected = vi.fn();
		const file = new File(["hello"], "notes.txt", { type: "text/plain" });

		render(<FileUpload onChoose={vi.fn()} onFilesSelected={onFilesSelected} />);

		fireEvent.drop(screen.getByRole("group", { name: "File upload" }), {
			dataTransfer: {
				files: [file],
			},
		});

		expect(onFilesSelected).toHaveBeenCalledWith([file]);
	});

	it("removes selected paths when a remove handler is provided", async () => {
		const user = userEvent.setup();
		const onSelectedPathsChange = vi.fn();

		render(
			<FileUpload
				selectedPaths={["C:\\tmp\\notes.txt"]}
				onSelectedPathsChange={onSelectedPathsChange}
				onChoose={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Remove notes.txt" }));

		expect(onSelectedPathsChange).toHaveBeenCalledWith([]);
	});
});

function getFileInput(container: HTMLElement): HTMLInputElement {
	const input = container.querySelector<HTMLInputElement>('input[type="file"]');

	if (!input) {
		throw new Error("Expected file input to be rendered.");
	}

	return input;
}
