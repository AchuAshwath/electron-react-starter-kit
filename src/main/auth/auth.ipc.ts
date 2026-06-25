import {
	IpcHandlerError,
	type IpcHandlerRegistrar,
	ipcHandlerErrorCodes,
} from "../ipc/ipc-handler";
import { authLogger } from "../logging/logger";
import { authIpcChannels } from "./auth.channels";
import type { AuthProvider } from "./auth.types";
import { authSignInRequestSchema } from "./auth.types";

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
		channel: authIpcChannels.refreshSession,
		handler: async () => {
			const session = await provider.refreshSession();

			authLogger.info("Auth session refreshed", {
				provider: provider.id,
				signedIn: Boolean(session),
			});

			return session;
		},
	});

	registerIpcHandler({
		channel: authIpcChannels.signIn,
		input: authSignInRequestSchema,
		handler: async (input) => {
			try {
				const session = await provider.signIn(input);

				authLogger.info("Auth session created", {
					provider: session.user.provider,
					strategy: input.strategy,
				});

				return session;
			} catch {
				authLogger.warn("Auth session creation failed", {
					provider: provider.id,
					strategy: input.strategy,
				});

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
			authLogger.info("Auth session cleared", {
				provider: provider.id,
			});
		},
	});
}
