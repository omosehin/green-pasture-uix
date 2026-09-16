import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, Check, User, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { clearError } from "@/_redux/reducers/auth.reducer";
import { signupSchema, signupStep1Schema, signupStep2Schema, SignupFormData } from "@/_validations/auth";
import { signupAsync } from "@/_redux/actions/auth.action";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import Image from "next/image";
import { FormInput, FormSelect } from "@/_UI/FormField";
import PhoneInput from "@/_UI/PhoneInput";

const STEPS = [
	{ id: 1, label: "Personal", icon: User },
	{ id: 2, label: "Contact", icon: Mail },
	{ id: 3, label: "Security", icon: Lock },
];

const slideVariants = {
	enter: (direction: number) => ({
		x: direction > 0 ? 200 : -200,
		opacity: 0,
	}),
	center: { x: 0, opacity: 1 },
	exit: (direction: number) => ({
		x: direction > 0 ? -200 : 200,
		opacity: 0,
	}),
};

const SignupPage: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { isLoading, error } = useAppSelector((state) => state.auth);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [step, setStep] = useState(1);
	const [direction, setDirection] = useState(1);
	const phoneDialCodeRef = React.useRef("+234");

	const {
		register,
		handleSubmit,
		watch,
		control,
		setError,
		clearErrors,
		formState: { errors },
	} = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema) as any,
		defaultValues: { firstName: "", lastName: "", email: "", phoneNumber: "", gender: "NOT_SPECIFIED", password: "", confirmPassword: "" },
		mode: "onSubmit",
	});

	React.useEffect(() => {
		dispatch(clearError());
	}, [dispatch]);

	const onSubmit = async (data: SignupFormData) => {
		try {
			const res = await dispatch(
				signupAsync({
					firstName: data.firstName,
					lastName: data.lastName,
					email: data.email,
					phoneNumber: `${phoneDialCodeRef.current}${data.phoneNumber}`,
					password: data.password,
					gender: data.gender,
					profileType: "CLIENT",
				} as any)
			).unwrap();
			// Carry the OTP's lifetime across so the verify page can start its countdown
			// at the moment the code was actually issued, not when that page mounts.
			const expiresIn = res?.data?.expiresIn;
			router.push(
				`/verify-account?email=${encodeURIComponent(data.email)}${expiresIn ? `&expiresIn=${expiresIn}` : ""}`
			);
		} catch {}
	};

	const goNext = async () => {
		const values = watch();
		let result: { success: boolean; error?: any };

		if (step === 1) {
			result = signupStep1Schema.safeParse(values);
		} else if (step === 2) {
			result = signupStep2Schema.safeParse(values);
		} else {
			return;
		}

		if (!result.success) {
			// Clear previous errors for this step before setting new ones
			if (step === 1) clearErrors(["firstName", "lastName", "gender"]);
			if (step === 2) clearErrors(["email", "phoneNumber"]);
			for (const issue of result.error.issues) {
				const field = issue.path[0] as keyof SignupFormData;
				setError(field, { message: issue.message });
			}
			return;
		}

		// Clear all errors before advancing to prevent stale errors on the next step
		clearErrors();
		setDirection(1);
		setStep((s) => Math.min(s + 1, 3));
	};

	const goBack = () => {
		setDirection(-1);
		setStep((s) => Math.max(s - 1, 1));
	};

	const errorMessage = error
		? typeof error === "string"
			? error
			: Array.isArray(error)
				? (error as string[]).join(". ")
				: "Registration failed. Please try again."
		: null;

	// Watch values for step summary
	const firstName = watch("firstName");
	const email = watch("email");

	return (
		<div
			className="min-h-screen flex items-center justify-center p-4"
			style={{ background: "var(--background)" }}
		>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
				className="w-full max-w-md rounded-2xl overflow-hidden"
				style={{
					background: "var(--surface-paper)",
					border: "1px solid var(--border-light)",
					boxShadow: "var(--shadow-xl)",
				}}
			>
				{/* Header */}
				<div className="px-8 pt-8 pb-2">
					<div className="flex justify-center mb-5">
						<Link href="/" className="flex items-center gap-2">
							<div className="relative w-8 h-8">
								<Image
									src="/images/GP Organic Logo (Primary).png"
									alt="Logo"
									height={32}
									width={32}
									priority
									className="object-contain"
								/>
							</div>
							<span className="text-base font-bold" style={{ color: "var(--color-primary)" }}>
								Green Pastures
							</span>
						</Link>
					</div>

					<h2
						className="text-center text-xl font-bold mb-1"
						style={{ color: "var(--text-primary)" }}
					>
						Create your account
					</h2>
					<p className="text-center text-xs mb-6" style={{ color: "var(--text-hint)" }}>
						Already have an account?{" "}
						<Link href="/login" className="font-medium" style={{ color: "var(--color-primary)" }}>
							Sign in
						</Link>
					</p>

					{/* Step Indicator */}
					<div className="flex items-center justify-center gap-0 mb-6">
						{STEPS.map((s, i) => {
							const Icon = s.icon;
							const isActive = step === s.id;
							const isCompleted = step > s.id;
							return (
								<React.Fragment key={s.id}>
									{i > 0 && (
										<div
											className="w-10 h-[2px] mx-1"
											style={{
												background: isCompleted
													? "var(--color-primary)"
													: "var(--border-light)",
												transition: "background 0.3s",
											}}
										/>
									)}
									<button
										type="button"
										onClick={() => {
											if (isCompleted) {
												setDirection(s.id < step ? -1 : 1);
												setStep(s.id);
											}
										}}
										className="flex items-center gap-1.5 transition-all"
										style={{
											cursor: isCompleted ? "pointer" : "default",
										}}
									>
										<div
											className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
											style={{
												background: isCompleted
													? "var(--color-primary)"
													: isActive
														? "rgba(22,163,74,0.12)"
														: "var(--surface-medium)",
												color: isCompleted
													? "#fff"
													: isActive
														? "var(--color-primary)"
														: "var(--text-disabled)",
												border: isActive
													? "2px solid var(--color-primary)"
													: "2px solid transparent",
											}}
										>
											{isCompleted ? (
												<Check className="w-3.5 h-3.5" />
											) : (
												<Icon className="w-3.5 h-3.5" />
											)}
										</div>
										<span
											className="text-[0.65rem] font-semibold hidden sm:inline"
											style={{
												color: isActive || isCompleted
													? "var(--text-primary)"
													: "var(--text-disabled)",
											}}
										>
											{s.label}
										</span>
									</button>
								</React.Fragment>
							);
						})}
					</div>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="px-8 overflow-hidden" style={{ minHeight: 220 }}>
						{errorMessage && step === 3 && (
							<motion.div
								initial={{ opacity: 0, y: -8 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex items-start gap-2 p-3 rounded-lg text-xs mb-4"
								style={{
									background: "rgba(239,68,68,0.08)",
									border: "1px solid rgba(239,68,68,0.2)",
									color: "#dc2626",
								}}
							>
								<AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
								<span>{errorMessage}</span>
							</motion.div>
						)}

						<AnimatePresence mode="wait" custom={direction}>
							{/* Step 1: Personal */}
							{step === 1 && (
								<motion.div
									key="step1"
									custom={direction}
									variants={slideVariants}
									initial="enter"
									animate="center"
									exit="exit"
									transition={{ duration: 0.25, ease: "easeInOut" }}
									className="space-y-4"
								>
									<div className="grid grid-cols-2 gap-3">
										<FormInput
											label="First Name"
											placeholder="John"
											required
											{...register("firstName")}
											error={errors.firstName?.message}
										/>
										<FormInput
											label="Last Name"
											placeholder="Doe"
											required
											{...register("lastName")}
											error={errors.lastName?.message}
										/>
									</div>
									<FormSelect
										label="Gender"
										options={[
											{ value: "NOT_SPECIFIED", label: "Prefer not to say" },
											{ value: "MALE", label: "Male" },
											{ value: "FEMALE", label: "Female" },
										]}
										{...register("gender")}
										error={errors.gender?.message}
									/>
								</motion.div>
							)}

							{/* Step 2: Contact */}
							{step === 2 && (
								<motion.div
									key="step2"
									custom={direction}
									variants={slideVariants}
									initial="enter"
									animate="center"
									exit="exit"
									transition={{ duration: 0.25, ease: "easeInOut" }}
									className="space-y-4"
								>
									<FormInput
										label="Email Address"
										type="email"
										placeholder="john@example.com"
										required
										{...register("email")}
										error={errors.email?.message}
									/>
									<Controller
										name="phoneNumber"
										control={control}
										render={({ field }) => (
											<PhoneInput
												label="Phone Number"
												required
												value={field.value}
												onChange={(val) => field.onChange(val)}
												onCountryChange={(dial) => { phoneDialCodeRef.current = dial; }}
												error={errors.phoneNumber?.message}
											/>
										)}
									/>
								</motion.div>
							)}

							{/* Step 3: Security */}
							{step === 3 && (
								<motion.div
									key="step3"
									custom={direction}
									variants={slideVariants}
									initial="enter"
									animate="center"
									exit="exit"
									transition={{ duration: 0.25, ease: "easeInOut" }}
									className="space-y-4"
								>
									{/* Summary */}
									{firstName && (
										<div
											className="p-3 rounded-lg text-xs"
											style={{
												background: "rgba(22,163,74,0.06)",
												border: "1px solid rgba(22,163,74,0.12)",
												color: "var(--text-secondary)",
											}}
										>
											Creating account for <strong style={{ color: "var(--text-primary)" }}>{firstName}</strong>
											{email && <> · <span style={{ color: "var(--text-hint)" }}>{email}</span></>}
										</div>
									)}

									<div className="relative">
										<FormInput
											label="Password"
											type={showPassword ? "text" : "password"}
											placeholder="Min. 8 characters"
											required
											{...register("password")}
											error={errors.password?.message}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-[2rem] p-1 cursor-pointer"
											style={{ color: "var(--text-hint)" }}
										>
											{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
										</button>
									</div>

									<div className="relative">
										<FormInput
											label="Confirm password"
											type={showConfirmPassword ? "text" : "password"}
											placeholder="Re-enter password"
											required
											{...register("confirmPassword")}
											error={errors.confirmPassword?.message}
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3 top-[2rem] p-1 cursor-pointer"
											style={{ color: "var(--text-hint)" }}
										>
											{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
										</button>
									</div>

									<label className="flex items-start gap-2 cursor-pointer">
										<input
											type="checkbox"
											required
											className="mt-0.5 h-4 w-4 rounded cursor-pointer accent-green-600"
										/>
										<span className="text-[0.65rem] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
											I agree to the{" "}
											<Link href="/terms" style={{ color: "var(--color-primary)" }}>Terms</Link>
											{" "}and{" "}
											<Link href="/privacy" style={{ color: "var(--color-primary)" }}>Privacy Policy</Link>
										</span>
									</label>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Footer Buttons */}
					<div
						className="px-8 py-5 mt-4 flex items-center justify-between"
						style={{ borderTop: "1px solid var(--border-light)" }}
					>
						{step > 1 ? (
							<button
								type="button"
								onClick={goBack}
								className="flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer press-effect px-3 py-2 rounded-lg"
								style={{ color: "var(--text-secondary)" }}
								onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-low)"; }}
								onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
							>
								<ArrowLeft className="w-3.5 h-3.5" />
								Back
							</button>
						) : (
							<div />
						)}

						{step < 3 ? (
							<button
								type="button"
								onClick={goNext}
								className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer press-effect"
								style={{ background: "var(--color-primary)", boxShadow: "var(--shadow-sm)" }}
							>
								Continue
								<ArrowRight className="w-3.5 h-3.5" />
							</button>
						) : (
							<button
								type="submit"
								disabled={isLoading}
								className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer press-effect disabled:opacity-60 disabled:cursor-not-allowed"
								style={{ background: "var(--color-primary)", boxShadow: "var(--shadow-sm)" }}
							>
								{isLoading ? (
									<>
										<svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
											<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
										</svg>
										Creating...
									</>
								) : (
									<>
										Create account
										<Check className="w-3.5 h-3.5" />
									</>
								)}
							</button>
						)}
					</div>
				</form>
			</motion.div>
		</div>
	);
};

export default SignupPage;
