import { AuthForm } from "@renderer/components/auth/auth-form";
import { getSafeRedirectUrl } from "@renderer/lib/auth-config";
import { createFileRoute, useRouter } from "@tanstack/react-router";
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
	component: LoginPage,
});

function LoginPage(): React.JSX.Element {
	const router = useRouter();
	const search = Route.useSearch();

	async function handleSuccess(): Promise<void> {
		await router.navigate({ to: search.returnTo ?? "/" });
	}

	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
			<div className="w-full max-w-sm">
				<AuthForm
					mode="login"
					onSuccess={handleSuccess}
					returnTo={search.returnTo}
				/>
			</div>
		</div>
	);
}
