import { Button } from "@renderer/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@renderer/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldGroup,
} from "@renderer/components/ui/field";
import { cn } from "@renderer/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

interface AuthFormProps extends ComponentProps<"div"> {
	mode?: "login" | "signup";
	onSuccess: () => Promise<void> | void;
	isLoading?: boolean;
	errorMessage?: string;
	returnTo?: string;
}

function AuthForm({
	className,
	mode = "login",
	onSuccess,
	isLoading = false,
	errorMessage,
	returnTo,
	...props
}: AuthFormProps) {
	const isSignup = mode === "signup";

	function runAuthAction(): void {
		void Promise.resolve(onSuccess()).catch(() => {
			// The caller owns the visible error state; this prevents a noisy rejected
			// promise when the auth provider reports a handled failure.
		});
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		runAuthAction();
	}

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>
						{isSignup ? "Create your account" : "Sign in with Microsoft"}
					</CardTitle>
					<CardDescription>
						{isSignup
							? "Create your app account using your Microsoft 365 identity."
							: "Use your Microsoft 365 account to continue."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<FieldGroup>
							<Field>
								<Button type="submit" disabled={isLoading} className="w-full">
									<MicrosoftIcon />
									{isLoading ? "Continuing..." : "Continue with Microsoft"}
								</Button>
								{errorMessage ? (
									<p
										className="text-center text-sm text-destructive"
										role="alert"
									>
										{errorMessage}
									</p>
								) : (
									<FieldDescription className="text-center">
										{isSignup ? (
											<>
												Already have an account?{" "}
												<AuthModeLink mode="login" returnTo={returnTo} />
											</>
										) : (
											<>
												Don&apos;t have an account?{" "}
												<AuthModeLink mode="signup" returnTo={returnTo} />
											</>
										)}
									</FieldDescription>
								)}
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

function MicrosoftIcon() {
	return (
		<span className="grid size-4 grid-cols-2 gap-0.5" aria-hidden="true">
			<span className="bg-[#f25022]" />
			<span className="bg-[#7fba00]" />
			<span className="bg-[#00a4ef]" />
			<span className="bg-[#ffb900]" />
		</span>
	);
}

function AuthModeLink({
	mode,
	returnTo,
}: {
	mode: "login" | "signup";
	returnTo?: string;
}) {
	return (
		<Link
			to={mode === "login" ? "/login" : "/signup"}
			search={returnTo ? { returnTo } : {}}
			className="font-medium underline-offset-4 hover:underline"
		>
			{mode === "login" ? "Sign in" : "Sign up"}
		</Link>
	);
}

export { AuthForm };
