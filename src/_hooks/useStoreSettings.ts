import { useMemo } from "react";
import { useAppSelector } from "@/_redux/store";

/** Raw admin-owned storefront settings (see settings.reducer). */
export function useStoreSettings() {
	return useAppSelector((state) => state.settings);
}

// Tax-rate percent/fraction conversions live in @/_utils/rate — kept free of
// React and redux imports so they can be unit tested with `node --test`.

/** Storefront kill-switch for the "was ₦X / -Y%" sale treatment. */
export function useShowDiscountBadges(): boolean {
	return useAppSelector((state) => state.settings.showDiscountBadges);
}

/** Admin kill-switch for showing foreign visitors converted prices. */
export function useMultiCurrencyEnabled(): boolean {
	return useAppSelector((state) => state.settings.multiCurrencyEnabled);
}

export interface FreeShippingProgress {
	threshold: number;
	shippingFee: number;
	/** Naira still needed to qualify; 0 once qualified. */
	remaining: number;
	qualifies: boolean;
	/** 0-100, for progress bars. */
	percent: number;
	/** Shipping actually payable on this subtotal. */
	shipping: number;
	/** False when no threshold is configured — callers should hide the promo. */
	isActive: boolean;
}

/**
 * Derives free-shipping progress from the admin threshold. Centralised because
 * the cart page, the promo banner and the product page all showed this and had
 * drifted onto different numbers (one used a hardcoded 50000 constant).
 */
export function useFreeShipping(subtotal: number): FreeShippingProgress {
	const { freeShippingThreshold, shippingFee } = useStoreSettings();

	return useMemo(() => {
		const threshold = Number(freeShippingThreshold) || 0;
		const fee = Number(shippingFee) || 0;
		const qualifies = threshold > 0 && subtotal >= threshold;

		return {
			threshold,
			shippingFee: fee,
			remaining: Math.max(0, threshold - subtotal),
			qualifies,
			percent: threshold > 0 ? Math.min(100, (subtotal / threshold) * 100) : 0,
			shipping: qualifies ? 0 : fee,
			isActive: threshold > 0,
		};
	}, [subtotal, freeShippingThreshold, shippingFee]);
}
