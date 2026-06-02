import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
	it("combines class names", () => {
		expect(cn("flex", "items-center")).toBe("flex items-center");
	});

	it("merges conflicting Tailwind classes with the later class winning", () => {
		expect(cn("p-2 text-sm", "p-4")).toBe("text-sm p-4");
	});
});
