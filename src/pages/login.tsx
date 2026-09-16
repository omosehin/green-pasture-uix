import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/_redux/store";
import {
	clearError,
	setLoading,
} from "@/_redux/reducers/auth.reducer";
import { LoginFormData, loginSchema } from "@/_validations/auth";
import Image from "next/image";
import { loginAsync } from "@/_redux/actions/auth.action";
import { appConstants } from "@/_redux/constants";
import { safeRedirectTarget } from "@/_utils/redirect";
import { logger } from "@/_utils";
import Card from "@/_UI/Card";
import Input from "@/_UI/Input";
import Button from "@/_UI/Button";

const LoginPage: React.FC = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { isLoading, error, user, isAuthenticated } = useAppSelector(
		(state) => state.auth
	);
	const [showPassword, setShowPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	useEffect(() => {
		dispatch(clearError());
		dispatch(setLoading(false));
	}, [dispatch]);

	const onSubmit = async (data: LoginFormData) => {
		try {
			await dispatch(loginAsync(data)).unwrap();
		} catch (err: any) {
			logger.log({ logginError: err });
		}
	};

	useEffect(() => {
		if (isAuthenticated && user) {
			const isAdminUser = appConstants.ADMIN_ROLES.includes(
				user?.profileType?.toUpperCase() as any || ""
			);

			const redirect = safeRedirectTarget(router.query.redirect as string);

			if (isAdminUser) {
				// Admins go straight to admin dashboard
				router.push(redirect.startsWith("/admin") ? redirect : "/admin/dashboard");
				return;
			}

			// Customer: sync cart with backend (backend derives customer from JWT)
			const syncCart = async () => {
				try {
					const { syncCartOnLoginAsync } = await import("@/_redux/actions/cart.action");
					await dispatch(syncCartOnLoginAsync(true)).unwrap();
				} catch {}
			};
			syncCart();

			// Same reconciliation for the wishlist — local (guest) items get
			// pushed up, then the backend list becomes the source of truth.
			const syncWishlist = async () => {
				try {
					const { syncWishlistOnLoginAsync } = await import("@/_redux/actions/wishlist.action");
					await dispatch(syncWishlistOnLoginAsync(true)).unwrap();
				} catch {}
			};
			syncWishlist();

			router.push(redirect);
		}
	}, [isAuthenticated, user, dispatch, router]);

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
					Sign in to your account
				</h2>
				<p className="text-center text-sm text-on-surface-variant dark:text-white/50 mb-8">
					Or{" "}
					<Link
						href="/signup"
						className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500"
					>
						create a new account
					</Link>
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
						label="Email Address"
						{...register("email")}
						type="email"
						autoComplete="email"
						placeholder="Enter your email"
						leftIcon={Mail}
						error={errors.email?.message}
					/>

					<div>
						<div className="flex items-center justify-between mb-1">
							<label className="block text-xs md:text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
								Password
							</label>
							<Link
								href="/forgot-password"
								className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500"
							>
								Forgot password?
							</Link>
						</div>
						<Input
							{...register("password")}
							type={showPassword ? "text" : "password"}
							autoComplete="current-password"
							placeholder="Enter your password"
							leftIcon={Lock}
							error={errors.password?.message}
							rightElement={
								<button
									type="button"
									className="text-on-surface/50 dark:text-white/30 hover:text-on-surface-variant dark:hover:text-gray-300 transition-colors"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							}
						/>
					</div>

					<Button
						type="submit"
						variant="filled"
						size="lg"
						fullWidth
						loading={isLoading}
						disabled={isLoading}
					>
						{isLoading ? "Signing in..." : "Sign in"}
					</Button>

					</form>
			</Card>
		</div>
	);
};

export default LoginPage;
