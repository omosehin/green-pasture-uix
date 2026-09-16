import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";

import Image from "next/image";
import Card from "@/_UI/Card";
import Input from "@/_UI/Input";
import Button from "@/_UI/Button";
import axiosInstance from "@/_utils/axiosInstance";

const setPasswordSchema = z
	.object({
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				"Password must contain at least one uppercase letter, one lowercase letter, and one number"
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

const SetPasswordPage: React.FC = () => {
	const router = useRouter();
	const token = router.query.token as string;

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [complete, setComplete] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SetPasswordFormData>({
		resolver: zodResolver(setPasswordSchema),
	});

	const onSubmit = async (data: SetPasswordFormData) => {
		if (!token) {
			setError("Missing token. Please use the link from your email.");
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			await axiosInstance.post("auth/set-password", {
				token,
				newPassword: data.password,
			});
			setComplete(true);
		} catch (err: any) {
			const msg = err?.response?.data?.message;
			setError(typeof msg === "string" ? msg : "Invalid or expired token");
		} finally {
			setIsLoading(false);
		}
	};

	if (complete) {
		return (
			<div className="min-h-screen bg-mint-50 dark:bg-[#0e0e1a] flex items-center justify-center p-4">
				<Card elevation={2} padding="lg" className="max-w-md w-full text-center animate-page-enter">
					<CheckCircle className="h-24 w-24 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
					<h2 className="text-3xl font-bold text-on-surface dark:text-white">
						Password Set!
					</h2>
					<p className="mt-4 text-on-surface-variant dark:text-gray-400">
						Password set successfully! You can now log in.
					</p>
					<div className="mt-6">
						<Link href="/login">
							<Button variant="filled" size="lg">Sign In</Button>
						</Link>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-mint-50 dark:bg-[#0e0e1a] flex items-center justify-center p-4">
			<Card
				elevation={2}
				padding="lg"
				className="max-w-md w-full rounded-radius-lg animate-page-enter"
			>
				{/* Logo */}
				<div className="flex justify-center mb-6">
					<Link href="/" className="flex items-center space-x-2">
						<div className="relative w-[2.2rem] aspect-square bg-transparent">
							<Image
								src="/images/GP Organic Logo (Primary).png"
								alt="Green Pastures Logo"
								height={100}
								width={100}
								priority
								sizes="(max-width: 768px) 2rem, (max-width: 1200px) 2.2rem, 3rem"
								className="object-contain"
							/>
						</div>
						<span className="text-md md:text-lg font-bold text-primary-800 dark:text-primary-300">
							Green Pastures Organics
						</span>
					</Link>
				</div>

				<h2 className="text-center text-2xl md:text-3xl font-bold text-on-surface dark:text-white/90 mb-2">
					Set your password
				</h2>
				<p className="text-center text-sm text-on-surface-variant dark:text-white/50 mb-8">
					Create a password for your new account
				</p>

				<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
					{error && (
						<div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-radius-md p-4">
							<div className="flex">
								<AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500" />
								<div className="ml-3">
									<p className="text-sm text-red-800 dark:text-red-300">{error}</p>
								</div>
							</div>
						</div>
					)}

					<Input
						label="New Password"
						{...register("password")}
						type={showPassword ? "text" : "password"}
						autoComplete="new-password"
						placeholder="Enter your new password"
						leftIcon={Lock}
						error={errors.password?.message}
						rightElement={
							<button
								type="button"
								className="text-on-surface/50 dark:text-white/30 hover:text-on-surface-variant dark:hover:text-gray-300 transition-colors"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
							</button>
						}
					/>

					<Input
						label="Confirm Password"
						{...register("confirmPassword")}
						type={showConfirmPassword ? "text" : "password"}
						autoComplete="new-password"
						placeholder="Confirm your new password"
						leftIcon={Lock}
						error={errors.confirmPassword?.message}
						rightElement={
							<button
								type="button"
								className="text-on-surface/50 dark:text-white/30 hover:text-on-surface-variant dark:hover:text-gray-300 transition-colors"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							>
								{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
							</button>
						}
					/>

					<Button
						type="submit"
						variant="filled"
						size="lg"
						fullWidth
						loading={isLoading}
						disabled={isLoading}
					>
						{isLoading ? "Setting password..." : "Set Password"}
					</Button>
				</form>

				<p className="text-center text-sm text-on-surface-variant dark:text-white/50 mt-6">
					Already have an account?{" "}
					<Link
						href="/login"
						className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500"
					>
						Sign in
					</Link>
				</p>
			</Card>
		</div>
	);
};

export default SetPasswordPage;
