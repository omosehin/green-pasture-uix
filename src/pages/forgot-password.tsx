import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

import { clearError } from "@/_redux/reducers/auth.reducer";
import {
	forgotPasswordSchema,
	ForgotPasswordFormData,
} from "@/_validations/auth";
import { forgotPasswordAsync } from "@/_redux/actions/auth.action";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import Image from "next/image";
import Card from "@/_UI/Card";
import Input from "@/_UI/Input";
import Button from "@/_UI/Button";

const ForgotPasswordPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { isLoading, error } = useAppSelector((state) => state.auth);
	const [emailSent, setEmailSent] = useState(false);
	const [submittedEmail, setSubmittedEmail] = useState("");

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(forgotPasswordSchema),
	});

	React.useEffect(() => {
		dispatch(clearError());
	}, [dispatch]);

	const onSubmit = async (data: ForgotPasswordFormData) => {
		dispatch(clearError());

		try {
			await dispatch(forgotPasswordAsync({ email: data.email })).unwrap();
			setSubmittedEmail(data.email);
			setEmailSent(true);
		} catch (err: any) {
			console.error(err);
		}
	};

	if (emailSent) {
		return (
			<div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex items-center justify-center p-4">
				<Card elevation={2} padding="lg" className="max-w-md w-full text-center animate-page-enter">
					<CheckCircle className="h-24 w-24 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
					<h2 className="text-3xl font-bold text-on-surface dark:text-white">
						Check your email
					</h2>
					<p className="mt-4 text-on-surface-variant dark:text-gray-400">
						We've sent a password reset link to{" "}
						<strong className="text-on-surface dark:text-white">{submittedEmail}</strong>
					</p>
					<p className="mt-2 text-sm text-on-surface-variant dark:text-gray-400">
						Didn't receive it? Check your spam folder or try again.
					</p>

					<div className="mt-6 flex flex-col gap-4">
						<Button
							variant="tonal"
							color="secondary"
							size="lg"
							fullWidth
							onClick={() => {
								setEmailSent(false);
								setSubmittedEmail("");
							}}
						>
							Try again
						</Button>
						<Link
							href="/login"
							className="flex items-center justify-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500"
						>
							<ArrowLeft className="h-4 w-4" />
							Back to Login
						</Link>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex items-center justify-center p-4">
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

				<h2 className="text-center text-2xl md:text-3xl font-bold text-on-surface dark:text-white mb-2">
					Reset your password
				</h2>
				<p className="text-center text-sm text-on-surface-variant dark:text-gray-400 mb-8">
					Enter your email address and we'll send you a link to reset your password.
				</p>

				<form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
					{error && (
						<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-radius-md p-4">
							<div className="flex">
								<AlertCircle className="h-5 w-5 text-red-400 dark:text-red-500" />
								<div className="ml-3">
									<p className="text-sm text-red-800 dark:text-red-300">{error}</p>
								</div>
							</div>
						</div>
					)}

					<Input
						label="Email address"
						{...register("email")}
						type="email"
						autoComplete="email"
						placeholder="Enter your email address"
						leftIcon={Mail}
						error={errors.email?.message}
					/>

					<Button
						type="submit"
						variant="filled"
						size="lg"
						fullWidth
						loading={isLoading}
						disabled={isLoading}
					>
						{isLoading ? "Sending reset link..." : "Send reset link"}
					</Button>

					<div className="text-center">
						<Link
							href="/login"
							className="flex items-center justify-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500"
						>
							<ArrowLeft className="h-4 w-4 mr-1" />
							Back to Login
						</Link>
					</div>
				</form>
			</Card>
		</div>
	);
};

export default ForgotPasswordPage;
