import React from "react";
import { useRouter } from "next/router";
import { LogIn, UserPlus, ShoppingBag, X } from "lucide-react";
import Button from "./Button";
import { safeRedirectTarget } from "@/_utils/redirect";

interface AuthPromptProps {
	isOpen: boolean;
	onClose?: () => void;
	redirectTo?: string;
	title?: string;
	message?: string;
	showContinueBrowsing?: boolean;
}

const AuthPrompt: React.FC<AuthPromptProps> = ({
	isOpen,
	onClose,
	redirectTo,
	title = "Sign in to continue",
	message = "You need to be logged in to access this page. Create an account or sign in to continue.",
	showContinueBrowsing = true,
}) => {
	const router = useRouter();

	if (!isOpen) return null;

	const target = safeRedirectTarget(redirectTo);
	const suffix = target === "/" ? "" : `?redirect=${encodeURIComponent(target)}`;
	const loginUrl = `/login${suffix}`;
	const signupUrl = `/signup${suffix}`;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm animate-fade-in"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
				<div
					className="w-full max-w-md rounded-2xl p-8 animate-scale-in"
					style={{
						background: "var(--surface-paper)",
						border: "1px solid var(--border-light)",
						boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
					}}
				>
					{/* Close button */}
					{onClose && (
						<button
							onClick={onClose}
							className="absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer transition-colors"
							style={{ color: "var(--text-hint)" }}
						>
							<X className="w-4 h-4" />
						</button>
					)}

					{/* Icon */}
					<div
						className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
						style={{ background: "rgba(22,163,74,0.1)" }}
					>
						<ShoppingBag className="h-8 w-8" style={{ color: "var(--color-primary)" }} />
					</div>

					{/* Content */}
					<h2
						className="text-xl font-bold text-center mb-2"
						style={{ color: "var(--text-primary)" }}
					>
						{title}
					</h2>
					<p
						className="text-sm text-center mb-8 leading-relaxed"
						style={{ color: "var(--text-secondary)" }}
					>
						{message}
					</p>

					{/* Actions */}
					<div className="space-y-3">
						<Button
							variant="filled"
							size="lg"
							fullWidth
							leftIcon={LogIn}
							onClick={() => router.push(loginUrl)}
						>
							Sign In
						</Button>

						<Button
							variant="outlined"
							size="lg"
							fullWidth
							leftIcon={UserPlus}
							onClick={() => router.push(signupUrl)}
						>
							Create Account
						</Button>

						{showContinueBrowsing && onClose && (
							<button
								onClick={onClose}
								className="w-full py-2.5 text-sm font-medium cursor-pointer transition-colors"
								style={{ color: "var(--text-hint)" }}
								onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
								onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-hint)"; }}
							>
								Continue Browsing
							</button>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export default AuthPrompt;
