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
	FieldLabel,
} from "@renderer/components/ui/field";
import { Input } from "@renderer/components/ui/input";
import { cn } from "@renderer/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

interface AuthFormProps extends ComponentProps<"div"> {
	mode?: "login" | "signup";
	onSuccess: () => Promise<void> | void;
	isLoading?: boolean;
	returnTo?: string;
}

function AuthForm({
	className,
	mode = "login",
	onSuccess,
	isLoading = false,
	returnTo,
	...props
}: AuthFormProps) {
	const isSignup = mode === "signup";

	function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		void onSuccess();
	}

	return (
		<div className={cn("flex w-full flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader>
					<CardTitle>
						{isSignup ? "Create your account" : "Login to your account"}
					</CardTitle>
					<CardDescription>
						{isSignup
							? "Enter your details below to create your account."
							: "Enter your email below to login to your account."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="email">Email</FieldLabel>
								<Input
									id="email"
									type="email"
									placeholder="name@company.com"
									autoComplete="email"
									disabled={isLoading}
									required
								/>
							</Field>
							<Field>
								<div className="flex items-center">
									<FieldLabel htmlFor="password">Password</FieldLabel>
								</div>
								<Input
									id="password"
									type="password"
									autoComplete={isSignup ? "new-password" : "current-password"}
									disabled={isLoading}
									required
								/>
							</Field>
							<Field>
								<Button type="submit" disabled={isLoading}>
									{isSignup ? "Create account" : "Login"}
								</Button>
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
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
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
			className="font-medium text-primary underline-offset-4 hover:underline"
		>
			{mode === "login" ? "Login" : "Sign up"}
		</Link>
	);
}

export { AuthForm };
