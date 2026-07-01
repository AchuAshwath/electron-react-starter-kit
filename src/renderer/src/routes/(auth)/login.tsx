import { AuthForm } from "@renderer/components/auth/auth-form";
import { useSignIn } from "@renderer/core/auth/auth.hooks";
import { authQueries } from "@renderer/core/auth/auth.queries";
import { getSafeRedirectUrl } from "@renderer/lib/auth-config";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
	returnTo: z
		.string()
		.optional()
		.transform((value) => getSafeRedirectUrl(value))
		.catch(undefined),
});

export const Route = createFileRoute("/(auth)/login")({
	validateSearch: searchSchema,
	beforeLoad: async ({ context, search }) => {
		const session = await context.queryClient.ensureQueryData(
			authQueries.session(),
		);

		if (session) {
			throw redirect({ to: search.returnTo ?? "/" });
		}
	},
	component: LoginPage,
});

function LoginPage(): React.JSX.Element {
	const router = useRouter();
	const search = Route.useSearch();
	const signIn = useSignIn({ strategy: "microsoft" });

	async function handleSignIn(): Promise<void> {
		await signIn.mutateAsync();
		await router.navigate({ to: search.returnTo ?? "/" });
	}

	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
			<div className="w-full max-w-sm">
				<AuthForm
					mode="login"
					onSuccess={handleSignIn}
					isLoading={signIn.isPending}
					errorMessage={signIn.error?.message}
					returnTo={search.returnTo}
				/>
			</div>
		</div>
	);
}
