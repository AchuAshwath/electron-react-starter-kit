import {
	IpcHandlerError,
	type IpcHandlerRegistrar,
	ipcHandlerErrorCodes,
} from "../ipc/ipc-handler";
import { authLogger } from "../logging/logger";
import { authIpcChannels } from "./auth.channels";
import type { AuthProvider } from "./auth.types";

type RegisterAuthIpcHandlersOptions = {
	provider: AuthProvider;
};

export function registerAuthIpcHandlers(
	registerIpcHandler: IpcHandlerRegistrar,
	{ provider }: RegisterAuthIpcHandlersOptions,
): void {
	registerIpcHandler({
		channel: authIpcChannels.getSession,
		handler: () => provider.getSession(),
	});

	registerIpcHandler({
		channel: authIpcChannels.signIn,
		handler: async () => {
			try {
				const session = await provider.signIn();

				authLogger.info("Auth session created", {
					provider: session.user.provider,
				});

				return session;
			} catch {
				authLogger.warn("Auth session creation failed");

				throw new IpcHandlerError(
					ipcHandlerErrorCodes.internalError,
					"Could not create an auth session.",
				);
			}
		},
	});

	registerIpcHandler({
		channel: authIpcChannels.signOut,
		handler: async () => {
			await provider.signOut();
			authLogger.info("Auth session cleared");
		},
	});
}
