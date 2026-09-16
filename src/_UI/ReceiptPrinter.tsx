"use client";

import React, { useState, useEffect, useRef } from "react";
import {
	Printer,
	RotateCcw,
	Scissors,
	Copy,
	Check,
	CheckCircle2,
	Volume2,
	VolumeX,
} from "lucide-react";
import Button from "./Button";
import { cn } from "@/lib/utils";

// ==========================================
// Web Audio Synthesizer (Thermal / Stepper SFX)
// ==========================================
class ReceiptAudioSynth {
	private ctx: AudioContext | null = null;
	public isMuted: boolean = false;

	private getContext(): AudioContext | null {
		if (typeof window === "undefined") return null;
		try {
			if (!this.ctx) {
				const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
				if (AudioCtx) this.ctx = new AudioCtx();
			}
			if (this.ctx && this.ctx.state === "suspended") {
				this.ctx.resume();
			}
			return this.ctx;
		} catch {
			return null;
		}
	}

	playPrinting(duration = 2.0) {
		if (this.isMuted) return;
		const ctx = this.getContext();
		if (!ctx) return;

		try {
			const now = ctx.currentTime;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "sawtooth";
			osc.frequency.setValueAtTime(140, now);
			osc.frequency.exponentialRampToValueAtTime(175, now + duration);

			const filter = ctx.createBiquadFilter();
			filter.type = "bandpass";
			filter.frequency.setValueAtTime(480, now);
			filter.Q.setValueAtTime(3.5, now);

			gain.gain.setValueAtTime(0.04, now);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

			osc.connect(filter);
			filter.connect(gain);
			gain.connect(ctx.destination);

			osc.start(now);
			osc.stop(now + duration);

			const tickCount = Math.floor(duration * 14);
			for (let i = 0; i < tickCount; i++) {
				const tickTime = now + i / 14 + Math.random() * 0.008;
				const bufferSize = Math.floor(ctx.sampleRate * 0.018);
				const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
				const output = noiseBuffer.getChannelData(0);
				for (let j = 0; j < bufferSize; j++) {
					output[j] = Math.random() * 2 - 1;
				}
				const noise = ctx.createBufferSource();
				noise.buffer = noiseBuffer;
				const tickGain = ctx.createGain();
				tickGain.gain.setValueAtTime(0.035, tickTime);
				tickGain.gain.exponentialRampToValueAtTime(0.0001, tickTime + 0.018);

				noise.connect(tickGain);
				tickGain.connect(ctx.destination);
				noise.start(tickTime);
			}
		} catch {}
	}

	playStamp() {
		if (this.isMuted) return;
		const ctx = this.getContext();
		if (!ctx) return;

		try {
			const now = ctx.currentTime;
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "triangle";
			osc.frequency.setValueAtTime(190, now);
			osc.frequency.exponentialRampToValueAtTime(35, now + 0.14);

			gain.gain.setValueAtTime(0.28, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.16);
		} catch {}
	}

	playTear() {
		if (this.isMuted) return;
		const ctx = this.getContext();
		if (!ctx) return;

		try {
			const now = ctx.currentTime;
			const duration = 0.26;
			const bufferSize = Math.floor(ctx.sampleRate * duration);
			const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
			const output = noiseBuffer.getChannelData(0);
			for (let i = 0; i < bufferSize; i++) {
				output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
			}
			const noise = ctx.createBufferSource();
			noise.buffer = noiseBuffer;

			const filter = ctx.createBiquadFilter();
			filter.type = "bandpass";
			filter.frequency.setValueAtTime(1600, now);
			filter.frequency.exponentialRampToValueAtTime(500, now + duration);
			filter.Q.setValueAtTime(2.0, now);

			const gain = ctx.createGain();
			gain.gain.setValueAtTime(0.22, now);
			gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

			noise.connect(filter);
			filter.connect(gain);
			gain.connect(ctx.destination);
			noise.start(now);
			noise.stop(now + duration);
		} catch {}
	}
}

const audioSynth = new ReceiptAudioSynth();

export interface ReceiptLineItem {
	id?: string;
	description: string;
	quantity?: number;
	amount: number;
}

export interface ReceiptData {
	agencyName?: string;
	receiptNumber?: string;
	clientName?: string;
	amount?: number;
	currency?: string;
	date?: string;
	cacReg?: string;
	lineItems?: ReceiptLineItem[];
	paymentMethod?: string;
	transactionRef?: string;
	statusText?: string;
}

export interface ReceiptPrinterProps {
	receipt?: ReceiptData;
	autoStart?: boolean;
	onComplete?: () => void;
	className?: string;
	showActions?: boolean;
}

const DEFAULT_RECEIPT: ReceiptData = {
	agencyName: "GREEN PASTURES FARMS OFFICIAL RECEIPT",
	receiptNumber: "GP-REC-2026-9041",
	clientName: "VICTOR CHIDI",
	amount: 4285185.0,
	currency: "NGN",
	date: "09 SEP 2026 • 17:15 PM",
	cacReg: "RC-1849204",
	lineItems: [
		{ description: "Organic Farm Produce Wholesale Supply", quantity: 1, amount: 2150000.0 },
		{ description: "Cold-Chain Logistics & Direct Store Delivery", quantity: 1, amount: 885185.0 },
		{ description: "Quality Assurance & Agro-Packaging Suite", quantity: 1, amount: 1250000.0 },
	],
	paymentMethod: "Instant Bank Transfer / Flutterwave",
	transactionRef: "GP-TX-89104812",
	statusText: "PAID",
};

export function ReceiptPrinter({
	receipt = DEFAULT_RECEIPT,
	autoStart = false,
	onComplete,
	className,
	showActions = true,
}: ReceiptPrinterProps) {
	const [printState, setPrintState] = useState<"idle" | "printing" | "stamping" | "completed">(
		autoStart ? "printing" : "idle",
	);
	const [isTorn, setIsTorn] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const receiptRef = useRef<HTMLDivElement>(null);

	const mergedReceipt: ReceiptData = {
		...DEFAULT_RECEIPT,
		...receipt,
		lineItems: receipt.lineItems && receipt.lineItems.length > 0 ? receipt.lineItems : DEFAULT_RECEIPT.lineItems,
	};

	const formattedAmount = (amount?: number, curr = "NGN") => {
		const val = amount ?? mergedReceipt.amount ?? 0;
		if (curr === "NGN") {
			return `₦${val.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
		}
		return `${curr} ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	};

	const handleStartPrint = () => {
		setIsTorn(false);
		setPrintState("printing");
		audioSynth.playPrinting(2.0);

		setTimeout(() => {
			setPrintState("stamping");
			audioSynth.playStamp();
			setTimeout(() => {
				setPrintState("completed");
				onComplete?.();
			}, 600);
		}, 1800);
	};

	useEffect(() => {
		if (autoStart) {
			handleStartPrint();
		}
	}, []);

	const handleTear = () => {
		audioSynth.playTear();
		setIsTorn(true);
		setTimeout(() => {
			if (typeof window !== "undefined") {
				window.print();
			}
		}, 450);
	};

	const handleCopy = () => {
		const summary = [
			`=========================================`,
			mergedReceipt.agencyName,
			`=========================================`,
			`Receipt No: ${mergedReceipt.receiptNumber}`,
			`Date: ${mergedReceipt.date}`,
			`Client: ${mergedReceipt.clientName}`,
			`Total: ${formattedAmount(mergedReceipt.amount, mergedReceipt.currency)} (${mergedReceipt.currency === "NGN" ? "Naira" : mergedReceipt.currency})`,
			`Status: ${mergedReceipt.statusText ?? "PAID"}`,
			`Method: ${mergedReceipt.paymentMethod}`,
			`Ref: ${mergedReceipt.transactionRef}`,
			`-----------------------------------------`,
			`Items:`,
			...(mergedReceipt.lineItems?.map(
				(it) => `• ${it.quantity ?? 1}x ${it.description} - ${formattedAmount(it.amount, mergedReceipt.currency)}`,
			) ?? []),
			`-----------------------------------------`,
			`CAC Registration: ${mergedReceipt.cacReg}`,
			`=========================================`,
		].join("\n");

		navigator.clipboard.writeText(summary);
		setIsCopied(true);
		setTimeout(() => setIsCopied(false), 2000);
	};

	const toggleSound = () => {
		const next = !isMuted;
		setIsMuted(next);
		audioSynth.isMuted = next;
	};

	return (
		<div className={cn("flex flex-col items-center justify-center w-full max-w-md mx-auto select-none", className)}>
			{/* Audio SFX Toggle */}
			<div className="w-full flex justify-end mb-2 pr-2">
				<button
					onClick={toggleSound}
					type="button"
					aria-label={isMuted ? "Unmute SFX" : "Mute SFX"}
					className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-black/5 cursor-pointer"
				>
					{isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-primary-600" />}
					<span className="font-mono text-[11px]">{isMuted ? "Muted" : "Audio SFX"}</span>
				</button>
			</div>

			{/* Initial Trigger State */}
			{printState === "idle" && (
				<div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full text-center space-y-4">
					<div className="h-16 w-16 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 shadow-sm">
						<Printer size={32} />
					</div>
					<div>
						<h3 className="font-semibold text-xl text-gray-900 dark:text-white">Advance Receipt Print</h3>
						<p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
							Generate an authentic official invoice receipt with itemized breakdown &amp; CAC verification.
						</p>
					</div>
					<Button
						onClick={handleStartPrint}
						variant="filled"
						size="lg"
						className="w-full font-semibold shadow-lg active:scale-[0.98] transition-all"
						leftIcon={Printer}
					>
						Print Receipt
					</Button>
				</div>
			)}

			{/* Printing Stage */}
			{printState !== "idle" && (
				<div className="w-full relative flex flex-col items-center">
					{/* Mechanical Printer Slot */}
					<div className="relative z-30 w-full max-w-[340px] sm:max-w-[370px]">
						<div className="h-5 bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-950 rounded-t-xl border-t border-x border-neutral-700 shadow-2xl flex items-center justify-between px-4">
							<div className="flex items-center gap-1.5">
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
								<span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase">
									{printState === "printing" ? "FEEDING PAPER..." : "THERMAL PRINTER READY"}
								</span>
							</div>
							<div className="flex gap-1">
								<div className="h-1 w-3 bg-neutral-700 rounded-full"></div>
								<div className="h-1 w-1 bg-neutral-700 rounded-full"></div>
							</div>
						</div>
						<div className="h-3 bg-black border-x-4 border-neutral-900 shadow-[inset_0_4px_8px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden">
							<div className="h-[2px] w-4/5 bg-neutral-800/80 blur-[0.5px]"></div>
						</div>
					</div>

					{/* Paper Container */}
					<div className="relative w-full max-w-[330px] sm:max-w-[360px] overflow-hidden -mt-1 pt-1 pb-4">
						<div
							ref={receiptRef}
							className={cn(
								"relative bg-[#FCFAF6] text-neutral-900 px-6 pt-6 pb-4 rounded-b-none shadow-2xl transition-all duration-700 origin-top border-x border-b border-neutral-300 font-sans",
								printState === "printing" && "animate-receipt-feed",
								isTorn && "animate-receipt-tear opacity-0 pointer-events-none",
							)}
							style={{
								filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.35))",
								backgroundImage: `radial-gradient(#E8E2D5 0.75px, transparent 0.75px)`,
								backgroundSize: "16px 16px",
							}}
						>
							<div className="text-center pb-4 border-b border-dashed border-neutral-400/80">
								<div className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-primary-800 text-white font-mono text-[10px] tracking-widest uppercase mb-1.5 font-bold">
									OFFICIAL RECEIPT
								</div>
								<h4 className="font-mono font-black text-xs sm:text-sm uppercase tracking-wider text-neutral-900 leading-tight">
									{mergedReceipt.agencyName}
								</h4>
								<div className="flex justify-between items-center text-[10px] font-mono text-neutral-600 mt-2">
									<span>NO: {mergedReceipt.receiptNumber}</span>
									<span>{mergedReceipt.date}</span>
								</div>
								<div className="text-[10px] font-mono text-left text-neutral-800 font-semibold mt-1">
									CLIENT: {mergedReceipt.clientName}
								</div>
							</div>

							{/* Amount Box */}
							<div className="py-4 text-center border-b border-dashed border-neutral-400/80 relative">
								<p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-semibold">
									TOTAL AMOUNT PAID
								</p>
								<h2 className="font-mono font-extrabold text-2xl sm:text-3xl text-neutral-950 tracking-tight mt-0.5">
									{formattedAmount(mergedReceipt.amount, mergedReceipt.currency)}
								</h2>
								<span className="inline-block text-[11px] font-mono font-bold text-neutral-600 uppercase tracking-widest mt-0.5">
									{mergedReceipt.currency === "NGN" ? "Nigerian Naira (₦)" : mergedReceipt.currency}
								</span>

								{/* PAID STAMP */}
								{(printState === "stamping" || printState === "completed") && (
									<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
										<div className="border-[3.5px] border-red-600/90 text-red-600 font-mono font-black text-3xl sm:text-4xl px-5 py-1 rounded-md uppercase tracking-widest shadow-sm rotate-[-14deg] animate-stamp-impact bg-red-600/5 backdrop-blur-[0.5px]">
											PAID
											<span className="block text-[8px] tracking-normal font-sans font-extrabold text-red-600/90 text-center -mt-1">
												VERIFIED PAYMENT
											</span>
										</div>
									</div>
								)}
							</div>

							{/* Line Items */}
							<div className="py-3 border-b border-dashed border-neutral-400/80 text-[11px] font-mono space-y-2">
								<div className="flex justify-between font-bold text-neutral-500 text-[9px] uppercase tracking-wider pb-1">
									<span>ITEM / DESCRIPTION</span>
									<span>AMOUNT</span>
								</div>
								{mergedReceipt.lineItems?.map((item, idx) => (
									<div key={item.id || idx} className="flex justify-between items-start gap-2">
										<span className="text-neutral-800 leading-snug">
											<strong className="text-neutral-950">{item.quantity ?? 1}X</strong> {item.description}
										</span>
										<span className="font-semibold text-neutral-950 flex-shrink-0">
											{formattedAmount(item.amount, mergedReceipt.currency)}
										</span>
									</div>
								))}
							</div>

							{/* Metadata */}
							<div className="py-2.5 border-b border-dashed border-neutral-400/80 text-[10px] font-mono text-neutral-600 space-y-1">
								<div className="flex justify-between">
									<span>METHOD:</span>
									<span className="font-semibold text-neutral-900">{mergedReceipt.paymentMethod}</span>
								</div>
								<div className="flex justify-between">
									<span>REF:</span>
									<span className="font-semibold text-neutral-900">{mergedReceipt.transactionRef}</span>
								</div>
							</div>

							{/* Footer with Barcode & CAC */}
							<div className="pt-3 pb-1 flex items-center justify-between gap-3">
								<div className="flex flex-col space-y-1">
									<div className="h-12 w-12 bg-neutral-900 text-white flex items-center justify-center font-mono text-[9px] font-bold rounded p-1 text-center leading-none">
										QR VERIFIED
									</div>
									<span className="text-[8px] font-mono text-neutral-500">Scan to Verify</span>
								</div>

								<div className="flex-1 flex flex-col items-end">
									<div className="flex items-center gap-[2.5px] h-9 px-1 bg-white/60 rounded">
										{[4, 2, 6, 1, 5, 2, 4, 1, 7, 3, 2, 5, 1, 6, 2, 4, 3, 1, 5, 2, 4].map((h, i) => (
											<div
												key={i}
												className="bg-neutral-900 w-[2.5px] rounded-[0.5px]"
												style={{ height: `${Math.max(14, h * 4.5)}px` }}
											/>
										))}
									</div>
									<p className="text-[9px] font-mono font-bold text-neutral-700 mt-1 uppercase">
										CAC Reg: {mergedReceipt.cacReg}
									</p>
									<p className="text-[8px] font-mono text-neutral-500">Green Pastures Farms Ltd</p>
								</div>
							</div>

							{/* Jagged Sawtooth Edge */}
							<div className="absolute -bottom-3 left-0 right-0 h-3 overflow-hidden">
								<svg className="w-full h-3 text-[#FCFAF6]" viewBox="0 0 360 12" preserveAspectRatio="none" fill="currentColor">
									<path d="M0,0 L10,12 L20,0 L30,12 L40,0 L50,12 L60,0 L70,12 L80,0 L90,12 L100,0 L110,12 L120,0 L130,12 L140,0 L150,12 L160,0 L170,12 L180,0 L190,12 L200,0 L210,12 L220,0 L230,12 L240,0 L250,12 L260,0 L270,12 L280,0 L290,12 L300,0 L310,12 L320,0 L330,12 L340,0 L350,12 L360,0 V0 H0 Z" />
								</svg>
							</div>
						</div>
					</div>

					{/* Success Badge */}
					{printState === "completed" && !isTorn && (
						<div className="flex items-center gap-2 mt-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold">
							<CheckCircle2 size={16} />
							<span>Payment Verified • Receipt Printed</span>
						</div>
					)}

					{/* Action Buttons */}
					{showActions && printState === "completed" && (
						<div className="w-full max-w-[340px] sm:max-w-[370px] grid grid-cols-3 gap-2 mt-4">
							<Button
								variant="outlined"
								size="sm"
								onClick={handleStartPrint}
								className="text-xs flex items-center justify-center gap-1.5 h-9"
							>
								<RotateCcw size={14} />
								<span>Re-print</span>
							</Button>

							<Button
								variant="outlined"
								size="sm"
								onClick={handleTear}
								disabled={isTorn}
								className="text-xs flex items-center justify-center gap-1.5 h-9 border-amber-500/40 text-amber-600 hover:bg-amber-50"
							>
								<Scissors size={14} />
								<span>{isTorn ? "Torn!" : "Tear off"}</span>
							</Button>

							<Button
								variant="outlined"
								size="sm"
								onClick={handleCopy}
								className="text-xs flex items-center justify-center gap-1.5 h-9"
							>
								{isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
								<span>{isCopied ? "Copied" : "Copy"}</span>
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default ReceiptPrinter;
