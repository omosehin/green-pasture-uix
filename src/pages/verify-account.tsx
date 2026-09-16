import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, AlertCircle, KeyRound } from "lucide-react";

import { clearError } from "@/_redux/reducers/auth.reducer";
import {
	verifyAccountSchema,
	VerifyAccountFormData,
} from "@/_validations/auth";
import {
	verifyAccountAsync,
	resendOtpAsync,
} from "@/_redux/actions/auth.action";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import Image from "next/image";
import { formatCountdown } from "@/_utils/format";
import Card from "@/_UI/Card";
import Input from "@/_UI/Input";
import Button from "@/_UI/Button";

const VerifyAccountPage: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { isLoading, error } = useAppSelector((state) => state.auth);
	const [verified, setVerified] = useState(false);
	const [resendCountdown, setResendCountdown] = useState(0);
	// Seconds the emailed code is still good for. null = unknown (page opened
	// directly rather than arriving from signup), in which case we show nothing
	// rather than guess a window the backend may not honour.
	const [otpExpiresIn, setOtpExpiresIn] = useState<number | null>(null);

	const email = (router.query.email as string) || "";

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<VerifyAccountFormData>({
		resolver: zodResolver(verifyAccountSchema),
		defaultValues: {
			email: email,
		},
	});

	useEffect(() => {
		dispatch(clearError());
	}, [dispatch]);

	useEffect(() => {
		if (email) {
			setValue("email", email);
		}
	}, [email, setValue]);

	useEffect(() => {
		if (resendCountdown <= 0) return;
		const timer = setTimeout(() => {
			setResendCountdown((prev) => prev - 1);
		}, 1000);
		return () => clearTimeout(timer);
	}, [resendCountdown]);

	// Seed the expiry countdown from the signup response, handed over in the URL.
	useEffect(() => {
		if (!router.isReady) return;
		const seconds = Number(router.query.expiresIn);
		if (Number.isFinite(seconds) && seconds > 0) setOtpExpiresIn(seconds);
	}, [router.isReady, router.query.expiresIn]);

	useEffect(() => {
		if (otpExpiresIn === null || otpExpiresIn <= 0) return;
		const timer = setTimeout(() => {
			setOtpExpiresIn((prev) => (prev === null ? null : prev - 1));
		}, 1000);
		return () => clearTimeout(timer);
	}, [otpExpiresIn]);

	useEffect(() => {
		if (verified) {
			const timer = setTimeout(() => {
				router.push("/login");
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [verified, router]);

	const onSubmit = async (data: VerifyAccountFormData) => {
		dispatch(clearError());

		try {
			await dispatch(
				verifyAccountAsync({ email: data.email, otp: data.otp })
			).unwrap();
			setVerified(true);
		} catch (err: any) {
			console.error(err);
		}
	};

	const handleResendOtp = async () => {
		if (!email || resendCountdown > 0) return;

		try {
			const res = await dispatch(resendOtpAsync({ email })).unwrap();
			setResendCountdown(60);
			// A fresh code replaces the old one, so restart the expiry clock too.
			const expiresIn = Number(res?.data?.expiresIn);
			setOtpExpiresIn(Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : null);
		} catch (err: any) {
			console.error(err);
		}
	};

	if (verified) {
		return (
			<div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex items-center justify-center p-4">
				<Card elevation={2} padding="lg" className="max-w-md w-full text-center animate-page-enter">
					<CheckCircle className="h-24 w-24 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
					<h2 className="text-3xl font-bold text-on-surface dark:text-white">
						Account Verified!
					</h2>
					<p className="mt-4 text-on-surface-variant dark:text-gray-400">
						Your account has been successfully verified. Redirecting
						you to login...
					</p>
					<div className="mt-6">
						<Link href="/login">
							<Button variant="filled" size="lg">Go to Login</Button>
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
					Verify your account
				</h2>
				<p className="text-center text-sm text-on-surface-variant dark:text-gray-400 mb-8">
					We sent a verification code to{" "}
					<strong className="text-on-surface dark:text-white">{email}</strong>. Enter the code below to
					verify your account.
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

					<input type="hidden" {...register("email")} />

					<Input
						label="Verification Code"
						{...register("otp")}
						type="text"
						maxLength={6}
						autoComplete="one-time-code"
						placeholder="Enter 6-digit code"
						leftIcon={KeyRound}
						error={errors.otp?.message}
					/>

					{otpExpiresIn !== null && (
						<p className="-mt-2 text-center text-sm">
							{otpExpiresIn > 0 ? (
								<span className="text-on-surface-variant dark:text-gray-400">
									This code expires in{" "}
									<strong className="text-on-surface dark:text-white tabular-nums">
										{formatCountdown(otpExpiresIn)}
									</strong>
								</span>
							) : (
								<span className="text-red-600 dark:text-red-400">
									This code has expired. Request a new one below.
								</span>
							)}
						</p>
					)}

					<Button
						type="submit"
						variant="filled"
						size="lg"
						fullWidth
						loading={isLoading}
						disabled={isLoading}
					>
						{isLoading ? "Verifying..." : "Verify Account"}
					</Button>

					<div className="text-center">
						<p className="text-sm text-on-surface-variant dark:text-gray-400">
							Didn't receive the code?{" "}
							<button
								type="button"
								onClick={handleResendOtp}
								disabled={resendCountdown > 0 || isLoading}
								className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 disabled:text-on-surface/50 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
							>
								{resendCountdown > 0
									? `Resend in ${resendCountdown}s`
									: "Resend OTP"}
							</button>
						</p>
					</div>

					<div className="text-center">
						<Link
							href="/login"
							className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500"
						>
							Back to Login
						</Link>
					</div>
				</form>
			</Card>
		</div>
	);
};

export default VerifyAccountPage;
