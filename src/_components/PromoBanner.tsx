"use client";

import React from "react";
import { useAppSelector } from "@/_redux/store";
import { useFreeShipping } from "@/_hooks/useStoreSettings";
import { Truck } from "lucide-react";

const PromoBanner: React.FC = () => {
	const { total, itemCount } = useAppSelector((state) => state.cart);
	const { qualifies, remaining, percent, isActive } = useFreeShipping(total || 0);

	// Nothing to promote on an empty cart, or when no admin threshold is set.
	if (itemCount === 0 || !isActive) return null;

	return (
		<div
			role="status"
			aria-live="polite"
			className={`w-full text-white py-2 md:py-3 shadow-md transition-all duration-500 ${
				qualifies ? "bg-green-700" : "bg-green-600"
			}`}
		>
			<div className="mx-auto flex max-w-3xl flex-col items-center gap-1.5 px-4 sm:gap-2">
				<div className="flex items-center gap-2 text-center text-xs font-medium sm:text-sm md:text-base">
					<Truck className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
					{qualifies ? (
						<span>
							🎉 You&apos;ve unlocked <b>Free Shipping</b>!
						</span>
					) : (
						<span>
							<b>₦{remaining.toLocaleString()}</b> away from{" "}
							<b>Free Shipping</b> 🚀
						</span>
					)}
				</div>

				{/* Progress bar — the emotional nudge: shows how close they are. */}
				{!qualifies && (
					<div
						className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/25"
						role="progressbar"
						aria-valuenow={Math.round(percent)}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-label="Progress toward free shipping"
					>
						<div
							className="h-full rounded-full bg-white transition-all duration-500 ease-out"
							style={{ width: `${percent}%` }}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default PromoBanner;
