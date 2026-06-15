import type { IpcMainInvokeEvent } from "electron";
import { z } from "zod";
import { UntrustedIpcSenderError } from "../security";

type IpcMainLike = {
	handle: (
		channel: string,
		listener: (event: IpcMainInvokeEvent, payload?: unknown) => unknown,
	) => void;
};
type IpcHandlerEvent = Pick<IpcMainInvokeEvent, "senderFrame">;

type RegisterIpcHandlerOptions<TInput, TOutput> = {
	channel: string;
	input?: z.ZodType<TInput>;
	handler: (
		input: TInput,
		event: IpcMainInvokeEvent,
	) => TOutput | Promise<TOutput>;
};

type IpcHandlerRegistrarOptions = {
	ipcMain: IpcMainLike;
	isDev: boolean;
	assertTrustedSender: (
		event: IpcHandlerEvent,
		options: { isDev: boolean },
	) => void;
};

export const ipcHandlerErrorCodes = {
	badRequest: "BAD_REQUEST",
	internalError: "INTERNAL_ERROR",
	untrustedSender: "UNTRUSTED_SENDER",
} as const;

export type IpcHandlerErrorCode =
	(typeof ipcHandlerErrorCodes)[keyof typeof ipcHandlerErrorCodes];

export class IpcHandlerError extends Error {
	constructor(
		public readonly code: IpcHandlerErrorCode,
		message: string,
	) {
		super(message);
		this.name = "IpcHandlerError";
	}
}

function sanitizeIpcError(error: unknown): IpcHandlerError {
	if (error instanceof IpcHandlerError) {
		return error;
	}

	if (error instanceof UntrustedIpcSenderError) {
		return new IpcHandlerError(
			ipcHandlerErrorCodes.untrustedSender,
			"Blocked IPC call from an untrusted sender.",
		);
	}

	if (error instanceof z.ZodError) {
		return new IpcHandlerError(
			ipcHandlerErrorCodes.badRequest,
			"Invalid IPC request payload.",
		);
	}

	return new IpcHandlerError(
		ipcHandlerErrorCodes.internalError,
		"IPC handler failed.",
	);
}

export function createIpcHandlerRegistrar({
	ipcMain,
	isDev,
	assertTrustedSender,
}: IpcHandlerRegistrarOptions) {
	return function registerIpcHandler<TInput = undefined, TOutput = unknown>({
		channel,
		input,
		handler,
	}: RegisterIpcHandlerOptions<TInput, TOutput>): void {
		ipcMain.handle(channel, async (event, payload: unknown) => {
			try {
				assertTrustedSender(event, { isDev });

				const parsedInput = input ? input.parse(payload) : undefined;

				return await handler(parsedInput as TInput, event);
			} catch (error) {
				throw sanitizeIpcError(error);
			}
		});
	};
}

export type IpcHandlerRegistrar = ReturnType<typeof createIpcHandlerRegistrar>;
