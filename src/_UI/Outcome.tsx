"use client";

import React, {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { useRouter } from "next/router";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Modal from "@/_UI/Modal";
import Button from "@/_UI/Button";

export interface Outcome {
	type: "success" | "error";
	title: string;
	message: string;
	/** Forward momentum — where the customer goes next. */
	action?: { label: string; href: string };
}

type OutcomeInput = Omit<Outcome, "type">;

interface OutcomeContextValue {
	success: (o: OutcomeInput) => void;
	failure: (o: OutcomeInput) => void;
}

const OutcomeContext = createContext<OutcomeContextValue | null>(null);

/**
 * The blocking half of the app's feedback. `react-hot-toast` carries the
 * everyday confirmations (added to cart, saved, removed); this is for the few
 * moments where money or commitment changed hands and the customer deserves to
 * be stopped, told what happened, and handed somewhere to go next.
 *
 * One at a time on purpose: it blocks, so a second outcome replaces the first
 * rather than queueing behind a modal the customer has already answered.
 */
export function OutcomeProvider({ children }: { children: React.ReactNode }) {
	const [outcome, setOutcome] = useState<Outcome | null>(null);

	const success = useCallback(
		(o: OutcomeInput) => setOutcome({ ...o, type: "success" }),
		[]
	);
	const failure = useCallback(
		(o: OutcomeInput) => setOutcome({ ...o, type: "error" }),
		[]
	);
	const dismiss = useCallback(() => setOutcome(null), []);

	const value = useMemo(() => ({ success, failure }), [success, failure]);

	return (
		<OutcomeContext.Provider value={value}>
			{children}
			<Modal isOpen={!!outcome} onClose={dismiss} size="sm">
				{outcome && <OutcomePanel outcome={outcome} onDone={dismiss} />}
			</Modal>
		</OutcomeContext.Provider>
	);
}

function OutcomePanel({
	outcome,
	onDone,
}: {
	outcome: Outcome;
	onDone: () => void;
}) {
	const router = useRouter();
	const reduced = useReducedMotion();
	const isError = outcome.type === "error";

	const handleAction = useCallback(() => {
		const href = outcome.action?.href;
		onDone();
		if (href) router.push(href);
	}, [outcome.action?.href, onDone, router]);

	// Stagger the panel's contents in. Skipped wholesale under
	// prefers-reduced-motion — the resting state is the natural CSS state.
	const item = reduced
		? {}
		: {
				initial: { opacity: 0, y: 8 },
				animate: { opacity: 1, y: 0 },
		  };

	return (
		<div
			data-testid="outcome-panel"
			data-outcome={outcome.type}
			role={isError ? "alert" : "status"}
			aria-live={isError ? "assertive" : "polite"}
			className="flex flex-col items-center gap-4 py-4 text-center"
		>
			<motion.span
				aria-hidden="true"
				initial={reduced ? undefined : { scale: 0.6, opacity: 0 }}
				animate={reduced ? undefined : { scale: 1, opacity: 1 }}
				transition={{ type: "spring", stiffness: 260, damping: 18 }}
				className="flex h-14 w-14 items-center justify-center rounded-full ring-1"
				style={
					isError
						? {
								background: "rgba(239,68,68,0.10)",
								color: "#ef4444",
								boxShadow: "0 0 0 1px rgba(239,68,68,0.25)",
						  }
						: {
								background: "rgba(154,202,60,0.14)",
								color: "var(--color-primary)",
								boxShadow: "0 0 0 1px rgba(154,202,60,0.35)",
						  }
				}
			>
				{isError ? (
					<AlertCircle className="h-7 w-7" />
				) : (
					<CheckCircle2 className="h-7 w-7" />
				)}
			</motion.span>

			<motion.h2
				{...item}
				transition={{ delay: 0.08, duration: 0.3 }}
				className="font-display text-xl leading-tight sm:text-2xl"
				style={{ color: "var(--text-primary)" }}
			>
				{outcome.title}
			</motion.h2>

			<motion.p
				{...item}
				transition={{ delay: 0.14, duration: 0.3 }}
				className="text-sm leading-relaxed"
				style={{ color: "var(--text-hint)" }}
			>
				{outcome.message}
			</motion.p>

			<motion.div
				{...item}
				transition={{ delay: 0.2, duration: 0.3 }}
				className="mt-1 flex w-full flex-col gap-2"
			>
				{outcome.action && (
					<Button
						size="lg"
						fullWidth
						autoFocus
						color={isError ? "error" : "primary"}
						onClick={handleAction}
						data-testid="outcome-action"
					>
						{outcome.action.label}
					</Button>
				)}
				<Button
					variant="text"
					size="lg"
					fullWidth
					onClick={onDone}
					data-testid="outcome-dismiss"
				>
					Dismiss
				</Button>
			</motion.div>
		</div>
	);
}

export function useOutcome(): OutcomeContextValue {
	const ctx = useContext(OutcomeContext);
	if (!ctx) throw new Error("useOutcome must be used inside <OutcomeProvider>");
	return ctx;
}
