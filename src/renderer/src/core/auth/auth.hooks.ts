import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authQueries } from "./auth.queries";

const deviceSignInRequest = { strategy: "device" } as const;

export function useAuthSession() {
	return useQuery(authQueries.session());
}

export function useSignIn() {
	const queryClient = useQueryClient();
	const queryKey = authQueries.session().queryKey;

	return useMutation({
		mutationFn: () => window.api.auth.signIn(deviceSignInRequest),
		onSuccess: (session) => {
			queryClient.setQueryData(queryKey, session);
		},
	});
}

export function useRefreshSession() {
	const queryClient = useQueryClient();
	const queryKey = authQueries.session().queryKey;

	return useMutation({
		mutationFn: window.api.auth.refreshSession,
		onSuccess: (session) => {
			queryClient.setQueryData(queryKey, session);
		},
	});
}

export function useSignOut() {
	const queryClient = useQueryClient();
	const queryKey = authQueries.session().queryKey;

	return useMutation({
		mutationFn: window.api.auth.signOut,
		onSuccess: () => {
			queryClient.setQueryData(queryKey, null);
		},
	});
}
