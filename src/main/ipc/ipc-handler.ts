import type { IpcMainInvokeEvent } from "electron";
import type { z } from "zod";

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
			assertTrustedSender(event, { isDev });

			const parsedInput = input ? input.parse(payload) : undefined;

			return handler(parsedInput as TInput, event);
		});
	};
}

export type IpcHandlerRegistrar = ReturnType<typeof createIpcHandlerRegistrar>;
