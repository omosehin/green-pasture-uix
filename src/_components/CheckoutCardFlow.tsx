import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { Lock, ShieldCheck } from "lucide-react";
import { onlyDigits, formatCard, formatExpiry, luhnValid, expiryValid, brandOf } from "@/_utils/cardFormat";

/* ------------------------------------------------------------------ */
/*  SECURITY NOTE                                                      */
/*                                                                     */
/*  This component NEVER transmits the PAN, expiry or CVV. The card    */
/*  fields drive the on-screen preview only and are wiped on unmount.  */
/*  Real authorisation happens on the Paystack hosted page — `onPay`   */
/*  receives no card data by design. Do not "helpfully" forward the    */
/*  form state to an API: doing so drags this app into PCI-DSS SAQ-D.  */
/* ------------------------------------------------------------------ */

type Step = "form" | "processing" | "success";

interface CheckoutCardFlowProps {
	/** Amount in naira, used for the success-screen count-up. */
	amount: number;
	/** Kicks off real payment. Resolve to show success, reject to return to the form. */
	onPay?: () => Promise<void>;
	/** Fired after the success animation settles. */
	onDone?: () => void;
}

/* ---------------- card face ---------------- */

const CardPreview: React.FC<{
	form: { card: string; name: string; expiry: string; cvv: string };
	flipped: boolean;
	reduced: boolean;
}> = ({ form, flipped, reduced }) => {
	const digits = onlyDigits(form.card);
	const brand = brandOf(digits);

	// Backfill with dots so the card never reflows as you type.
	const display = formatCard(form.card);
	const placeholder = "•••• •••• •••• ••••";
	const shown = display
		? display + placeholder.slice(display.length)
		: placeholder;

	const faceBase: React.CSSProperties = {
		position: "absolute",
		inset: 0,
		backfaceVisibility: "hidden",
		WebkitBackfaceVisibility: "hidden",
		borderRadius: 16,
		padding: 24,
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		color: "#fff",
		background:
			"linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 55%, var(--color-primary-light) 100%)",
		boxShadow: "0 18px 40px -12px rgba(0,0,0,0.45)",
	};

	return (
		<div style={{ perspective: 1200 }} className="mx-auto w-full max-w-[400px]">
			<motion.div
				data-testid="card-inner"
				data-flipped={flipped ? "true" : "false"}
				animate={{ rotateY: flipped ? 180 : 0 }}
				transition={reduced ? { duration: 0 } : { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
				style={{ transformStyle: "preserve-3d", position: "relative", aspectRatio: "1.586 / 1" }}
			>
				{/* ---- front ---- */}
				<div style={faceBase}>
					<div className="flex items-start justify-between">
						{/* chip */}
						<div
							className="h-8 w-11 rounded-md"
							style={{
								background: "linear-gradient(135deg,#e6c97a,#b9922f 45%,#f2e2ab)",
								boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
							}}
						/>
						<span className="text-sm font-semibold tracking-wide opacity-90">{brand}</span>
					</div>

					<div
						data-testid="card-number-display"
						className="text-[1.35rem] tabular-nums tracking-[0.12em]"
						style={{ fontVariantNumeric: "tabular-nums" }}
					>
						{shown}
					</div>

					<div className="flex items-end justify-between gap-4">
						<div className="min-w-0">
							<p className="text-[0.6rem] uppercase tracking-widest opacity-60">Card holder</p>
							<p data-testid="card-holder-display" className="truncate text-sm font-medium uppercase">
								{form.name || "YOUR NAME"}
							</p>
						</div>
						<div className="shrink-0 text-right">
							<p className="text-[0.6rem] uppercase tracking-widest opacity-60">Expires</p>
							<p data-testid="card-expiry-display" className="text-sm font-medium tabular-nums">
								{form.expiry || "MM/YY"}
							</p>
						</div>
					</div>
				</div>

				{/* ---- back ---- */}
				<div style={{ ...faceBase, transform: "rotateY(180deg)", padding: 0, justifyContent: "flex-start" }}>
					<div className="mt-6 h-11 w-full" style={{ background: "rgba(0,0,0,0.72)" }} />
					<div className="px-6 pt-5">
						<p className="mb-1.5 text-[0.6rem] uppercase tracking-widest opacity-60">CVV</p>
						<div
							data-testid="cvv-display"
							className="flex h-9 items-center justify-end rounded px-3 text-sm font-semibold tabular-nums"
							style={{ background: "#fff", color: "#111" }}
						>
							{form.cvv ? "•".repeat(form.cvv.length) : "•••"}
						</div>
						<p className="mt-4 text-[0.6rem] leading-relaxed opacity-55">
							This preview is local to your browser. Card details are never sent to our servers.
						</p>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

/* ---------------- field ---------------- */

const Field: React.FC<{
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
	invalid?: boolean;
	inputMode?: "numeric" | "text";
	autoComplete?: string;
	maxLength?: number;
	onFocus?: () => void;
	onBlur?: () => void;
}> = ({ label, value, onChange, placeholder, invalid, inputMode = "numeric", autoComplete, maxLength, onFocus, onBlur }) => (
	<label className="block">
		<span className="mb-1 block text-xs" style={{ color: "var(--text-secondary)" }}>
			{label}
		</span>
		<input
			value={value}
			onChange={(e) => onChange(e.target.value)}
			onFocus={onFocus}
			onBlur={onBlur}
			placeholder={placeholder}
			inputMode={inputMode}
			autoComplete={autoComplete}
			maxLength={maxLength}
			aria-invalid={invalid || undefined}
			className="w-full rounded-md bg-transparent px-3 py-2.5 text-sm tabular-nums outline-none transition-colors"
			style={{
				border: `1px solid ${invalid ? "#ef4444" : "var(--border-light)"}`,
				color: "var(--text-primary)",
			}}
		/>
	</label>
);

/* ---------------- main ---------------- */

const CheckoutCardFlow: React.FC<CheckoutCardFlowProps> = ({ amount, onPay, onDone }) => {
	const reduced = !!useReducedMotion();
	const [step, setStep] = useState<Step>("form");
	const [isFlipped, setIsFlipped] = useState(false);
	const [error, setError] = useState("");
	const [touched, setTouched] = useState(false);
	const [form, setForm] = useState({ card: "", name: "", expiry: "", cvv: "" });

	const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

	const digits = onlyDigits(form.card);
	const cardOk = luhnValid(digits);
	const expOk = expiryValid(form.expiry);
	const cvvOk = form.cvv.length >= 3;
	const nameOk = form.name.trim().length > 1;
	const formOk = cardOk && expOk && cvvOk && nameOk;

	// Don't leave card data sitting in memory once the flow is over.
	useEffect(() => {
		return () => setForm({ card: "", name: "", expiry: "", cvv: "" });
	}, []);

	const handlePay = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setTouched(true);
			if (!formOk || step !== "form") return;

			setError("");
			setStep("processing");
			// Card fields are wiped here — they exist only to render the preview.
			setForm({ card: "", name: "", expiry: "", cvv: "" });

			try {
				if (onPay) await onPay();
				else await new Promise((r) => setTimeout(r, 2000)); // demo fallback
				setStep("success");
			} catch (err: any) {
				setError(err?.message || "Payment could not be completed. Please try again.");
				setStep("form");
			}
		},
		[formOk, step, onPay],
	);

	/* ---- GSAP success timeline: stroke draw + ring pulse + amount count-up.
	       Framer handles the enter/exit; GSAP sequences the inside of the card. ---- */
	const successRef = useRef<HTMLDivElement>(null);
	const amountRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (step !== "success" || !successRef.current) return;

		const el = successRef.current;

		if (reduced) {
			if (amountRef.current) amountRef.current.textContent = `₦${amount.toLocaleString()}`;
			onDone?.();
			return;
		}

		const ctx = gsap.context(() => {
			const tl = gsap.timeline({ onComplete: () => onDone?.() });

			tl.fromTo(
				".gp-ring",
				{ scale: 0.4, opacity: 0 },
				{ scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)" },
			)
				.fromTo(
					".gp-check",
					{ strokeDashoffset: 60 },
					{ strokeDashoffset: 0, duration: 0.45, ease: "power2.out" },
					"-=0.15",
				)
				.fromTo(
					".gp-pulse",
					{ scale: 0.9, opacity: 0.55 },
					{ scale: 1.7, opacity: 0, duration: 0.9, ease: "power2.out" },
					"-=0.3",
				)
				.fromTo(
					".gp-line",
					{ y: 14, opacity: 0 },
					{ y: 0, opacity: 1, duration: 0.4, stagger: 0.09, ease: "power2.out" },
					"-=0.6",
				);

			// Count the total up rather than snapping it in.
			const counter = { v: 0 };
			tl.to(
				counter,
				{
					v: amount,
					duration: 0.9,
					ease: "power2.out",
					onUpdate: () => {
						if (amountRef.current) {
							amountRef.current.textContent = `₦${Math.round(counter.v).toLocaleString()}`;
						}
					},
				},
				"-=0.7",
			);
		}, el);

		return () => ctx.revert();
	}, [step, amount, reduced, onDone]);

	const t = (d: number) => (reduced ? 0 : d);

	return (
		<div className="mx-auto w-full max-w-md">
			<AnimatePresence mode="wait">
				{/* ================= FORM ================= */}
				{step === "form" && (
					<motion.div
						data-testid="step-form"
						key="form"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: t(0.35) }}
					>
						<CardPreview form={form} flipped={isFlipped} reduced={reduced} />

						<form onSubmit={handlePay} className="mt-8 space-y-4">
							<Field
								label="Card number"
								value={form.card}
								onChange={(v) => set({ card: formatCard(v) })}
								placeholder="0000 0000 0000 0000"
								autoComplete="cc-number"
								maxLength={24}
								invalid={touched && !cardOk}
							/>

							<Field
								label="Name on card"
								value={form.name}
								onChange={(v) => set({ name: v })}
								placeholder="John Doe"
								inputMode="text"
								autoComplete="cc-name"
								maxLength={40}
								invalid={touched && !nameOk}
							/>

							<div className="grid grid-cols-2 gap-4">
								<Field
									label="Expiry"
									value={form.expiry}
									onChange={(v) => set({ expiry: formatExpiry(v) })}
									placeholder="MM/YY"
									autoComplete="cc-exp"
									maxLength={5}
									invalid={touched && !expOk}
								/>
								<Field
									label="CVV"
									value={form.cvv}
									onChange={(v) => set({ cvv: onlyDigits(v).slice(0, 4) })}
									placeholder="123"
									autoComplete="cc-csc"
									maxLength={4}
									invalid={touched && !cvvOk}
									onFocus={() => setIsFlipped(true)}
									onBlur={() => setIsFlipped(false)}
								/>
							</div>

							{error && (
								<p className="text-xs" style={{ color: "#ef4444" }}>
									{error}
								</p>
							)}

							<motion.button
								data-testid="pay-button"
								type="submit"
								whileTap={reduced ? undefined : { scale: 0.98 }}
								disabled={!formOk}
								className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
								style={{ background: "var(--color-primary)" }}
							>
								Pay ₦{amount.toLocaleString()}
							</motion.button>

							<p
								className="flex items-center justify-center gap-1.5 text-center text-xs"
								style={{ color: "var(--text-secondary)" }}
							>
								<Lock size={12} />
								Card details stay in your browser — payment is completed on Paystack
							</p>
						</form>
					</motion.div>
				)}

				{/* ================= PROCESSING ================= */}
				{step === "processing" && (
					<motion.div
						data-testid="step-processing"
						key="processing"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: t(0.3) }}
						className="flex min-h-[420px] flex-col items-center justify-center gap-5"
						role="status"
						aria-live="polite"
					>
						<motion.span
							animate={reduced ? undefined : { rotate: 360 }}
							transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
							className="block h-12 w-12 rounded-full"
							style={{
								border: "3px solid var(--border-light)",
								borderTopColor: "var(--color-primary)",
							}}
						/>
						<p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
							Processing secure transaction…
						</p>
						<p
							className="flex items-center gap-1.5 text-xs"
							style={{ color: "var(--text-secondary)" }}
						>
							<ShieldCheck size={12} />
							Do not close this window
						</p>
					</motion.div>
				)}

				{/* ================= SUCCESS ================= */}
				{step === "success" && (
					<motion.div
						data-testid="step-success"
						key="success"
						ref={successRef}
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 18 }}
						className="flex min-h-[420px] flex-col items-center justify-center text-center"
					>
						<div className="relative mb-7 flex h-24 w-24 items-center justify-center">
							<span
								className="gp-pulse absolute inset-0 rounded-full"
								style={{ background: "var(--color-primary)" }}
							/>
							<span
								className="gp-ring flex h-24 w-24 items-center justify-center rounded-full"
								style={{ background: "var(--color-primary)" }}
							>
								<svg width="44" height="44" viewBox="0 0 52 52" fill="none" aria-hidden="true">
									<path
										className="gp-check"
										d="M14 27l8 8 16-16"
										stroke="#fff"
										strokeWidth="4"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeDasharray="60"
									/>
								</svg>
							</span>
						</div>

						<h2
							className="gp-line text-2xl font-bold"
							style={{ color: "var(--text-primary)" }}
						>
							Payment Successful
						</h2>

						<span
							ref={amountRef}
							data-testid="success-amount"
							className="gp-line mt-2 block text-3xl font-bold tabular-nums"
							style={{ color: "var(--color-primary)" }}
						>
							₦0
						</span>

						<p
							className="gp-line mt-3 max-w-xs text-sm leading-relaxed"
							style={{ color: "var(--text-secondary)" }}
						>
							Your order is confirmed. A receipt is on its way to your inbox.
						</p>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default CheckoutCardFlow;
