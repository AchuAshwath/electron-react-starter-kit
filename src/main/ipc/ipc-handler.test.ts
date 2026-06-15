import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { UntrustedIpcSenderError } from "../security";
import {
	createIpcHandlerRegistrar,
	IpcHandlerError,
	ipcHandlerErrorCodes,
} from "./ipc-handler";

function createTestRegistrar() {
	const handlers = new Map<string, (...args: never[]) => unknown>();
	const ipcMain = {
		handle: vi.fn((channel, handler) => {
			handlers.set(channel, handler as (...args: never[]) => unknown);
		}),
	};
	const assertTrustedSender = vi.fn();
	const registerIpcHandler = createIpcHandlerRegistrar({
		ipcMain,
		isDev: true,
		assertTrustedSender,
	});

	return {
		assertTrustedSender,
		handlers,
		ipcMain,
		registerIpcHandler,
	};
}

describe("createIpcHandlerRegistrar", () => {
	it("registers an ipcMain handler for the channel", () => {
		const { ipcMain, registerIpcHandler } = createTestRegistrar();

		registerIpcHandler({
			channel: "system:get-version",
			handler: () => "1.0.0",
		});

		expect(ipcMain.handle).toHaveBeenCalledWith(
			"system:get-version",
			expect.any(Function),
		);
	});

	it("validates the sender before running the handler", async () => {
		const { assertTrustedSender, handlers, registerIpcHandler } =
			createTestRegistrar();
		const handler = vi.fn(() => "1.0.0");
		const event = { senderFrame: { url: "http://localhost:5173" } };

		registerIpcHandler({
			channel: "system:get-version",
			handler,
		});

		await handlers.get("system:get-version")?.(event as never);

		expect(assertTrustedSender).toHaveBeenCalledWith(event, { isDev: true });
		expect(handler).toHaveBeenCalledWith(undefined, event);
	});

	it("does not run the handler when sender validation fails", async () => {
		const { assertTrustedSender, handlers, registerIpcHandler } =
			createTestRegistrar();
		const handler = vi.fn();
		assertTrustedSender.mockImplementation(() => {
			throw new UntrustedIpcSenderError("https://example.com");
		});

		registerIpcHandler({
			channel: "system:get-version",
			handler,
		});

		await expect(
			handlers.get("system:get-version")?.({
				senderFrame: { url: "https://example.com" },
			} as never),
		).rejects.toMatchObject({
			code: ipcHandlerErrorCodes.untrustedSender,
			message: "Blocked IPC call from an untrusted sender.",
		});
		expect(handler).not.toHaveBeenCalled();
	});

	it("parses input before calling the handler", async () => {
		const { handlers, registerIpcHandler } = createTestRegistrar();
		const handler = vi.fn((input: { theme: "light" | "dark" }) => input);

		registerIpcHandler({
			channel: "theme:set-preference",
			input: z.object({ theme: z.enum(["light", "dark"]) }),
			handler,
		});

		await expect(
			handlers.get("theme:set-preference")?.(
				{ senderFrame: { url: "http://localhost:5173" } } as never,
				{ theme: "dark" } as never,
			),
		).resolves.toEqual({ theme: "dark" });
		expect(handler).toHaveBeenCalledWith(
			{ theme: "dark" },
			expect.objectContaining({
				senderFrame: { url: "http://localhost:5173" },
			}),
		);
	});

	it("rejects invalid input", async () => {
		const { handlers, registerIpcHandler } = createTestRegistrar();
		const handler = vi.fn();

		registerIpcHandler({
			channel: "theme:set-preference",
			input: z.object({ theme: z.enum(["light", "dark"]) }),
			handler,
		});

		await expect(
			handlers.get("theme:set-preference")?.(
				{ senderFrame: { url: "http://localhost:5173" } } as never,
				{ theme: "system" } as never,
			),
		).rejects.toMatchObject({
			code: ipcHandlerErrorCodes.badRequest,
			message: "Invalid IPC request payload.",
		});
		expect(handler).not.toHaveBeenCalled();
	});

	it("sanitizes unknown handler errors", async () => {
		const { handlers, registerIpcHandler } = createTestRegistrar();

		registerIpcHandler({
			channel: "system:get-version",
			handler: () => {
				throw new Error("database password leaked");
			},
		});

		await expect(
			handlers.get("system:get-version")?.({
				senderFrame: { url: "http://localhost:5173" },
			} as never),
		).rejects.toMatchObject({
			code: ipcHandlerErrorCodes.internalError,
			message: "IPC handler failed.",
		});
	});

	it("passes through already-sanitized ipc handler errors", async () => {
		const { handlers, registerIpcHandler } = createTestRegistrar();

		registerIpcHandler({
			channel: "system:get-version",
			handler: () => {
				throw new IpcHandlerError(
					ipcHandlerErrorCodes.badRequest,
					"Custom sanitized message.",
				);
			},
		});

		await expect(
			handlers.get("system:get-version")?.({
				senderFrame: { url: "http://localhost:5173" },
			} as never),
		).rejects.toMatchObject({
			code: ipcHandlerErrorCodes.badRequest,
			message: "Custom sanitized message.",
		});
	});

	it("supports async handlers", async () => {
		const { handlers, registerIpcHandler } = createTestRegistrar();

		registerIpcHandler({
			channel: "system:get-version",
			handler: async () => "1.0.0",
		});

		await expect(
			handlers.get("system:get-version")?.({
				senderFrame: { url: "http://localhost:5173" },
			} as never),
		).resolves.toBe("1.0.0");
	});
});
